import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { placeholderClasses, placeholderStudents } from '@/lib/placeholder-data';
import { notFound } from 'next/navigation';
import { BookOpen, Users, User, Book } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ClassDetailsPage({ params }: { params: { classId: string } }) {
  const classDetails = placeholderClasses.find(c => c.id === params.classId);

  if (!classDetails) {
    notFound();
  }

  const studentsInClass = placeholderStudents.filter(s => s.classId === params.classId);

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
                Students ({studentsInClass.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Separator className="mb-4" />
                <div className="space-y-1">
                {studentsInClass.map((student) => (
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
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-6 w-6" />
                Subjects ({classDetails.subjects.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Separator className="mb-4" />
                <div className="flex flex-wrap gap-2">
                {classDetails.subjects.map((subject, index) => (
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
