'use client';
import { useState, useMemo, Fragment, useContext } from 'react';
import {
  generateReportCard,
  type GenerateReportCardInput,
  type GenerateReportCardOutput,
} from '@/ai/flows/generate-report-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Student, Class, Grade } from '@/lib/types';
import { FileDown, Loader2, Printer, Search, User, Users } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from './ui/separator';
import { Logo } from './logo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { SettingsContext } from '@/contexts/settings-context';
import { Progress } from './ui/progress';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';

type ReportWithStudentAndGradeInfo = GenerateReportCardOutput & {
  studentName: string;
  studentId: string;
  className: string;
  term: string;
  session: string;
  grades: { subject: string; score: number, grade: string }[];
};

const gradingScale = [
    { grade: 'A', range: '70–100', remark: 'Excellent' },
    { grade: 'B', range: '60–69', remark: 'Good' },
    { grade: 'C', range: '50–59', remark: 'Credit' },
    { grade: 'D', range: '45–49', remark: 'Pass' },
    { grade: 'F', range: 'Below 45', remark: 'Fail' },
];

export default function ReportCardGenerator() {
  const { firestore, user } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStudent, setCurrentStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [generatedReports, setGeneratedReports] = useState<ReportWithStudentAndGradeInfo[]>([]);
  const { settings } = useContext(SettingsContext);

  const { toast } = useToast();

  const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);

  const studentsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'students')) : null, [firestore, user]);
  const { data: allStudents, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);
  
  const allGradesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'grades')) : null, [firestore, user]);
  const { data: allGrades, isLoading: isLoadingGrades } = useCollection<Grade>(allGradesQuery);


  const studentsInClass = useMemo(() => {
    return selectedClass ? (allStudents || []).filter(s => s.classId === selectedClass.id) : [];
  }, [selectedClass, allStudents]);

  const handleGenerateReports = async () => {
    if (!selectedClass && !selectedStudent) {
      toast({
        variant: 'destructive',
        title: 'Selection Required',
        description: 'Please select a class or a student to generate reports.',
      });
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setCurrentStudent('');
    setGeneratedReports([]);

    const targets: Student[] = selectedStudent ? [selectedStudent] : studentsInClass;
    if (!settings) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load settings.'});
        setLoading(false);
        return;
    }
    const term = settings.currentTerm;
    const session = settings.currentSession;
    const newReports: ReportWithStudentAndGradeInfo[] = [];
    
    try {
        for (let i = 0; i < targets.length; i++) {
            const student = targets[i];
            setCurrentStudent(student.name);
            setLoadingProgress(((i + 1) / targets.length) * 100);

            const studentGrades = (allGrades || []).filter(g => g.studentId === student.id && g.session === session && g.term === term);
            
            if (studentGrades.length === 0) {
                continue; // Skip students with no grades for the current term/session
            }

            const input: GenerateReportCardInput = {
                studentName: student.name,
                className: student.className,
                grades: studentGrades.map(g => ({ subject: g.subject, score: g.score })),
                term,
                session
            };

            const result = await generateReportCard(input);
            const detailedGrades = studentGrades.map(g => ({ subject: g.subject, score: g.score, grade: g.grade }));

            newReports.push({
                ...result,
                studentName: student.name,
                studentId: student.studentId,
                className: student.className,
                term: input.term,
                session: input.session,
                grades: detailedGrades,
            });
        }
        
        setGeneratedReports(newReports);

        if (newReports.length === 0) {
            const description = selectedStudent
                ? `No grades have been recorded for ${selectedStudent.name} for the current term/session.`
                : `No students in ${selectedClass?.name} have recorded grades for the current term/session.`;
            toast({
                variant: "destructive",
                title: "No Grades Found",
                description: description,
            });
        }
    } catch (error) {
      console.error('Error generating report card(s):', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
      setCurrentStudent('');
      setLoadingProgress(0);
    }
  };
  
  const handlePrint = () => {
    window.print();
  }
  
  const isLoading = isLoadingClasses || isLoadingStudents || isLoadingGrades;

  return (
    <>
      <div className="grid gap-8 md:grid-cols-12 @media print:hidden">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Select Target</CardTitle>
            <CardDescription>Choose to generate reports for an entire class or a single student.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? <div className="space-y-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
              <>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium">
                    <Users className="mr-2 h-4 w-4" /> Generate for a Whole Class
                  </label>
                  <Select
                    onValueChange={(classId) => {
                      setSelectedClass(classes?.find(c => c.id === classId) || null);
                      setSelectedStudent(null);
                    }}
                    value={selectedClass?.id || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator>OR</Separator>

                <div className="space-y-2">
                     <label className="flex items-center text-sm font-medium">
                        <User className="mr-2 h-4 w-4" /> Generate for a Single Student
                    </label>
                    <Command className="rounded-lg border shadow-sm">
                        <CommandInput placeholder="Type student name or ID..." />
                        <CommandList>
                            <CommandEmpty>No student found.</CommandEmpty>
                            <CommandGroup>
                            {(allStudents || []).map((student) => (
                                <CommandItem
                                    key={student.id}
                                    value={`${student.name} ${student.studentId}`}
                                    onSelect={() => {
                                        setSelectedStudent(student);
                                        setSelectedClass(null);
                                    }}
                                >
                                    {student.name}
                                    <span className="ml-2 text-xs text-muted-foreground">{student.studentId}</span>
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateReports} disabled={loading || (!selectedClass && !selectedStudent)} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? 'Generating...' : 'Generate Reports'}
            </Button>
          </CardFooter>
        </Card>

        <div className="md:col-span-8">
            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle>Generated Reports</CardTitle>
                        <CardDescription>
                            {generatedReports.length > 0
                            ? `Showing ${generatedReports.length} report(s). Ready to print or download.`
                            : 'Select a class or student to generate reports.'}
                        </CardDescription>
                    </div>
                    {generatedReports.length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handlePrint}>
                                <FileDown className="mr-2 h-4 w-4" /> Download All
                            </Button>
                            <Button onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" /> Print All
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="min-h-[400px]">
                    {loading && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="font-semibold mb-2">Generating Reports...</p>
                        {currentStudent && <p className="text-sm mb-2">Processing: {currentStudent}</p>}
                        <Progress value={loadingProgress} className="w-3/4" />
                    </div>
                    )}
                    {!loading && generatedReports.length === 0 && (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                        <p>Your generated report cards will be displayed here.</p>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
       <div id="print-section" className="space-y-8 mt-8">
            {!loading && generatedReports.length > 0 && generatedReports.map((report, index) => (
                <Fragment key={index}>
                    <div className="report-card p-6 border rounded-lg bg-card text-card-foreground shadow-sm break-after-page">
                        <header className="grid grid-cols-3 items-center mb-8">
                            <Logo />
                            <div className="text-center">
                                <h2 className="text-2xl font-bold font-headline">{settings?.schoolName}</h2>
                                <p className="text-muted-foreground text-sm">Student Academic Report</p>
                            </div>
                            <div className="text-right text-xs">
                                <p>123 School Lane, Lagos, Nigeria</p>
                                <p>{settings?.email}</p>
                            </div>
                        </header>
                        
                        <div className="mb-6 bg-muted/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold font-headline mb-3 text-center">Student Information</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                                <div><strong className="font-medium text-muted-foreground block">Name:</strong> {report.studentName}</div>
                                <div><strong className="font-medium text-muted-foreground block">Class:</strong> {report.className}</div>
                                <div><strong className="font-medium text-muted-foreground block">Student ID:</strong> {report.studentId}</div>
                                <div><strong className="font-medium text-muted-foreground block">Session:</strong> {report.session}</div>
                                <div className="md:col-span-2"><strong className="font-medium text-muted-foreground block">Term:</strong> {report.term}</div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold font-headline mb-3 text-center">Academic Performance</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50%]">Subject</TableHead>
                                        <TableHead className="text-center">Score</TableHead>
                                        <TableHead className="text-right">Grade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.grades.map((grade, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{grade.subject}</TableCell>
                                            <TableCell className="text-center">{grade.score}</TableCell>
                                            <TableCell className="text-right font-bold">{grade.grade}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Academic Summary</h4>
                                    <div className="grid grid-cols-3 gap-2 text-center border rounded-lg p-3">
                                            <div>
                                            <p className="text-xs text-muted-foreground">Total</p>
                                            <p className="text-xl font-bold">{report.totalScore}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Average</p>
                                            <p className="text-xl font-bold">{report.averageScore.toFixed(1)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Grade</p>
                                            <p className="text-xl font-bold text-primary">{report.grade}</p>
                                        </div>
                                    </div>
                                </div>
                                    <div>
                                    <h4 className="font-semibold mb-2">Teacher's General Remark</h4>
                                    <p className="text-sm text-muted-foreground p-3 bg-secondary rounded-md italic">"{report.remark}"</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Grading Scale</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Grade</TableHead>
                                            <TableHead>Score Range</TableHead>
                                            <TableHead>Remark</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {gradingScale.map((scale) => (
                                            <TableRow key={scale.grade}>
                                                <TableCell className="font-bold">{scale.grade}</TableCell>
                                                <TableCell>{scale.range}</TableCell>
                                                <TableCell>{scale.remark}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t">
                                <div className="text-center">
                                <div className="w-4/5 h-px bg-foreground mx-auto mt-12"></div>
                                <p className="text-sm mt-1">Class Teacher's Signature</p>
                            </div>
                            <div className="text-center">
                                <div className="w-4/5 h-px bg-foreground mx-auto mt-12"></div>
                                <p className="text-sm mt-1">Principal's Signature</p>
                            </div>
                        </div>
                        <footer className="text-center text-xs text-muted-foreground mt-8 pt-4 border-t">
                            <p>Official School Stamp</p>
                        </footer>
                    </div>
                </Fragment>
            ))}
        </div>
       <style jsx global>{`
        @media print {
            body * {
                visibility: hidden;
            }
            #print-section, #print-section * {
                visibility: visible;
            }
            #print-section {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
            .report-card {
                page-break-after: always;
                border: 1px solid #ccc !important;
                box-shadow: none !important;
            }
        }
        @page {
            size: A4;
            margin: 0.5in;
        }
      `}</style>
    </>
  );
}
