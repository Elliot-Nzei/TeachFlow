
'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Book } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDoc, useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Student } from '@/lib/types';


function ClassDetailsContent({ classId }: { classId: string }) {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const classDocQuery = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid, 'classes', classId) : null), [firestore, user, classId]);
  const { data: classDetails, isLoading: isLoadingClass } = useDoc<any>(classDocQuery);

  const studentsQuery = useMemoFirebase(() => (user && classId) ? query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', classId)) : null, [firestore, user, classId]);
  const { data: studentsInClass, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);


  if (isLoadingClass) {
      return (
          <div className="space-y-8 p-6">
              
              <div className="grid md:grid-cols-2 gap-8">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
              </div>
          </div>
      )
  }
  
  if (!classDetails) {
      return <div className="p-6">Class not found.</div>;
  }

  return (
    <>
      
      <div className="space-y-8 p-6">
        <div className="grid md:grid-cols-2 gap-8">
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                <Users className="mr-2 h-6 w-6" />
                Students ({studentsInClass?.length ?? 0})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Separator className="mb-4" />
                {isLoadingStudents ? <Skeleton className="h-40 w-full" /> : 
                    <div className="space-y-1">
                    {studentsInClass && studentsInClass.length > 0 ? (
                        studentsInClass.map((student) => (
                            <div key={student.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{student.name}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-sm text-muted-foreground p-4">
                            No students have been added to this class yet.
                        </div>
                    )}
                    </div>
                }
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-6 w-6" />
                Subjects ({classDetails.subjects?.length ?? 0})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Separator className="mb-4" />
                <div className="flex flex-wrap gap-2">
                {classDetails.subjects && classDetails.subjects.length > 0 ? (
                    classDetails.subjects?.map((subject: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                        <Book className="mr-1.5 h-3 w-3" />
                        {subject}
                    </Badge>
                ))
                ) : (
                    <div className="text-center text-sm text-muted-foreground">
                        No subjects assigned yet.
                    </div>
                )}
                </div>
            </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}


export default ClassDetailsContent;

