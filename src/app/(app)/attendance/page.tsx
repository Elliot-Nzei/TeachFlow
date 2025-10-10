'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, Save, Users, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import type { Class, Student } from '@/lib/types';
import { useCollection, useFirebase, useUser as useAuthUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, writeBatch, getDocs, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type AttendanceStatus = 'Present' | 'Absent' | 'Late';
type AttendanceRecord = { studentId: string; status: AttendanceStatus; name: string; avatarUrl: string; recordId?: string; };

function AttendanceTaker({ selectedClass, onBack }: { selectedClass: Class, onBack: () => void }) {
  const { firestore, user } = useFirebase();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  const userProfileQuery = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<any>(userProfileQuery);

  const studentsQuery = useMemoFirebase(() => (user && selectedClass) ? query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', selectedClass.id)) : null, [firestore, user, selectedClass]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  
  useEffect(() => {
    if (!students || !date) {
      setAttendance([]);
      return;
    };

    const formattedDate = format(date, 'yyyy-MM-dd');
    const fetchAttendance = async () => {
        if(!user || !selectedClass) return;

        const attendanceQuery = query(
            collection(firestore, 'users', user.uid, 'attendance'),
            where('classId', '==', selectedClass.id),
            where('date', '==', formattedDate)
        );
        const querySnapshot = await getDocs(attendanceQuery);
        const existingRecords = new Map(querySnapshot.docs.map(d => [d.data().studentId, { ...d.data(), id: d.id }]));
        
        const newAttendance = students.map(student => {
            const existing = existingRecords.get(student.id);
            return {
                studentId: student.id,
                name: student.name,
                avatarUrl: student.avatarUrl,
                status: existing?.status || 'Present',
                recordId: existing?.id,
            };
        });

        setAttendance(newAttendance);
    };

    fetchAttendance();

  }, [students, date, user, firestore, selectedClass]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => prev.map(rec => rec.studentId === studentId ? { ...rec, status } : rec));
  };

  const handleSaveAttendance = async () => {
    if (!user || !selectedClass || !date) {
        toast({ variant: 'destructive', title: 'Error', description: 'User, class, or date is not available. Cannot save.' });
        return;
    }

    if (!userProfile || !userProfile.currentTerm || !userProfile.currentSession) {
        toast({
            variant: 'destructive',
            title: 'Missing Academic Information',
            description: 'Please set the current term and session in your settings before saving attendance.',
        });
        return;
    }
    
    const batch = writeBatch(firestore);
    const formattedDate = format(date, 'yyyy-MM-dd');

    attendance.forEach(record => {
        const attendanceData = {
            studentId: record.studentId,
            classId: selectedClass.id,
            date: formattedDate,
            status: record.status,
            term: userProfile.currentTerm,
            session: userProfile.currentSession,
        };
        
        const recordId = record.recordId;
        const docRef = recordId
          ? doc(firestore, 'users', user.uid, 'attendance', recordId)
          : doc(collection(firestore, 'users', user.uid, 'attendance'));
        
        batch.set(docRef, attendanceData, { merge: true });
    });
    
    try {
        await batch.commit();
        toast({ title: 'Success', description: `Attendance for ${selectedClass.name} on ${format(date, 'PPP')} has been saved.` });
    } catch (error) {
        console.error("Error saving attendance:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save attendance. Please check your connection or permissions.' });
    }
  };

  const StatusButton = ({ studentId, currentStatus, status }: { studentId: string, currentStatus: AttendanceStatus, status: AttendanceStatus }) => {
    const variant = currentStatus === status ? 'default' : 'outline';
    let colors = '';
    if (variant === 'default') {
      switch(status) {
        case 'Present': colors = 'bg-green-500 hover:bg-green-600 text-white'; break;
        case 'Absent': colors = 'bg-red-500 hover:bg-red-600 text-white'; break;
        case 'Late': colors = 'bg-yellow-500 hover:bg-yellow-600 text-white'; break;
      }
    }

    return (
        <Button 
            variant={variant}
            size="sm"
            className={cn("w-full sm:w-auto", colors)}
            onClick={() => handleStatusChange(studentId, status)}
        >
            {status}
        </Button>
    )
  };
  
  const isLoading = isLoadingStudents || isLoadingProfile;

  return (
    <Card className="h-full">
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>{selectedClass.name} - Attendance</CardTitle>
                    <CardDescription>Mark daily attendance for each student.</CardDescription>
                </div>
                <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Classes</Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full sm:w-[280px] justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <Button onClick={handleSaveAttendance} disabled={isLoading || attendance.length === 0} className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Save Attendance
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            ) : attendance.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendance.map(record => (
                            <TableRow key={record.studentId}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={record.avatarUrl} alt={record.name} />
                                            <AvatarFallback>{record.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{record.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                                        <StatusButton studentId={record.studentId} currentStatus={record.status} status="Present" />
                                        <StatusButton studentId={record.studentId} currentStatus={record.status} status="Absent" />
                                        <StatusButton studentId={record.studentId} currentStatus={record.status} status="Late" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center h-48 flex items-center justify-center text-muted-foreground">
                    <p>No students in this class.</p>
                </div>
            )}
        </CardContent>
    </Card>
  )
}

function ClassSelector({ onSelectClass }: { onSelectClass: (cls: Class) => void }) {
    const { firestore, user } = useFirebase();
    const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
    const { data: classes, isLoading } = useCollection<Class>(classesQuery);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-headline">Attendance</h1>
                <p className="text-muted-foreground">Select a class to begin marking attendance.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? Array.from({length: 3}).map((_, i) => (
                    <Card key={i}><CardContent className="h-40 bg-muted rounded-lg animate-pulse" /></Card>
                )) : classes?.map((cls) => (
                    <Card key={cls.id} onClick={() => onSelectClass(cls)} className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="font-headline">{cls.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{cls.students?.length || 0} Students</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  if (selectedClass) {
    return <AttendanceTaker selectedClass={selectedClass} onBack={() => setSelectedClass(null)} />;
  }
  
  return <ClassSelector onSelectClass={setSelectedClass} />;
}
