'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { placeholderClasses, placeholderGrades, placeholderStudents } from '@/lib/placeholder-data';
import type { Class, Grade } from '@/lib/types';
import { PlusCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GradesPage() {
  const [selectedClass, setSelectedClass] = useState<Class | null>(placeholderClasses[0] || null);
  const [grades, setGrades] = useState<{ [className: string]: Grade[] }>(placeholderGrades);

  const studentsInSelectedClass = selectedClass ? placeholderStudents.filter(s => s.classId === selectedClass.id) : [];

  const handleAddGrade = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClass) return;

    const formData = new FormData(event.currentTarget);
    const newGrade: Grade = {
      id: `g${Date.now()}`,
      studentName: formData.get('student') as string,
      subject: formData.get('subject') as string,
      score: Number(formData.get('score')),
      grade: 'A', // This should be calculated
      term: 'First Term',
      session: '2023/2024'
    };

    // Grade calculation
    if (newGrade.score >= 70) newGrade.grade = 'A';
    else if (newGrade.score >= 60) newGrade.grade = 'B';
    else if (newGrade.score >= 50) newGrade.grade = 'C';
    else if (newGrade.score >= 45) newGrade.grade = 'D';
    else newGrade.grade = 'F';

    setGrades(prevGrades => {
      const newGradesForClass = [...(prevGrades[selectedClass.name] || []), newGrade];
      return { ...prevGrades, [selectedClass.name]: newGradesForClass };
    });
    
    // Here you would typically close the dialog.
    // For this example, we will just log it.
    console.log('New grade added:', newGrade);
    document.getElementById('close-dialog')?.click();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
      <div className="md:col-span-1 space-y-4">
        <h1 className="text-2xl font-bold font-headline px-2">Classes</h1>
        <div className="space-y-2">
            {placeholderClasses.map((cls) => (
                <Button 
                    key={cls.id} 
                    variant={selectedClass?.id === cls.id ? 'secondary' : 'ghost'} 
                    className={cn(
                        "w-full justify-start",
                        selectedClass?.id === cls.id && "font-bold"
                    )}
                    onClick={() => setSelectedClass(cls)}
                >
                    <BookOpen className="mr-2 h-4 w-4" />
                    {cls.name}
                </Button>
            ))}
        </div>
      </div>

      <div className="md:col-span-3">
        {selectedClass ? (
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="font-headline">{selectedClass.name}</CardTitle>
                <CardDescription>Manage grades for this class.</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Grade
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Grade for {selectedClass.name}</DialogTitle>
                        <DialogDescription>Select a student, subject, and enter the score.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddGrade}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="student" className="text-right">Student</Label>
                                <Select name="student">
                                    <SelectTrigger id="student" className="col-span-3">
                                        <SelectValue placeholder="Select a student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {studentsInSelectedClass.map(s => (
                                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subject" className="text-right">Subject</Label>
                                <Select name="subject">
                                    <SelectTrigger id="subject" className="col-span-3">
                                        <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedClass.subjects.map(sub => (
                                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="score" className="text-right">Score</Label>
                                <Input id="score" name="score" type="number" min="0" max="100" placeholder="0-100" className="col-span-3" required/>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save Grade</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
               </Dialog>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead className="text-right">Grade</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {grades[selectedClass.name]?.length > 0 ? (
                                grades[selectedClass.name].map((grade) => (
                                    <TableRow key={grade.id}>
                                        <TableCell className="font-medium">{grade.studentName}</TableCell>
                                        <TableCell>{grade.subject}</TableCell>
                                        <TableCell>{grade.score}</TableCell>
                                        <TableCell className="text-right font-bold">{grade.grade}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        No grades recorded for this class yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
          </Card>
        ) : (
            <div className="flex items-center justify-center h-full min-h-[400px] text-center text-muted-foreground rounded-lg border border-dashed">
                <p>Select a class to view and manage grades.</p>
            </div>
        )}
      </div>
    </div>
  );
}
