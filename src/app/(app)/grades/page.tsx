
'use client';
import { useState, useMemo, useContext, useEffect } from 'react';
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
import { PlusCircle, View, PanelLeft, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import ClassSidebar from '@/components/class-sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCollection, useFirebase, useUser, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SettingsContext } from '@/contexts/settings-context';
import { useToast } from '@/hooks/use-toast';

type GradeInput = { studentId: string; studentName: string; avatarUrl: string; ca1: number | string; ca2: number | string; exam: number | string; total: number; grade: string; };

const calculateNigerianGrade = (score: number): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' => {
  if (score >= 75) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  if (score >= 45) return 'E';
  return 'F';
};

const calculateTotal = (ca1: number | string, ca2: number | string, exam: number | string) => {
    return (Number(ca1) || 0) + (Number(ca2) || 0) + (Number(exam) || 0);
}

export default function GradesPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { settings } = useContext(SettingsContext);
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showGrades, setShowGrades] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<GradeInput[]>([]);

  const [filterTerm, setFilterTerm] = useState('');
  const [filterSession, setFilterSession] = useState('');

  const studentsQuery = useMemoFirebase(() => (user && selectedClass) ? query(collection(firestore, 'users', user.uid, 'students'), where('classId', '==', selectedClass.id)) : null, [firestore, user, selectedClass]);
  const { data: studentsInSelectedClass } = useCollection<Student>(studentsQuery);
  
  const studentIdsInClass = useMemo(() => studentsInSelectedClass?.map(s => s.id) || [], [studentsInSelectedClass]);

  const allGradesForClassQuery = useMemoFirebase(() => {
    if (!user || !selectedClass || studentIdsInClass.length === 0) return null;
    return query(collection(firestore, 'users', user.uid, 'grades'), where('studentId', 'in', studentIdsInClass));
  }, [firestore, user, selectedClass, studentIdsInClass]);

  const { data: allGradesForClass, isLoading: isLoadingAllGrades } = useCollection<Grade>(allGradesForClassQuery);
  
  useEffect(() => {
    if (settings) {
      setFilterTerm(settings.currentTerm);
      setFilterSession(settings.currentSession);
    }
  }, [settings]);


  const uniqueSessions = useMemo(() => {
    if (!allGradesForClass) return settings?.currentSession ? [settings.currentSession] : [];
    const sessions = new Set(allGradesForClass.map(g => g.session));
    if(settings?.currentSession) sessions.add(settings.currentSession);
    return Array.from(sessions).sort((a,b) => b.localeCompare(a));
  }, [allGradesForClass, settings?.currentSession]);

  const grades = useMemo(() => {
    if (!showGrades || isLoadingAllGrades) return [];
    return (allGradesForClass || []).filter(g => g.term === filterTerm && g.session === filterSession);
  }, [allGradesForClass, filterTerm, filterSession, showGrades, isLoadingAllGrades]);

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    setShowGrades(false);
    setIsSidebarOpen(false);
    if (settings) {
        setFilterTerm(settings.currentTerm);
        setFilterSession(settings.currentSession);
    }
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    if (selectedClass && studentsInSelectedClass) {
        const studentGrades = studentsInSelectedClass.map(student => {
            const existingGrade = (allGradesForClass || []).find(
                (g: Grade) => g.studentId === student.id && g.subject === subject && g.term === settings?.currentTerm && g.session === settings?.currentSession
            );
            const total = calculateTotal(existingGrade?.ca1 || '', existingGrade?.ca2 || '', existingGrade?.exam || '');
            return {
                studentId: student.id,
                studentName: student.name,
                avatarUrl: student.avatarUrl,
                ca1: existingGrade?.ca1 || '',
                ca2: existingGrade?.ca2 || '',
                exam: existingGrade?.exam || '',
                total: total,
                grade: calculateNigerianGrade(total),
            };
        });
        setGradeInputs(studentGrades);
    }
  };

  const handleScoreChange = (studentId: string, field: 'ca1' | 'ca2' | 'exam', value: string) => {
    setGradeInputs(prev => 
        prev.map(gi => {
            if (gi.studentId === studentId) {
                const newValues = {...gi, [field]: value};
                const total = calculateTotal(newValues.ca1, newValues.ca2, newValues.exam);
                return {...newValues, total, grade: calculateNigerianGrade(total)};
            }
            return gi;
        })
    );
  };
  
  const handleBulkAddGrades = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClass || !selectedSubject || !user || !settings?.currentTerm || !settings?.currentSession) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Cannot save grades without a selected class, subject, and current term/session in settings.',
        });
        return;
    }
    
    const batch = writeBatch(firestore);

    gradeInputs.forEach((input) => {
        const ca1 = Number(input.ca1);
        const ca2 = Number(input.ca2);
        const exam = Number(input.exam);
        
        if (isNaN(ca1) && isNaN(ca2) && isNaN(exam)) return;
        
        const existingGrade = (allGradesForClass || []).find(g => g.studentId === input.studentId && g.subject === selectedSubject && g.term === settings.currentTerm && g.session === settings.currentSession);

        const gradeData = {
            studentId: input.studentId,
            classId: selectedClass.id,
            subject: selectedSubject,
            term: settings.currentTerm,
            session: settings.currentSession,
            ca1: ca1 || 0,
            ca2: ca2 || 0,
            exam: exam || 0,
            total: input.total,
            grade: input.grade,
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

  const gradesBySubject = grades.reduce((acc, grade) => {
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
                    <SheetDescription className="sr-only">Choose a class to manage grades.</SheetDescription>
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
                          <DialogDescription>Select a subject to enter scores for all students. Grades will be saved for {settings?.currentTerm}, {settings?.currentSession}.</DialogDescription>
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
              {showGrades && (
                <div className="flex flex-col sm:flex-row gap-4 items-center mb-4 border-b pb-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Filter className="h-4 w-4"/> Filters
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
                      <Select value={filterTerm} onValueChange={setFilterTerm}>
                        <SelectTrigger><SelectValue placeholder="Select term..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="First Term">First Term</SelectItem>
                          <SelectItem value="Second Term">Second Term</SelectItem>
                          <SelectItem value="Third Term">Third Term</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterSession} onValueChange={setFilterSession}>
                          <SelectTrigger><SelectValue placeholder="Select session..." /></SelectTrigger>
                          <SelectContent>
                              {uniqueSessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                </div>
              )}
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
                    <p>No grades recorded for this class for {filterTerm}, {filterSession}.</p>
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

    

    