
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, PanelLeft, Save } from 'lucide-react';
import { format } from 'date-fns';
import ClassSidebar from '@/components/class-sidebar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { Class, Student } from '@/lib/types';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, writeBatch, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type AttendanceStatus = 'Present' | 'Absent' | 'Late';
type AttendanceRecord = { studentId: string; status: AttendanceStatus; name: string; avatarUrl: string };

export default function AttendancePage() {
  const { firestore, user } = useFirebase();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

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
                // @ts-ignore
                recordId: existing?.id,
            };
        });

        setAttendance(newAttendance);
    };

    fetchAttendance();

  }, [students, date, user, firestore, selectedClass]);

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    setIsSidebarOpen(false);
  };
  
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => prev.map(rec => rec.studentId === studentId ? { ...rec, status } : rec));
  };

  const handleSaveAttendance = async () => {
    if (!user || !selectedClass || !date) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a class and date.' });
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
            term: "First Term",
            session: "2023/2024",
        };
        
        // @ts-ignore
        const recordId = record.recordId;
        const docRef = recordId
          ? doc(firestore, 'users', user.uid, 'attendance', recordId)
          : doc(collection(firestore, 'users', user.uid, 'attendance'));
        
        if (recordId) {
          batch.update(docRef, { status: record.status });
        } else {
          batch.set(docRef, attendanceData);
        }
    });
    
    await batch.commit();
    toast({ title: 'Success', description: `Attendance for ${selectedClass.name} on ${format(date, 'PPP')} has been saved.` });
  };

  return (
    <div className="grid md:grid-cols-[250px_1fr] gap-8 items-start">
        <div className="hidden md:block sticky top-20">
            <ClassSidebar selectedClass={selectedClass} onSelectClass={handleSelectClass} />
        </div>
      
        <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4 mb-4 md:hidden">
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline">
                        <PanelLeft className="mr-2 h-4 w-4" /> Select Class
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0">
                        <SheetHeader>
                        <SheetTitle className="sr-only">Select Class</SheetTitle>
                        <SheetDescription className="sr-only">Choose a class from the list to manage attendance.</SheetDescription>
                        </SheetHeader>
                        <ClassSidebar selectedClass={selectedClass} onSelectClass={handleSelectClass} />
                    </SheetContent>
                </Sheet>
                {selectedClass && <h2 className="font-bold text-lg">{selectedClass.name}</h2>}
            </div>

            {selectedClass ? (
            <Card>
                <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <CardTitle className="font-headline hidden md:block">{selectedClass.name} - Attendance</CardTitle>
                    <CardDescription className="hidden md:block">Mark daily attendance for each student.</CardDescription>
                </div>
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
                    <Button onClick={handleSaveAttendance} disabled={attendance.length === 0} className="w-full sm:w-auto">
                        <Save className="mr-2 h-4 w-4" />
                        Save Attendance
                    </Button>
                </div>
                </CardHeader>
                <CardContent>
                    {isLoadingStudents && <div className="space-y-4">
                    {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>}
                    {!isLoadingStudents && attendance.length > 0 ? (
                        <div className="space-y-4">
                            {attendance.map(record => (
                                <div key={record.studentId} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 border rounded-lg gap-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={record.avatarUrl} alt={record.name} />
                                            <AvatarFallback>{record.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{record.name}</span>
                                    </div>
                                    <RadioGroup 
                                        defaultValue={record.status} 
                                        onValueChange={(status: AttendanceStatus) => handleStatusChange(record.studentId, status)} 
                                        className="flex gap-4 pl-14 md:pl-0"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Present" id={`present-${record.studentId}`} />
                                            <Label htmlFor={`present-${record.studentId}`}>Present</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Absent" id={`absent-${record.studentId}`} />
                                            <Label htmlFor={`absent-${record.studentId}`}>Absent</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Late" id={`late-${record.studentId}`} />
                                            <Label htmlFor={`late-${record.studentId}`}>Late</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            ))}
                        </div>
                    ): !isLoadingStudents && <p className="text-muted-foreground text-center">No students in this class.</p>}
                </CardContent>
            </Card>
            ) : (
                <Card className="flex items-center justify-center h-full min-h-[400px] text-center">
                    <div className="text-muted-foreground">
                        <p>Select a class to mark attendance.</p>
                    </div>
                </Card>
            )}
        </div>
    </div>
  );
}
