
'use client';
import { useState, useMemo, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, UserPlus, GraduationCap, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDoc, useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, writeBatch, arrayUnion, arrayRemove, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Student, Class, Grade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { SettingsContext } from '@/contexts/settings-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getNextClassName } from '@/lib/utils';


function ClassDetailsContent({ classId }: { classId: string }) {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const { settings } = useContext(SettingsContext);
  const [isStudentPopoverOpen, setStudentPopoverOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  const classDocQuery = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid, 'classes', classId) : null), [firestore, user, classId]);
  const { data: classDetails, isLoading: isLoadingClass } = useDoc<Class>(classDocQuery);

  const allClassQuery = useMemoFirebase(() => (user ? query(collection(firestore, 'users', user.uid, 'classes')) : null), [firestore, user]);
  const { data: allClasses, isLoading: isLoadingAllClasses } = useCollection<Class>(allClassQuery);

  const studentsInClassQuery = useMemoFirebase(() => (user && classId) ? query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', classId)) : null, [firestore, user, classId]);
  const { data: studentsInClass, isLoading: isLoadingStudents } = useCollection<Student>(studentsInClassQuery);

  // Query for students NOT in any class, to make them available for adding
  const unassignedStudentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', '')) : null, [firestore, user]);
  const { data: unassignedStudents, isLoading: isLoadingUnassigned } = useCollection<Student>(unassignedStudentsQuery);

  const handleAddStudentToClass = async (student: Student) => {
      if (!user || !classDetails) return;

      const batch = writeBatch(firestore);

      // 1. Update the Student document with the new classId and className
      const studentRef = doc(firestore, 'users', user.uid, 'students', student.id);
      batch.update(studentRef, { classId: classId, className: classDetails.name });

      // 2. Update the Class document to include the student's ID in its list
      const classRef = doc(firestore, 'users', user.uid, 'classes', classId);
      batch.update(classRef, { students: arrayUnion(student.id) });
      
      try {
        await batch.commit();
        toast({
            title: 'Student Added',
            description: `${student.name} has been added to ${classDetails.name}.`
        });
        setStudentPopoverOpen(false);
      } catch (error) {
        console.error("Error adding student to class: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not add student to the class. Please try again.'
        });
      }
  };

  const handlePromoteClass = async () => {
    if (!user || !classDetails || !studentsInClass || !settings || !allClasses) {
      toast({ variant: 'destructive', title: 'Error', description: 'Missing required data to run promotions.' });
      return;
    }

    setIsPromoting(true);

    const studentIds = studentsInClass.map(s => s.id);
    if(studentIds.length === 0) {
        toast({ title: 'No Students', description: 'There are no students in this class to promote.' });
        setIsPromoting(false);
        return;
    }

    const gradesQuery = query(
      collection(firestore, 'users', user.uid, 'grades'),
      where('classId', '==', classId),
      where('term', '==', 'Third Term'),
      where('session', '==', settings.currentSession)
    );

    const gradesSnapshot = await getDocs(gradesQuery);
    const gradesData = gradesSnapshot.docs.map(d => d.data() as Grade);

    const batch = writeBatch(firestore);
    let promotedCount = 0;

    for (const student of studentsInClass) {
      const studentGrades = gradesData.filter(g => g.studentId === student.id);
      if (studentGrades.length === 0) continue; // Skip students with no grades for the term

      const totalScore = studentGrades.reduce((acc, g) => acc + g.total, 0);
      const average = totalScore / studentGrades.length;

      if (average >= 50) { // Passed
        const nextClassName = getNextClassName(classDetails.name, allClasses.map(c => ({ name: c.name, level: c.level })));
        const nextClass = allClasses.find(c => c.name === nextClassName);

        if (nextClass) {
          const studentRef = doc(firestore, 'users', user.uid, 'students', student.id);
          const promotionRecord = {
            from: classDetails.name,
            to: nextClass.name,
            date: new Date().toISOString(),
            session: settings.currentSession,
            average: parseFloat(average.toFixed(2))
          };

          // 1. Update the student's document
          batch.update(studentRef, {
            classId: nextClass.id,
            className: nextClass.name,
            promotionHistory: arrayUnion(promotionRecord)
          });

          // 2. Remove student from old class
          const oldClassRef = doc(firestore, 'users', user.uid, 'classes', classId);
          batch.update(oldClassRef, { students: arrayRemove(student.id) });

          // 3. Add student to new class
          const newClassRef = doc(firestore, 'users', user.uid, 'classes', nextClass.id);
          batch.update(newClassRef, { students: arrayUnion(student.id) });
          
          promotedCount++;
        }
      }
    }

    if (promotedCount > 0) {
      try {
        await batch.commit();
        toast({
          title: 'Promotion Complete',
          description: `${promotedCount} student(s) have been promoted from ${classDetails.name}.`
        });
      } catch (error) {
        console.error("Error during promotion batch commit: ", error);
        toast({
            variant: 'destructive',
            title: 'Promotion Failed',
            description: 'An error occurred while saving promotion data.'
        });
      }
    } else {
      toast({
        variant: 'default',
        title: 'No Promotions Made',
        description: `No students were eligible for promotion from ${classDetails.name}.`
      });
    }

    setIsPromoting(false);
  }


  if (isLoadingClass) {
      return (
          <div className="space-y-8 p-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
      )
  }
  
  if (!classDetails) {
      return <div className="p-6">Class not found.</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Students Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="mr-2 h-5 w-5 text-muted-foreground" />
            Students ({studentsInClass?.length ?? 0})
          </h3>
          <Popover open={isStudentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Find student..." />
                <CommandList>
                  <CommandEmpty>No unassigned students found.</CommandEmpty>
                  <CommandGroup>
                    {isLoadingUnassigned ? <CommandItem>Loading...</CommandItem> :
                      unassignedStudents?.map(student => (
                        <CommandItem
                          key={student.id}
                          value={student.name}
                          onSelect={() => handleAddStudentToClass(student)}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={student.avatarUrl} alt={student.name} />
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{student.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <Card>
          <CardContent className="p-4">
            {isLoadingStudents ? <Skeleton className="h-40 w-full" /> :
              <div className="space-y-1">
                {studentsInClass && studentsInClass.length > 0 ? (
                  studentsInClass.map((student) => (
                    <div key={student.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatarUrl} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{student.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No students have been added to this class yet.
                  </div>
                )}
              </div>
            }
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Subjects Section */}
      <div>
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <BookOpen className="mr-2 h-5 w-5 text-muted-foreground" />
          Subjects ({classDetails.subjects?.length ?? 0})
        </h3>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {classDetails.subjects && classDetails.subjects.length > 0 ? (
                classDetails.subjects?.map((subject: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {subject}
                  </Badge>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8 w-full">
                  No subjects assigned. Go to the 'Academics' page to assign them.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

       <Separator />
      
      {/* Promotion Section */}
      <div>
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <GraduationCap className="mr-2 h-5 w-5 text-muted-foreground" />
          End of Session Promotion
        </h3>
        <Card>
          <CardHeader>
            <CardTitle>Promote Class</CardTitle>
            <CardDescription>
              At the end of the third term, you can promote eligible students to the next class level based on their average performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This action will evaluate all students in <strong>{classDetails.name}</strong> for the <strong>{settings?.currentSession}</strong> session. Only students with an average score of 50% or higher in the third term will be promoted.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={settings?.currentTerm !== 'Third Term' || isPromoting || isLoadingAllClasses}>
                  {isPromoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
                  {isPromoting ? 'Promoting...' : 'Run Promotions'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to run promotions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will process promotions for <strong>{classDetails.name}</strong> for the <strong>Third Term, {settings?.currentSession}</strong> session. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePromoteClass}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {settings?.currentTerm !== 'Third Term' && (
              <p className="text-xs text-destructive mt-2">Promotion is only available during the Third Term.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ClassDetailsContent;
