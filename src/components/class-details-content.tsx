
'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Book, UserPlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDoc, useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, writeBatch, arrayUnion, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Student, Class } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';


function ClassDetailsContent({ classId }: { classId: string }) {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const [isStudentPopoverOpen, setStudentPopoverOpen] = useState(false);

  const classDocQuery = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid, 'classes', classId) : null), [firestore, user, classId]);
  const { data: classDetails, isLoading: isLoadingClass } = useDoc<Class>(classDocQuery);

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
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center">
                    <Users className="mr-2 h-6 w-6" />
                    Students ({studentsInClass?.length ?? 0})
                    </CardTitle>
                    <CardDescription>Students enrolled in this class.</CardDescription>
                </div>
                 <Popover open={isStudentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                            <UserPlus className="mr-2 h-4 w-4" /> Add Student
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0" align="start">
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
                <CardDescription>Subjects taught in this class.</CardDescription>
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
                    <div className="text-center text-sm text-muted-foreground p-4">
                        No subjects assigned yet. Go to the 'Academics' page to assign them.
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
