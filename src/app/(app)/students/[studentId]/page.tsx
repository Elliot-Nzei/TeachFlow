import { notFound, redirect } from 'next/navigation';
import { placeholderStudents, placeholderGrades, placeholderClasses } from '@/lib/placeholder-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function StudentProfilePage({ params }: { params: { studentId: string } }) {
  const student = placeholderStudents.find(s => s.id === params.studentId);

  if (!student) {
    notFound();
  }

  const studentClass = placeholderClasses.find(c => c.id === student.classId);
  const studentGrades = placeholderGrades[student.class] || [];
  const gradesForStudent = studentGrades.filter(g => g.studentName === student.name);

  return (
    <>
      <div className="mb-4">
        <Link href={`/classes/${student.classId}`} passHref>
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to {student.class}
          </Button>
        </Link>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
            <Card>
                <CardHeader className="items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback className="text-3xl">{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl font-headline">{student.name}</CardTitle>
                    <CardDescription>
                        <Link href={`/classes/${student.classId}`} className="hover:underline">
                            {student.class}
                        </Link>
                    </CardDescription>
                </CardHeader>
            </Card>
             {studentClass && (
                <Card>
                    <CardHeader>
                        <CardTitle>Subjects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                        {studentClass.subjects.map((subject, index) => (
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
                        {gradesForStudent.length > 0 ? (
                            gradesForStudent.map(grade => (
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