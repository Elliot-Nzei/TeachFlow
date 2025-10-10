
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type GradeInput = { studentId: string; studentName: string; avatarUrl: string; ca1: number | string; ca2: number | string; exam: number | string; };

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
                avatarUrl: student.avatarUrl,
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
        
        if (isNaN(ca1) && isNaN(ca2) && isNaN(exam)) return;

        const total = (ca1 || 0) + (ca2 || 0) + (exam || 0);
        
        let grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'F';
        if (total >= 70) grade = 'A';
        else if (total >= 60) grade = 'B';
        else if (total >= 50) grade = 'C';
        else if (total >= 45) grade = 'D';
        else if (total > 40) grade = 'E';
        
        const existingGrade = (grades || []).find(g => g.studentId === input.studentId && g.subject === selectedSubject);

        const gradeData = {
            studentId: input.studentId,
            classId: selectedClass.id,
            subject: selectedSubject,
            term: 'First Term', // Replace with dynamic data from settings context later
            session: '2023/2024', // Replace with dynamic data from settings context later
            ca1: ca1 || 0,
            ca2: ca2 || 0,
            exam: exam || 0,
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
            {selectedClass && <h2 className="font-bold text-lg truncate">{selectedClass.name}</h2>}
        </div>
        {selectedClass ? (
          <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <CardTitle className="font-headline hidden md:block">{selectedClass.name}</CardTitle>
                  <CardTitle className="font-headline md:hidden truncate">{selectedClass.name}</CardTitle>
                  <CardDescription>Manage grades for this class.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
                                          {(selectedClass.subjects || []).map(sub => (
                                              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                              
                              {selectedSubject && (
                                  <ScrollArea className="h-72 mt-4 border rounded-md p-2">
                                    <div className="space-y-4">
                                      {gradeInputs.map((input) => (
                                        <Card key={input.studentId} className="p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={input.avatarUrl} alt={input.studentName} />
                                                    <AvatarFallback>{input.studentName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <p className="font-semibold">{input.studentName}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <Label htmlFor={`ca1-${input.studentId}`} className="text-xs">CA1 (20)</Label>
                                                    <Input type="number" min="0" max="20" id={`ca1-${input.studentId}`} value={input.ca1} onChange={(e) => handleScoreChange(input.studentId, 'ca1', e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor={`ca2-${input.studentId}`} className="text-xs">CA2 (20)</Label>
                                                    <Input type="number" min="0" max="20" id={`ca2-${input.studentId}`} value={input.ca2} onChange={(e) => handleScoreChange(input.studentId, 'ca2', e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor={`exam-${input.studentId}`} className="text-xs">Exam (60)</Label>
                                                    <Input type="number" min="0" max="60" id={`exam-${input.studentId}`} value={input.exam} onChange={(e) => handleScoreChange(input.studentId, 'exam', e.target.value)} />
                                                </div>
                                            </div>
                                        </Card>
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
            <CardContent>
              {showGrades ? (
                Object.keys(gradesBySubject).length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(gradesBySubject).map(([subject, subjectGrades]) => (
                      <AccordionItem value={subject} key={subject}>
                        <AccordionTrigger className="text-lg font-semibold font-headline">
                          {subject}
                        </AccordionTrigger>
                        <AccordionContent>
                          {/* Mobile Card View */}
                          <div className="md:hidden space-y-4">
                            {subjectGrades.map(grade => (
                              <Card key={grade.id} className="border-l-4 border-primary">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">{grade.studentName}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div><span className="text-muted-foreground">CA1:</span> {grade.ca1}</div>
                                    <div><span className="text-muted-foreground">CA2:</span> {grade.ca2}</div>
                                    <div><span className="text-muted-foreground">Exam:</span> {grade.exam}</div>
                                    <div className="col-span-2 font-semibold">Total: {grade.total}</div>
                                    <div className="font-bold text-lg text-right">{grade.grade}</div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {/* Desktop Table View */}
                          <div className="w-full overflow-x-auto hidden md:block">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-[120px]">Student</TableHead>
                                  <TableHead className="w-[60px] text-center">CA1</TableHead>
                                  <TableHead className="w-[60px] text-center">CA2</TableHead>
                                  <TableHead className="w-[60px] text-center">Exam</TableHead>
                                  <TableHead className="w-[70px] text-center">Total</TableHead>
                                  <TableHead className="w-[70px] text-right">Grade</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {subjectGrades.map((grade) => (
                                  <TableRow key={grade.id}>
                                    <TableCell className="font-medium">{grade.studentName}</TableCell>
                                    <TableCell className="text-center">{grade.ca1}</TableCell>
                                    <TableCell className="text-center">{grade.ca2}</TableCell>
                                    <TableCell className="text-center">{grade.exam}</TableCell>
                                    <TableCell className="text-center">{grade.total}</TableCell>
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
                    <p>No grades recorded for this class yet. Click 'Add / Edit Grades' to start.</p>
                  </div>
                )
              ) : (
                <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
                    <p>Click 'View Grades' to see the records for this class.</p>
                </div>
              )}
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
