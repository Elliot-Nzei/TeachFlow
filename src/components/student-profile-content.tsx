
'use client';
import { useState, useMemo, useContext, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, CalendarCheck, CheckCircle, XCircle, Clock, Star, Edit, UserCircle2, Home, KeyRound, Clipboard, Save, X } from 'lucide-react';
import { useDoc, useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, writeBatch, getDocs, arrayRemove, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
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
import { useRouter } from 'next/navigation';
import ReportCardGenerator from './report-card-generator';
import { Input } from './ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Class } from '@/lib/types';

const TRAIT_DEFINITIONS = {
    affective: ['Punctuality', 'Neatness', 'Honesty', 'Cooperation', 'Attentiveness'],
    psychomotor: ['Handwriting', 'Games & Sports', 'Drawing & Painting', 'Musical Skills']
}

function TraitEditor({ student, readOnly = false }: { student: any, readOnly?: boolean }) {
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

    useEffect(() => {
        if (isLoadingTraits) return; // Wait for loading to finish

        const allTraitsList = [...TRAIT_DEFINITIONS.affective, ...TRAIT_DEFINITIONS.psychomotor];
        if (traitsData && traitsData.length > 0 && traitsData[0].traits) {
            setTraitRatings(traitsData[0].traits);
        } else {
            // Set default ratings only if not loading and no data exists
            const initialRatings: Record<string, number> = {};
            allTraitsList.forEach(trait => initialRatings[trait] = 3); // Default to 'Good'
            setTraitRatings(initialRatings);
        }
    }, [traitsData, isLoadingTraits]);
    

    const handleRatingChange = (trait: string, value: number[]) => {
        setTraitRatings(prev => ({...prev, [trait]: value[0]}));
    }

    const handleSaveTraits = async () => {
        if (readOnly || !user || !student || !term || !session) {
            toast({
                variant: 'destructive',
                title: 'Permission Denied',
                description: 'Cannot save traits in read-only mode.',
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

    if (isLoadingTraits && !readOnly) {
        return <Skeleton className="h-64 w-full" />
    }

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <h4 className="font-semibold mb-4 border-b pb-2">Affective Traits</h4>
                    <div className="space-y-4">
                        {TRAIT_DEFINITIONS.affective.map(trait => (
                            <div key={trait} className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor={trait}>{trait}</Label>
                                    <span className="text-sm font-medium text-primary w-20 text-center">{getRatingText(traitRatings[trait] || 3)}</span>
                                </div>
                                <Slider 
                                    id={trait}
                                    min={1} max={5} step={1}
                                    value={[traitRatings[trait] || 3]}
                                    onValueChange={(val) => handleRatingChange(trait, val)}
                                    disabled={readOnly}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold mb-4 border-b pb-2">Psychomotor Skills</h4>
                    <div className="space-y-4">
                        {TRAIT_DEFINITIONS.psychomotor.map(trait => (
                            <div key={trait} className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor={trait}>{trait}</Label>
                                    <span className="text-sm font-medium text-primary w-20 text-center">{getRatingText(traitRatings[trait] || 3)}</span>
                                </div>
                                <Slider 
                                    id={trait}
                                    min={1} max={5} step={1}
                                    value={[traitRatings[trait] || 3]}
                                    onValueChange={(val) => handleRatingChange(trait, val)}
                                    disabled={readOnly}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {!readOnly && (
                <div className="mt-6">
                    <Button onClick={handleSaveTraits}>Save Traits</Button>
                </div>
            )}
        </div>
    )
}

function StudentProfileContent({ studentId, student: initialStudent, readOnly = false }: { studentId?: string, student?: any, readOnly?: boolean }) {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('academic-record');
  const [isEditing, setIsEditing] = useState(false);
  const [editingClassId, setEditingClassId] = useState('');
  const isMobile = useIsMobile();
  
  const studentDocQuery = useMemoFirebase(() => (user && studentId && !readOnly) ? doc(firestore, 'users', user.uid, 'students', studentId) : null, [firestore, user, studentId, readOnly]);
  const { data: studentFromDb, isLoading: isLoadingStudent } = useDoc<any>(studentDocQuery);

  const student = readOnly ? initialStudent : studentFromDb;

  useEffect(() => {
    if (student) {
        setEditingClassId(student.classId || 'unassigned');
    }
  }, [student]);
  
  const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);
  
  const gradesQuery = useMemoFirebase(() => (user && student?.id) ? query(collection(firestore, 'users', user.uid, 'grades'), where('studentId', '==', student.id)) : null, [firestore, user, student?.id]);
  const { data: gradesForStudent, isLoading: isLoadingGrades } = useCollection<any>(gradesQuery);
  
  const attendanceQuery = useMemoFirebase(() => (user && student?.id) ? query(collection(firestore, 'users', user.uid, 'attendance'), where('studentId', '==', student.id)) : null, [firestore, user, student?.id]);
  const { data: attendanceForStudent, isLoading: isLoadingAttendance } = useCollection<any>(attendanceQuery);

  const displayGrades = readOnly ? (student.grades || []) : gradesForStudent;
  const displayAttendance = readOnly ? (student.attendance || []) : attendanceForStudent;

  const attendanceSummary = useMemo(() => {
    if (!displayAttendance) {
      return { present: 0, absent: 0, late: 0, total: 0 };
    }
    return {
      present: displayAttendance.filter((a:any) => a.status === 'Present').length,
      absent: displayAttendance.filter((a:any) => a.status === 'Absent').length,
      late: displayAttendance.filter((a:any) => a.status === 'Late').length,
      total: displayAttendance.length,
    };
  }, [displayAttendance]);

  const handleCopyParentId = useCallback(() => {
    if (student?.parentId) {
      navigator.clipboard.writeText(student.parentId).then(() => {
        toast({ title: 'Success', description: 'Parent ID copied to clipboard.' });
      }).catch(err => {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not copy Parent ID.' });
      });
    }
  }, [student, toast]);

  const handleSaveChanges = async () => {
    if (readOnly || !student || !user || editingClassId === student.classId) {
        setIsEditing(false);
        return;
    }

    const batch = writeBatch(firestore);
    const studentRef = doc(firestore, 'users', user.uid, 'students', student.id);
    
    // 1. Remove student from old class (if they had one)
    if (student.classId) {
        const oldClassRef = doc(firestore, 'users', user.uid, 'classes', student.classId);
        batch.update(oldClassRef, {
            students: arrayRemove(student.id)
        });
    }

    const newClassId = editingClassId === 'unassigned' ? '' : editingClassId;
    const newClass = classes?.find(c => c.id === newClassId);

    // 2. Add student to new class (if one is selected)
    if (newClass) {
        const newClassRef = doc(firestore, 'users', user.uid, 'classes', newClass.id);
        batch.update(newClassRef, {
            students: arrayUnion(student.id)
        });
    }

    // 3. Update the student's document
    batch.update(studentRef, {
        classId: newClass?.id || '',
        className: newClass?.name || ''
    });

    try {
        await batch.commit();
        toast({
            title: 'Student Updated',
            description: `${student.name} has been moved to ${newClass?.name || 'Unassigned'}.`
        });
    } catch(err) {
        console.error("Error reassigning student:", err);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not reassign the student.'});
    } finally {
        setIsEditing(false);
    }
  };
  
  const handleDeleteStudent = async () => {
    if (readOnly || !student || !user) return;
    setIsDeleting(true);

    try {
        const batch = writeBatch(firestore);

        const studentRef = doc(firestore, 'users', user.uid, 'students', student.id);
        batch.delete(studentRef);

        const collectionsToDelete = ['grades', 'attendance', 'traits', 'payments'];
        for (const coll of collectionsToDelete) {
            const q = query(collection(firestore, 'users', user.uid, coll), where('studentId', '==', student.id));
            const snapshot = await getDocs(q);
            snapshot.forEach(docToDelete => {
                batch.delete(docToDelete.ref);
            });
        }

        if (student.classId) {
            const classRef = doc(firestore, 'users', user.uid, 'classes', student.classId);
            batch.update(classRef, {
                students: arrayRemove(student.id)
            });
        }
        
        await batch.commit();

        toast({
            title: 'Student Deleted',
            description: `${student.name} and all associated records have been permanently removed.`,
        });

        router.push('/students');

    } catch (error) {
        console.error("Error deleting student and their data:", error);
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: 'Could not completely delete the student and their records. Please try again.',
        });
    } finally {
        setIsDeleting(false);
    }
  };
  
  const isLoading = !readOnly && (isLoadingStudent || isLoadingClasses);

  if (isLoading) {
    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-20" />
                </div>
            </div>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
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
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback className="text-3xl">{student.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold font-headline">{student.name}</h2>
                    <p className="font-mono text-sm text-muted-foreground">{student.studentId}</p>
                    {isEditing ? (
                         <div className="flex items-center gap-2 pt-1">
                             <Select value={editingClassId} onValueChange={setEditingClassId}>
                                <SelectTrigger className="w-[200px] h-9">
                                    <SelectValue placeholder="Select class..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleSaveChanges}><Save className="h-4 w-4"/></Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setIsEditing(false)}><X className="h-4 w-4"/></Button>
                        </div>
                    ) : (
                       <div className="flex items-center gap-2">
                        {student.className ? <Badge variant="outline" className="mt-1">{student.className}</Badge> : <Badge variant="destructive" className="mt-1">Unassigned</Badge>}
                         {!readOnly && <Button variant="ghost" size="icon" className="h-7 w-7 mt-1" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4" /></Button>}
                       </div>
                    )}
                </div>
            </div>
            {!readOnly && !isEditing && (
                 <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Student
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
            )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                    {student.address ? (
                        <div className="text-sm">
                            <p className="text-muted-foreground">Address</p>
                            <p className="font-medium">{student.address}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No residential address provided.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserCircle2 className="h-5 w-5" /> Parent/Guardian</CardTitle>
                </CardHeader>
                <CardContent>
                    {(student.guardianName || student.guardianPhone || student.guardianEmail) ? (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {student.guardianName && <div><p className="text-muted-foreground">Name</p><p className="font-medium">{student.guardianName}</p></div>}
                            {student.guardianPhone && <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{student.guardianPhone}</p></div>}
                            {student.guardianEmail && <div className="col-span-2"><p className="text-muted-foreground">Email</p><p className="font-medium">{student.guardianEmail}</p></div>}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No guardian information provided.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Parent Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="parent-id">Unique Parent ID</Label>
                        <div className="flex items-center gap-2">
                           <Input id="parent-id" readOnly value={student.parentId || 'N/A'} />
                           {!readOnly && (
                            <Button variant="outline" size="icon" onClick={handleCopyParentId} disabled={!student.parentId}>
                                <Clipboard className="h-4 w-4" />
                            </Button>
                           )}
                        </div>
                        <p className="text-xs text-muted-foreground">Share this ID with the parent for portal access.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4 md:p-6 pt-0">
        {isMobile ? (
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full mb-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="academic-record">Academic Record</SelectItem>
              <SelectItem value="attendance">Attendance</SelectItem>
              <SelectItem value="traits">Behavioral Traits</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="academic-record">Academic Record</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="traits">Behavioral Traits</TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="academic-record" className="mt-6">
             <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Academic Record</CardTitle>
                        <CardDescription>Grades for all sessions.</CardDescription>
                    </div>
                     {!readOnly && (
                       <ReportCardGenerator studentId={student.id} buttonLabel="Generate Term Report" buttonVariant="secondary" />
                    )}
                </CardHeader>
                <CardContent>
                     <div className="md:hidden space-y-3">
                        {(isLoadingGrades && !readOnly) ? <Skeleton className="h-24 w-full" /> : 
                        displayGrades && displayGrades.length > 0 ? (
                            displayGrades.map((grade: any) => (
                                <Card key={grade.id} className="border-l-4 border-primary">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">{grade.subject}</CardTitle>
                                        <CardDescription>{grade.term}, {grade.session}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex justify-between items-center">
                                        <div>
                                            <p className="text-muted-foreground text-sm">Total Score</p>
                                            <p className="font-semibold">{grade.total}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-sm">Grade</p>
                                            <p className="font-bold text-lg text-right">{grade.grade}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No grades recorded yet.</p>
                        )}
                    </div>
                    <div className="hidden md:block">
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
                                {(isLoadingGrades && !readOnly) ? (
                                <TableRow><TableCell colSpan={5}><Skeleton className="h-24 w-full" /></TableCell></TableRow> 
                                ) : displayGrades && displayGrades.length > 0 ? (
                                    displayGrades.map((grade: any) => (
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
                    </div>
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
                        {(isLoadingAttendance && !readOnly) ? <Skeleton className="h-48 w-full" /> : 
                        displayAttendance && displayAttendance.length > 0 ? (
                            displayAttendance.sort((a:any,b:any) => b.date.localeCompare(a.date)).map((att: any) => (
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
                    <TraitEditor student={student} readOnly={readOnly} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default StudentProfileContent;
