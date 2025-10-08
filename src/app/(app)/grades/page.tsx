
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
import type { Class, Grade, Student } from '@/lib/types';
import { PlusCircle, View, PanelLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import ClassSidebar from '@/components/class-sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCollection, useFirebase, useUser, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';

type GradeInput = { studentId: string; studentName: string; score: number | string };

export default function GradesPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showGrades, setShowGrades] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<GradeInput[]>([]);

  const studentsQuery = useMemoFirebase(() => (user && selectedClass) ? query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', selectedClass.id)) : null, [firestore, user, selectedClass]);
  const { data: studentsInSelectedClass } = useCollection<Student>(studentsQuery);
  
  const gradesQuery = useMemoFirebase(() => (user && selectedClass) ? query(collection(firestore, 'users', user.uid, 'grades'), where('classId', '==', selectedClass.id)) : null, [firestore, user, selectedClass]);
  const { data: grades } = useCollection<Grade>(gradesQuery);

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    setShowGrades(false);
    setIsSidebarOpen(false);
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    if (selectedClass && studentsInSelectedClass) {
        const studentGrades = studentsInSelectedClass.map(student => {
            const existingGrade = (grades || []).find(
                (g: Grade) => g.studentId === student.id && g.subject === subject
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
  
  const handleBulkAddGrades = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClass || !selectedSubject || !user) return;
    
    const batch = writeBatch(firestore);

    gradeInputs.forEach((input) => {
        const score = Number(input.score);
        if (isNaN(score)) return;

        let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
        if (score >= 70) grade = 'A';
        else if (score >= 60) grade = 'B';
        else if (score >= 50) grade = 'C';
        else if (score >= 45) grade = 'D';
        
        // Check if a grade already exists to update it, or create a new one
        const existingGrade = (grades || []).find(g => g.studentId === input.studentId && g.subject === selectedSubject);

        const gradeData = {
            studentId: input.studentId,
            classId: selectedClass.id,
            subject: selectedSubject,
            term: 'First Term', // Replace with dynamic data from settings context later
            session: '2023/2024', // Replace with dynamic data from settings context later
            score: score,
            grade: grade,
            studentName: input.studentName,
            className: selectedClass.name,
        };

        if (existingGrade) {
            const gradeRef = doc(firestore, 'users', user.uid, 'grades', existingGrade.id);
            batch.update(gradeRef, gradeData);
        } else {
            const gradeRef = doc(collection(firestore, 'users', user.uid, 'grades'));
            batch.set(gradeRef, gradeData);
        }
    });

    await batch.commit();
    
    setIsDialogOpen(false);
    setSelectedSubject('');
    setGradeInputs([]);
  };

  const gradesBySubject = (grades || []).reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = [];
    }
    acc[grade.subject].push(grade);
    return acc;
  }, {} as Record<string, Grade[]>);

  return (
    <div className="flex">
        <div className="hidden md:block">
            <ClassSidebar selectedClass={selectedClass} onSelectClass={handleSelectClass} />
        </div>
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-4 md:hidden">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline">
                    <PanelLeft className="mr-2 h-4 w-4" /> Select Class
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Select Class</SheetTitle>
                    <SheetDescription className="sr-only">Choose a class from the list to manage grades.</SheetDescription>
                  </SheetHeader>
                    <ClassSidebar selectedClass={selectedClass} onSelectClass={handleSelectClass} />
                </SheetContent>
            </Sheet>
        </div>
        {selectedClass ? (
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                    <CardTitle className="font-headline">{selectedClass.name}</CardTitle>
                    <CardDescription>Manage grades for this class.</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowGrades(!showGrades)}>
                    <View className="mr-2 h-4 w-4" />
                    {showGrades ? 'Hide Grades' : 'View Grades'}
                </Button>
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
              </div>
            </CardHeader>
            {showGrades && (
              <CardContent>
                {Object.keys(gradesBySubject).length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(gradesBySubject).map(([subject, subjectGrades]) => (
                      <AccordionItem value={subject} key={subject}>
                        <AccordionTrigger className="text-lg font-semibold font-headline">
                          {subject}
                        </AccordionTrigger>
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead className="text-right">Grade</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subjectGrades.map((grade) => (
                                <TableRow key={grade.id}>
                                  <TableCell className="font-medium">{grade.studentName}</TableCell>
                                  <TableCell>{grade.score}</TableCell>
                                  <TableCell className="text-right font-bold">{grade.grade}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
                    <p>No grades recorded for this class yet.</p>
                  </div>
                )}
              </CardContent>
            )}
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
