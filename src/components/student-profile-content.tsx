
'use client';
import { useState, useMemo, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trash2, CalendarCheck, CheckCircle, XCircle, Clock, Star, Edit } from 'lucide-react';
import { useDoc, useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, writeBatch, getDocs, arrayRemove, updateDoc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SettingsContext } from '@/contexts/settings-context';

const TRAIT_DEFINITIONS = {
    affective: ['Punctuality', 'Neatness', 'Honesty', 'Cooperation', 'Attentiveness'],
    psychomotor: ['Handwriting', 'Games & Sports', 'Drawing & Painting', 'Musical Skills']
}

function TraitEditor({ student }: { student: any }) {
    const { firestore, user } = useFirebase();
    const { settings } = useContext(SettingsContext);
    const { toast } = useToast();
    const [term, setTerm] = useState(settings?.currentTerm || 'First Term');
    const [session, setSession] = useState(settings?.currentSession || '');

    const traitsQuery = useMemoFirebase(() => 
        (user && student) 
        ? query(
            collection(firestore, 'users', user.uid, 'traits'), 
            where('studentId', '==', student.id),
            where('term', '==', term),
            where('session', '==', session)
          ) 
        : null, 
    [firestore, user, student, term, session]);
    
    const { data: traitsData, isLoading: isLoadingTraits } = useCollection<any>(traitsQuery);

    const [traitRatings, setTraitRatings] = useState<Record<string, number>>({});

    const allTraitsList = [...TRAIT_DEFINITIONS.affective, ...TRAIT_DEFINITIONS.psychomotor];

    useMemo(() => {
        if (traitsData && traitsData.length > 0) {
            setTraitRatings(traitsData[0].traits || {});
        } else {
            const initialRatings: Record<string, number> = {};
            allTraitsList.forEach(trait => initialRatings[trait] = 3);
            setTraitRatings(initialRatings);
        }
    }, [traitsData]);
    

    const handleRatingChange = (trait: string, value: number[]) => {
        setTraitRatings(prev => ({...prev, [trait]: value[0]}));
    }

    const handleSaveTraits = async () => {
        if (!user || !student || !term || !session) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Cannot save traits without student, term, or session.',
            });
            return;
        }

        const dataToSave = {
            studentId: student.id,
            studentName: student.name,
            classId: student.classId,
            className: student.className,
            term,
            session,
            traits: traitRatings,
        };

        try {
            if (traitsData && traitsData.length > 0) {
                // Update existing document
                const traitDocRef = doc(firestore, 'users', user.uid, 'traits', traitsData[0].id);
                await updateDoc(traitDocRef, dataToSave);
            } else {
                // Create new document
                const traitCollectionRef = collection(firestore, 'users', user.uid, 'traits');
                await setDoc(doc(traitCollectionRef), dataToSave);
            }
            toast({ title: 'Success', description: `Traits for ${student.name} have been saved.`});
        } catch(error) {
            console.error("Error saving traits: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save traits.'});
        }
    };
    
    const getRatingText = (rating: number) => {
        const ratings: Record<number, string> = { 5: "Excellent", 4: "Very Good", 3: "Good", 2: "Fair", 1: "Poor" };
        return ratings[rating] || "N/A";
    };

    if (isLoadingTraits) {
        return <Skeleton className="h-64 w-full" />
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h4 className="font-semibold">Affective Traits</h4>
                {TRAIT_DEFINITIONS.affective.map(trait => (
                    <div key={trait} className="grid gap-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor={trait}>{trait}</Label>
                            <span className="text-sm font-medium text-primary w-20 text-center">{getRatingText(traitRatings[trait] || 3)}</span>
                        </div>
                        <Slider 
                            id={trait}
                            min={1} max={5} step={1}
                            defaultValue={[traitRatings[trait] || 3]}
                            onValueChange={(val) => handleRatingChange(trait, val)}
                        />
                    </div>
                ))}
            </div>
            <div className="space-y-4">
                <h4 className="font-semibold">Psychomotor Skills</h4>
                {TRAIT_DEFINITIONS.psychomotor.map(trait => (
                    <div key={trait} className="grid gap-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor={trait}>{trait}</Label>
                            <span className="text-sm font-medium text-primary w-20 text-center">{getRatingText(traitRatings[trait] || 3)}</span>
                        </div>
                        <Slider 
                            id={trait}
                            min={1} max={5} step={1}
                            defaultValue={[traitRatings[trait] || 3]}
                            onValueChange={(val) => handleRatingChange(trait, val)}
                        />
                    </div>
                ))}
            </div>
            <Button onClick={handleSaveTraits}>Save Traits</Button>
        </div>
    )
}

