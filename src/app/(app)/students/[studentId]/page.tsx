
'use client';
import { use, Suspense, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useDoc, useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, writeBatch, getDocs, arrayRemove } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

function StudentProfileContent({ studentId, userId }: { studentId: string, userId: string }) {
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const studentDocQuery = useMemoFirebase(() => doc(firestore, 'users', userId, 'students', studentId), [firestore, userId, studentId]);
  const { data: student, isLoading: isLoadingStudent } = useDoc<any>(studentDocQuery);
  
  const classDocQuery = useMemoFirebase(() => (student ? doc(firestore, 'users', userId, 'classes', student.classId) : null), [firestore, userId, student]);
  const { data: studentClass, isLoading: isLoadingClass } = useDoc<any>(classDocQuery);

  const gradesQuery = useMemoFirebase(() => query(collection(firestore, 'users', userId, 'grades'), where('studentId', '==', studentId)), [firestore, userId, studentId]);
  const { data: gradesForStudent, isLoading: isLoadingGrades } = useCollection<any>(gradesQuery);

  const handleDeleteStudent = async () => {
    if (!student) return;

    try {
        const batch = writeBatch(firestore);

        // 1. Delete student document
        const studentRef = doc(firestore, 'users', userId, 'students', studentId);
        batch.delete(studentRef);

        // 2. Delete all grades for the student
        const gradesQuerySnapshot = await getDocs(gradesQuery);
        gradesQuerySnapshot.forEach(gradeDoc => {
            batch.delete(gradeDoc.ref);
        });

        // 3. Remove student from class's student list
        if (student.classId) {
            const classRef = doc(firestore, 'users', userId, 'classes', student.classId);
            batch.update(classRef, {
                students: arrayRemove(studentId)
            });
        }
        
        await batch.commit();

        toast({
            title: 'Student Deleted',
            description: `${student.name} has been removed from the system.`,
        });

        router.push('/students');

    } catch (error) {
        console.error("Error deleting student:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the student. Please try again.',
        });
    }
  };

  if (isLoadingStudent) {
      return (
          <div className="grid gap-8 md:grid-cols-3">
              <div className="md:col-span-1 space-y-8">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-40 w-full" />
              </div>
              <div className="md:col-span-2">
                  <Skeleton className="h-96 w-full" />
              </div>
          </div>
      )
  }

  // Only call notFound if loading is complete and there's no data
  if (!isLoadingStudent && !student) {
    notFound();
  }

  if (!student) {
      return null;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Link href={`/classes/${student.classId}`} passHref>
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to {student.className}
          </Button>
        </Link>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete <strong>{student.name}</strong> and all of their associated data, including grades.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteStudent}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
            <Card>
                <CardHeader className="items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback className="text-3xl">{student.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl font-headline">{student.name}</CardTitle>
                    <CardDescription className="font-mono text-sm">{student.studentId}</CardDescription>
                    <CardDescription>
                        <Link href={`/classes/${student.classId}`} className="hover:underline">
                            {student.className}
                        </Link>
                    </CardDescription>
                </CardHeader>
            </Card>
             {isLoadingClass ? <Skeleton className="h-40 w-full" /> : studentClass && (
                <Card>
                    <CardHeader>
                        <CardTitle>Subjects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                        {(studentClass.subjects || []).map((subject: string, index: number) => (
                            <Badge key={index} variant="secondary">{subject}</Badge>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

        <div className="md:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle>Academic Record</CardTitle>
                <CardDescription>Grades for the current session.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead className="text-right">Grade</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingGrades ? (
                           <TableRow><TableCell colSpan={4}><Skeleton className="h-24 w-full" /></TableCell></TableRow> 
                        ) : gradesForStudent && gradesForStudent.length > 0 ? (
                            gradesForStudent.map((grade: any) => (
                                <TableRow key={grade.id}>
                                    <TableCell className="font-medium">{grade.subject}</TableCell>
                                    <TableCell>{grade.term}</TableCell>
                                    <TableCell>{grade.score}</TableCell>
                                    <TableCell className="text-right font-bold">{grade.grade}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                No grades recorded yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}

function StudentProfileLoader({ studentId }: { studentId: string }) {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    if (isUserLoading || !firestore) {
        return (
            <div className="grid gap-8 md:grid-cols-3">
              <div className="md:col-span-1 space-y-8">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-40 w-full" />
              </div>
              <div className="md:col-span-2">
                  <Skeleton className="h-96 w-full" />
              </div>
          </div>
        );
    }

    if (!user) {
        // Handle case where user is not logged in, maybe redirect
        return <div>Please log in to view this page.</div>;
    }

    return <StudentProfileContent studentId={studentId} userId={user.uid} />;
}

export default function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  return (
      <Suspense fallback={
        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1 space-y-8">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
            <div className="md:col-span-2">
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
      }>
          <StudentProfileLoader studentId={studentId} />
      </Suspense>
  )
}
