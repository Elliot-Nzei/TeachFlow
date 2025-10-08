'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { placeholderClasses, placeholderGrades, placeholderStudents } from '@/lib/placeholder-data';
import type { Class, Grade, Student } from '@/lib/types';
import { PlusCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type GradeInput = { studentId: string; studentName: string; score: number | string };

export default function GradesPage() {
  const [selectedClass, setSelectedClass] = useState<Class | null>(placeholderClasses[0] || null);
  const [grades, setGrades] = useState<{ [className: string]: Grade[] }>(placeholderGrades);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const studentsInSelectedClass = selectedClass ? placeholderStudents.filter(s => s.classId === selectedClass.id) : [];

  const [gradeInputs, setGradeInputs] = useState<GradeInput[]>([]);

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    if (selectedClass) {
        const studentGrades = studentsInSelectedClass.map(student => {
            const existingGrade = (grades[selectedClass.name] || []).find(
                g => g.studentName === student.name && g.subject === subject
            );
            return {
                studentId: student.id,
                studentName: student.name,
                score: existingGrade?.score || '',
            };
        });
        setGradeInputs(studentGrades);
    }
  };

  const handleScoreChange = (studentId: string, score: string) => {
    setGradeInputs(prev => 
        prev.map(gi => gi.studentId === studentId ? {...gi, score: score} : gi)
    );
  };
  
  const handleBulkAddGrades = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClass || !selectedSubject) return;

    const newGrades: Grade[] = gradeInputs.map((input) => {
        const score = Number(input.score);
        let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
        if (score >= 70) grade = 'A';
        else if (score >= 60) grade = 'B';
        else if (score >= 50) grade = 'C';
        else if (score >= 45) grade = 'D';

        return {
            id: `g${Date.now()}-${input.studentId}`,
            studentName: input.studentName,
            subject: selectedSubject,
            score: score,
            grade: grade,
            term: 'First Term',
            session: '2023/2024',
        };
    }).filter(g => !isNaN(g.score));

    setGrades(prevGrades => {
        const otherGrades = (prevGrades[selectedClass.name] || []).filter(g => g.subject !== selectedSubject);
        const updatedGradesForClass = [...otherGrades, ...newGrades];
        return { ...prevGrades, [selectedClass.name]: updatedGradesForClass };
    });
    
    setIsDialogOpen(false);
    setSelectedSubject('');
    setGradeInputs([]);
  };

  const openDialogAndSetSubject = (subject: string) => {
    handleSubjectSelect(subject);
    setIsDialogOpen(true);
  }

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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add / Edit Grades
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add/Edit Grades for {selectedClass.name}</DialogTitle>
                        <DialogDescription>Select a subject to enter scores for all students.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBulkAddGrades}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Select onValueChange={handleSubjectSelect} value={selectedSubject}>
                                    <SelectTrigger id="subject">
                                        <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedClass.subjects.map(sub => (
                                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {selectedSubject && (
                                <ScrollArea className="h-72 mt-4 border rounded-md p-4">
                                <div className="space-y-4">
                                    <Label className="font-bold">Enter Scores for {selectedSubject}</Label>
                                    {gradeInputs.map((input) => (
                                        <div key={input.studentId} className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor={`score-${input.studentId}`} className="col-span-2">{input.studentName}</Label>
                                            <Input 
                                                id={`score-${input.studentId}`} 
                                                name={`score-${input.studentId}`} 
                                                type="number" 
                                                min="0" 
                                                max="100" 
                                                placeholder="0-100" 
                                                value={input.score}
                                                onChange={(e) => handleScoreChange(input.studentId, e.target.value)}
                                                className="col-span-1" 
                                            />
                                        </div>
                                    ))}
                                </div>
                                </ScrollArea>
                            )}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="ghost">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={!selectedSubject}>Save Grades</Button>
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
                                grades[selectedClass.name]
                                .sort((a,b) => a.studentName.localeCompare(b.studentName) || a.subject.localeCompare(b.subject))
                                .map((grade) => (
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
