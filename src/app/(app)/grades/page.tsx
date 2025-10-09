
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

type GradeInput = { studentId: string; studentName: string; ca1: number | string; ca2: number | string; exam: number | string; };

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
                ca1: existingGrade?.ca1 || '',
                ca2: existingGrade?.ca2 || '',
                exam: existingGrade?.exam || '',
            };
        });
        setGradeInputs(studentGrades);
    }
  };

  const handleScoreChange = (studentId: string, field: 'ca1' | 'ca2' | 'exam', value: string) => {
    setGradeInputs(prev => 
        prev.map(gi => gi.studentId === studentId ? {...gi, [field]: value} : gi)
    );
  };
  
  const handleBulkAddGrades = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClass || !selectedSubject || !user) return;
    
    const batch = writeBatch(firestore);

    gradeInputs.forEach((input) => {
        const ca1 = Number(input.ca1);
        const ca2 = Number(input.ca2);
        const exam = Number(input.exam);
        
        if (isNaN(ca1) || isNaN(ca2) || isNaN(exam)) return;

        const total = ca1 + ca2 + exam;
        
        let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
        if (total >= 70) grade = 'A';
        else if (total >= 60) grade = 'B';
        else if (total >= 50) grade = 'C';
        else if (total >= 45) grade = 'D';
        
        const existingGrade = (grades || []).find(g => g.studentId === input.studentId && g.subject === selectedSubject);

        const gradeData = {
            studentId: input.studentId,
            classId: selectedClass.id,
            subject: selectedSubject,
            term: 'First Term', // Replace with dynamic data from settings context later
            session: '2023/2024', // Replace with dynamic data from settings context later
            ca1,
            ca2,
            exam,
            total,
            grade,
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
    <div className="flex flex-1 gap-8">
        <div className="hidden md:block md:w-1/4 lg:w-1/5">
            <ClassSidebar selectedClass={selectedClass} onSelectClass={handleSelectClass} />
        </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4 mb-4 md:hidden">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline">
                    <PanelLeft className="mr-2 h-4 w-4" /> Select Class
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[80vw] max-w-xs p-0">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Select Class</SheetTitle>
                    <SheetDescription className="sr-only">Choose a class from the list to manage grades.</SheetDescription>
                  </SheetHeader>
                    <ClassSidebar selectedClass={selectedClass} onSelectClass={handleSelectClass} />
                </SheetContent>
            </Sheet>
            {selectedClass && <h2 className="font-bold text-lg">{selectedClass.name}</h2>}
        </div>
        {selectedClass ? (
          <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div>
                    <CardTitle className="font-headline hidden md:block">{selectedClass.name}</CardTitle>
                    <CardDescription>Manage grades for this class.</CardDescription>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={() => setShowGrades(!showGrades)} className="flex-1 md:flex-initial">
                    <View className="mr-2 h-4 w-4" />
                    {showGrades ? 'Hide Grades' : 'View Grades'}
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                      <Button className="flex-1 md:flex-initial">
                          <PlusCircle className="mr-2 h-4 w-4" /> Add / Edit Grades
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl w-[95vw]">
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
                                  <ScrollArea className="h-72 mt-4 border rounded-md">
                                  <div className="relative w-full overflow-auto">
                                      <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[150px] sticky left-0 bg-background z-10">Student Name</TableHead>
                                                <TableHead className="min-w-[100px]">CA1 (20)</TableHead>
                                                <TableHead className="min-w-[100px]">CA2 (20)</TableHead>
                                                <TableHead className="min-w-[100px]">Exam (60)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {gradeInputs.map((input) => (
                                              <TableRow key={input.studentId}>
                                                  <TableCell className="font-medium sticky left-0 bg-background">{input.studentName}</TableCell>
                                                  <TableCell>
                                                      <Input type="number" min="0" max="20" value={input.ca1} onChange={(e) => handleScoreChange(input.studentId, 'ca1', e.target.value)} />
                                                  </TableCell>
                                                   <TableCell>
                                                      <Input type="number" min="0" max="20" value={input.ca2} onChange={(e) => handleScoreChange(input.studentId, 'ca2', e.target.value)} />
                                                  </TableCell>
                                                   <TableCell>
                                                      <Input type="number" min="0" max="60" value={input.exam} onChange={(e) => handleScoreChange(input.studentId, 'exam', e.target.value)} />
                                                  </TableCell>
                                              </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
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
                          <div className="w-full overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="min-w-[150px]">Student Name</TableHead>
                                    <TableHead>CA1</TableHead>
                                    <TableHead>CA2</TableHead>
                                    <TableHead>Exam</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead className="text-right">Grade</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {subjectGrades.map((grade) => (
                                    <TableRow key={grade.id}>
                                      <TableCell className="font-medium">{grade.studentName}</TableCell>
                                      <TableCell>{grade.ca1}</TableCell>
                                      <TableCell>{grade.ca2}</TableCell>
                                      <TableCell>{grade.exam}</TableCell>
                                      <TableCell>{grade.total}</TableCell>
                                      <TableCell className="text-right font-bold">{grade.grade}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                          </div>
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

    