function StudentProfileContent({ studentId }: { studentId: string }) {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const studentDocQuery = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'students', studentId) : null, [firestore, user, studentId]);
  const { data: student, isLoading: isLoadingStudent } = useDoc<any>(studentDocQuery);
  
  const classDocQuery = useMemoFirebase(() => (user && student?.classId) ? doc(firestore, 'users', user.uid, 'classes', student.classId) : null, [firestore, user, student]);
  const { data: studentClass, isLoading: isLoadingClass } = useDoc<any>(classDocQuery);

  const gradesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'grades'), where('studentId', '==', studentId)) : null, [firestore, user, studentId]);
  const { data: gradesForStudent, isLoading: isLoadingGrades } = useCollection<any>(gradesQuery);
  
  const attendanceQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'attendance'), where('studentId', '==', studentId)) : null, [firestore, user, studentId]);
  const { data: attendanceForStudent, isLoading: isLoadingAttendance } = useCollection<any>(attendanceQuery);

  const attendanceSummary = useMemo(() => {
    if (!attendanceForStudent) {
      return { present: 0, absent: 0, late: 0, total: 0 };
    }
    return {
      present: attendanceForStudent.filter(a => a.status === 'Present').length,
      absent: attendanceForStudent.filter(a => a.status === 'Absent').length,
      late: attendanceForStudent.filter(a => a.status === 'Late').length,
      total: attendanceForStudent.length,
    };
  }, [attendanceForStudent]);
  
  const handleDeleteStudent = async () => {
    if (!student || !user) return;
    setIsDeleting(true);

    try {
        const batch = writeBatch(firestore);

        const studentRef = doc(firestore, 'users', user.uid, 'students', studentId);
        batch.delete(studentRef);

        const collectionsToDelete = ['grades', 'attendance', 'traits'];
        for (const coll of collectionsToDelete) {
            const snapshot = await getDocs(query(collection(firestore, 'users', user.uid, coll), where('studentId', '==', studentId)));
            snapshot.forEach(docToDelete => {
                batch.delete(docToDelete.ref);
            });
        }

        if (student.classId) {
            const classRef = doc(firestore, 'users', user.uid, 'classes', student.classId);
            await updateDoc(classRef, {
                students: arrayRemove(studentId)
            });
        }
        
        await batch.commit();

        toast({
            title: 'Student Deleted',
            description: `${student.name} has been removed from the system.`,
        });

        router.push('/students'); // Redirect to student list

    } catch (error) {
        console.error("Error deleting student:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the student. Please try again.',
        });
    } finally {
        setIsDeleting(false);
    }
  };


  if (isLoadingStudent) {
      return (
          <div className="space-y-8 p-6">
              <div className="grid gap-8 md:grid-cols-3">
                  <div className="md:col-span-1 space-y-8">
                      <Skeleton className="h-64 w-full" />
                      <Skeleton className="h-40 w-full" />
                  </div>
                  <div className="md:col-span-2">
                      <Skeleton className="h-96 w-full" />
                  </div>
              </div>
          </div>
      )
  }

  if (!student) {
      return <div className="p-6">Student not found.</div>;
  }
  
  const AttendanceIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'Present': return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'Absent': return <XCircle className="h-5 w-5 text-red-500" />;
        case 'Late': return <Clock className="h-5 w-5 text-yellow-500" />;
        default: return null;
    }
  };

  return (
    <>
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback className="text-3xl">{student.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-bold font-headline">{student.name}</h2>
                    <p className="font-mono text-sm text-muted-foreground">{student.studentId}</p>
                    {student.className && <p className="text-muted-foreground">{student.className}</p>}
                </div>
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete <strong>{student.name}</strong> and all of their associated data, including grades, attendance, and traits.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteStudent} disabled={isDeleting}>
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="academic-record" className="p-6">
        <TabsList>
            <TabsTrigger value="academic-record">Academic Record</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="traits">Behavioral Traits</TabsTrigger>
        </TabsList>
        <TabsContent value="academic-record" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>Academic Record</CardTitle>
                    <CardDescription>Grades for all sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Term</TableHead>
                            <TableHead>Session</TableHead>
                            <TableHead>Total Score</TableHead>
                            <TableHead className="text-right">Grade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingGrades ? (
                            <TableRow><TableCell colSpan={5}><Skeleton className="h-24 w-full" /></TableCell></TableRow> 
                            ) : gradesForStudent && gradesForStudent.length > 0 ? (
                                gradesForStudent.map((grade: any) => (
                                    <TableRow key={grade.id}>
                                        <TableCell className="font-medium">{grade.subject}</TableCell>
                                        <TableCell>{grade.term}</TableCell>
                                        <TableCell>{grade.session}</TableCell>
                                        <TableCell>{grade.total}</TableCell>
                                        <TableCell className="text-right font-bold">{grade.grade}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                    No grades recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="attendance" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5"/>
                        Attendance History
                    </CardTitle>
                    <CardDescription>Full attendance record for the student.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center mb-6 border-b pb-4">
                        <div>
                            <p className="text-2xl font-bold text-green-600">{attendanceSummary.present}</p>
                            <p className="text-xs text-muted-foreground">Present</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{attendanceSummary.absent}</p>
                            <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">{attendanceSummary.late}</p>
                            <p className="text-xs text-muted-foreground">Late</p>
                        </div>
                    </div>
                     <ScrollArea className="h-72">
                        <div className="space-y-2 pr-4">
                        {isLoadingAttendance ? <Skeleton className="h-48 w-full" /> : 
                        attendanceForStudent && attendanceForStudent.length > 0 ? (
                            attendanceForStudent.sort((a,b) => b.date.localeCompare(a.date)).map((att: any) => (
                                <div key={att.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <AttendanceIcon status={att.status} />
                                        <span className="text-sm font-medium">{format(new Date(att.date), 'PPP')}</span>
                                    </div>
                                    <Badge variant={
                                        att.status === 'Present' ? 'default' : att.status === 'Absent' ? 'destructive' : 'secondary'
                                    } className={att.status === 'Present' ? 'bg-green-600' : ''}>{att.status}</Badge>
                                </div>
                            ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No records found.</p>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="traits" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Behavioral & Psychomotor Traits</CardTitle>
                    <CardDescription>Rate student's traits for the current term.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TraitEditor student={student} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default StudentProfileContent;
