'use client';
import { useState, useMemo, Fragment } from 'react';
import {
  generateReportCard,
  type GenerateReportCardInput,
  type GenerateReportCardOutput,
} from '@/ai/flows/generate-report-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { placeholderClasses, placeholderGrades, placeholderStudents } from '@/lib/placeholder-data';
import type { Student, Class, Grade } from '@/lib/types';
import { FileDown, Loader2, Printer, Search, User, Users } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from './ui/separator';
import { Logo } from './logo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

type ReportWithStudentAndGradeInfo = GenerateReportCardOutput & {
  studentName: string;
  studentId: string;
  className: string;
  term: string;
  session: string;
  grades: { subject: string; score: number, grade: string }[];
};

export default function ReportCardGenerator() {
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [generatedReports, setGeneratedReports] = useState<ReportWithStudentAndGradeInfo[]>([]);

  const { toast } = useToast();

  const studentsInClass = useMemo(() => {
    return selectedClass ? placeholderStudents.filter(s => s.classId === selectedClass.id) : [];
  }, [selectedClass]);

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
    setGeneratedReports([]);

    const targets: Student[] = selectedStudent ? [selectedStudent] : studentsInClass;

    try {
      const reports: ReportWithStudentAndGradeInfo[] = [];
      for (const student of targets) {
        const studentGrades = (placeholderGrades[student.class] || []).filter(g => g.studentName === student.name);
        
        if (studentGrades.length === 0) {
          continue; 
        }

        const input: GenerateReportCardInput = {
          studentName: student.name,
          className: student.class,
          term: 'First Term', // Placeholder
          session: '2023/2024', // Placeholder
          grades: studentGrades.map(g => ({ subject: g.subject, score: g.score })),
        };

        const result = await generateReportCard(input);
        const detailedGrades = studentGrades.map(g => ({ subject: g.subject, score: g.score, grade: g.grade }));
        
        reports.push({
          ...result,
          studentName: student.name,
          studentId: student.studentId,
          className: student.class,
          term: input.term,
          session: input.session,
          grades: detailedGrades,
        });
      }
      setGeneratedReports(reports);
      if(reports.length === 0) {
         toast({
            variant: "destructive",
            title: "No Grades Found",
            description: `No grades have been recorded for the selected ${selectedStudent ? 'student' : 'class'}.`,
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
    }
  };
  
  const handlePrint = () => {
    window.print();
  }

  return (
    <>
      <div className="grid gap-8 md:grid-cols-12 @media print:hidden">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Select Target</CardTitle>
            <CardDescription>Choose a class or an individual student.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium">
                <Users className="mr-2 h-4 w-4" /> Select a Class
              </label>
              <Select
                onValueChange={(classId) => {
                  setSelectedClass(placeholderClasses.find(c => c.id === classId) || null);
                  setSelectedStudent(null);
                }}
                value={selectedClass?.id || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {placeholderClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator>OR</Separator>

            <div className="space-y-2">
                 <label className="flex items-center text-sm font-medium">
                    <User className="mr-2 h-4 w-4" /> Search for a Student
                </label>
                <Command className="rounded-lg border shadow-sm">
                    <CommandInput placeholder="Type student name or ID..." />
                    <CommandList>
                        <CommandEmpty>No student found.</CommandEmpty>
                        <CommandGroup>
                        {placeholderStudents.map((student) => (
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
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateReports} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate {selectedStudent ? 'Report' : 'Class Reports'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-8">
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
                <CardTitle>Generated Reports Preview</CardTitle>
                <CardDescription>
                    {selectedStudent ? `Report for ${selectedStudent.name}` : selectedClass ? `Reports for ${selectedClass.name}` : 'Select a target to see a preview.'}
                </CardDescription>
            </div>
             {generatedReports.length > 0 && (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => toast({ title: "Coming Soon!", description: "Excel export will be available shortly."})}>
                        <FileDown className="mr-2 h-4 w-4" /> Download All
                    </Button>
                     <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                </div>
            )}
          </CardHeader>
          <CardContent className="min-h-[400px]">
            {loading && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="font-semibold">Generating Reports...</p>
                <p className="text-sm">This may take a moment.</p>
              </div>
            )}
            {!loading && generatedReports.length === 0 && (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <p>Your generated report cards will be displayed here.</p>
              </div>
            )}
            {!loading && generatedReports.length > 0 && (
                <div id="print-section" className="space-y-8">
                    {generatedReports.map((report, index) => (
                        <Fragment key={index}>
                           <div className="report-card p-6 border rounded-lg bg-card text-card-foreground shadow-sm break-after-page">
                                <header className="flex items-center justify-between mb-6 border-b pb-4">
                                    <Logo />
                                    <div className="text-right">
                                        <h2 className="text-2xl font-bold font-headline">Sunshine Primary School</h2>
                                        <p className="text-muted-foreground">End of Term Report</p>
                                    </div>
                                </header>
                                
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold font-headline mb-2 text-center">Student Information</h3>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 border rounded-lg p-4">
                                        <div><strong className="font-medium">Name:</strong> {report.studentName}</div>
                                        <div><strong className="font-medium">Class:</strong> {report.className}</div>
                                        <div><strong className="font-medium">Student ID:</strong> {report.studentId}</div>
                                        <div><strong className="font-medium">Session:</strong> {report.session}</div>
                                        <div className="col-span-2"><strong className="font-medium">Term:</strong> {report.term}</div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold font-headline mb-2 text-center">Academic Performance</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Subject</TableHead>
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

                                <div className="grid grid-cols-3 gap-4 text-center my-6 py-4 border-t border-b">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Score</p>
                                        <p className="text-2xl font-bold">{report.totalScore}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Average</p>
                                        <p className="text-2xl font-bold">{report.averageScore.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Overall Grade</p>
                                        <p className="text-2xl font-bold text-primary">{report.grade}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Teacher's Remark</h4>
                                    <p className="text-sm text-muted-foreground p-3 bg-secondary rounded-md italic">"{report.remark}"</p>
                                </div>

                                <footer className="text-center text-xs text-muted-foreground mt-8 pt-4 border-t">
                                    <p>Official School Stamp and Signature</p>
                                </footer>
                            </div>
                        </Fragment>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>
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
