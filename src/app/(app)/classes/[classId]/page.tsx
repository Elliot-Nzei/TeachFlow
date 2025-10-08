
'use client';
import { use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { BookOpen, Users, User, Book } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDoc, useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClassDetailsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { classId } = use(params);

  const classDocQuery = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'classes', classId) : null, [firestore, user, classId]);
  const { data: classDetails, isLoading: isLoadingClass } = useDoc<any>(classDocQuery);

  const studentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', classId)) : null, [firestore, user, classId]);
  const { data: studentsInClass, isLoading: isLoadingStudents } = useCollection<any>(studentsQuery);


  if (isLoadingClass) {
      return (
          <div className="space-y-8">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-24 w-full" />
              <div className="grid md:grid-cols-2 gap-8">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
              </div>
          </div>
      )
  }

  if (!classDetails && !isLoadingClass) {
    notFound();
  }

  return (
    <>
        <div className="mb-4">
            <Link href="/classes" passHref>
                <Button variant="outline">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Classes
                </Button>
            </Link>
        </div>
        <div className="space-y-8">
        <Card>
            <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline">{classDetails.name}</CardTitle>
            <CardDescription>Details for the current session.</CardDescription>
            </CardHeader>
        </Card>
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
                    {studentsInClass && studentsInClass.map((student) => (
                        <Link href={`/students/${student.id}`} key={student.id} className="block">
                            <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{student.name}</span>
                            </div>
                        </Link>
                    ))}
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
                {classDetails.subjects?.map((subject: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                        <Book className="mr-1.5 h-3 w-3" />
                        {subject}
                    </Badge>
                ))}
                </div>
            </CardContent>
            </Card>
        </div>
        </div>
    </>
  );
}
