
'use client';
import { useState, useMemo, Fragment, useContext } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  generateReportCard,
  type GenerateReportCardInput,
  type GenerateReportCardOutput,
} from '@/ai/flows/generate-report-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Student, Class, Grade, Trait, Attendance } from '@/lib/types';
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
  grades: { subject: string; ca1?: number; ca2?: number; exam?: number; total: number, grade: string, remark?: string }[];
  age?: number;
  gender?: 'Male' | 'Female';
  attendance?: { schoolOpened: number; timesPresent: number; timesAbsent: number };
  traits?: { name: string; domain: string; rating: number }[];
  formTeacherComment: string;
  principalComment: string;
  nextTermBegins?: string;
  schoolName?: string;
  schoolMotto?: string;
  schoolAddress?: string;
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
  
  const allTraitsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'traits')) : null, [firestore, user]);
  const { data: allTraits, isLoading: isLoadingTraits } = useCollection<Trait>(allTraitsQuery);
  
  const allAttendanceQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'attendance')) : null, [firestore, user]);
  const { data: allAttendance, isLoading: isLoadingAttendance } = useCollection<Attendance>(allAttendanceQuery);


  const studentsInClass = useMemo(() => {
    return selectedClass ? (allStudents || []).filter(s => s.classId === selectedClass.id) : [];
  }, [selectedClass, allStudents]);

  const getRemarkFromScore = (score: number) => {
    if (score >= 70) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Credit';
    if (score >= 45) return 'Pass';
    return 'Fail';
  };

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

            const studentGrades = (allGrades || []).filter(g => 
                g.studentId === student.id && 
                g.session === session && 
                g.term === term &&
                typeof g.total === 'number'
            );
            
            if (studentGrades.length === 0) {
                continue; // Skip students with no valid grades for the current term/session
            }
            
            const studentTraits = (allTraits || []).filter(t =>
              t.studentId === student.id &&
              t.session === session &&
              t.term === term
            );

            const studentAttendance = (allAttendance || []).filter(a =>
              a.studentId === student.id &&
              a.session === session &&
              a.term === term
            );

            const schoolOpened = new Set(allAttendance?.map(a => a.date)).size;
            const timesPresent = studentAttendance.filter(a => a.status === 'Present').length;
            const timesAbsent = studentAttendance.filter(a => a.status === 'Absent').length;
            
            const input: GenerateReportCardInput = {
                studentName: student.name,
                className: student.className,
                grades: studentGrades.map(g => ({ subject: g.subject, score: g.total })),
                traits: studentTraits.map(t => ({ name: t.traitName, rating: t.rating })),
                term,
                session
            };

            const result = await generateReportCard(input);
            const detailedGrades = studentGrades.map(g => ({ 
              subject: g.subject, 
              ca1: g.ca1, 
              ca2: g.ca2, 
              exam: g.exam, 
              total: g.total, 
              grade: g.grade, 
              remark: getRemarkFromScore(g.total) 
            }));

            newReports.push({
                ...result,
                studentName: student.name,
                studentId: student.studentId,
                className: student.className,
                term: input.term,
                session: input.session,
                grades: detailedGrades,
                age: student.age,
                gender: student.gender,
                schoolName: settings.schoolName,
                schoolMotto: settings.schoolMotto,
                schoolAddress: settings.schoolAddress,
                nextTermBegins: settings.nextTermBegins,
                attendance: { schoolOpened, timesPresent, timesAbsent },
                traits: studentTraits.map(t => ({ name: t.traitName, rating: t.rating, domain: t.domain})),
                formTeacherComment: result.formTeacherComment,
                principalComment: result.principalComment,
            });
        }
        
        setGeneratedReports(newReports);

        if (newReports.length === 0) {
            const description = selectedStudent
                ? `No valid grades have been recorded for ${selectedStudent.name} for the current term/session.`
                : `No students in ${selectedClass?.name} have valid recorded grades for the current term/session.`;
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
  };

  const handleDownloadPdf = async () => {
    if (generatedReports.length === 0) {
      toast({ title: "No reports to download." });
      return;
    }
    setLoading(true);
    setLoadingProgress(0);

    const doc = new jsPDF('p', 'mm', 'a4');
    const a4_width = 210;
    const a4_height = 297;
    
    try {
        for (let i = 0; i < generatedReports.length; i++) {
            const report = generatedReports[i];
            setCurrentStudent(`Processing ${report.studentName}...`);
            setLoadingProgress(((i + 1) / generatedReports.length) * 100);

            const reportElement = document.getElementById(`report-card-${report.studentId}`);
            if (reportElement) {
                const canvas = await html2canvas(reportElement, { scale: 3 });
                const imgData = canvas.toDataURL('image/png');
                
                if (i > 0) {
                    doc.addPage();
                }
                
                doc.addImage(imgData, 'PNG', 0, 0, a4_width, a4_height, undefined, 'FAST');
            }
        }

        const studentName = selectedStudent?.name || selectedClass?.name || 'Reports';
        doc.save(`${studentName}-Report-Cards.pdf`);
        toast({ title: "Success", description: "PDF has been downloaded." });

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ variant: 'destructive', title: 'PDF Generation Failed', description: 'An error occurred while generating the PDF.' });
    } finally {
        setLoading(false);
        setCurrentStudent('');
        setLoadingProgress(0);
    }
  };
  
  const getRatingText = (rating: number) => {
    const ratings: Record<number, string> = {
      5: "Excellent", 4: "Very Good", 3: "Good", 2: "Fair", 1: "Poor"
    };
    return ratings[rating] || "N/A";
  };

  const isLoading = isLoadingClasses || isLoadingStudents || isLoadingGrades || isLoadingTraits || isLoadingAttendance;

  return (
    <>
      <div className="grid gap-8 md:grid-cols-12 print:hidden">
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
                            <Button variant="outline" onClick={handleDownloadPdf}>
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
                        <p className="font-semibold mb-2">{currentStudent || 'Generating Reports...'}</p>
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
            {!loading && generatedReports.map((report, index) => (
                <div key={report.studentId} id={`report-card-${report.studentId}`} className="a4-page mx-auto bg-white shadow-lg">
                    <div className="text-center border-b-4 border-green-700 pb-2 mb-2">
                        <div className="flex items-center justify-center gap-3 mb-1">
                            <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-white">{(report.schoolName || 'S').charAt(0)}</span>
                            </div>
                            <div>
                            <h1 className="text-xl font-bold text-green-800">{(report.schoolName || '').toUpperCase()}</h1>
                            <p className="text-[9px] text-gray-600">{report.schoolAddress}</p>
                            </div>
                        </div>
                        <p className="text-[9px] font-semibold italic text-gray-700">"{report.schoolMotto}"</p>
                        <h2 className="text-sm font-bold text-green-700 mt-1 bg-green-50 py-1">TERMINAL REPORT CARD</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-x-4 gap-y-1 mb-2 text-[9px] border-b pb-2">
                        <div className="flex"><span className="font-semibold w-24">Name:</span><span className="flex-1">{report.studentName}</span></div>
                        <div className="flex"><span className="font-semibold w-20">Adm. No:</span><span className="flex-1">{report.studentId}</span></div>
                        <div className="flex"><span className="font-semibold w-16">Class:</span><span className="flex-1">{report.className}</span></div>
                        <div className="flex"><span className="font-semibold w-24">Term:</span><span className="flex-1">{report.term}</span></div>
                        <div className="flex"><span className="font-semibold w-20">Session:</span><span className="flex-1">{report.session}</span></div>
                         <div className="flex"><span className="font-semibold w-16">Age:</span><span className="flex-1">{report.age ? `${report.age} years` : 'N/A'}</span></div>
                    </div>
                    
                    {report.attendance && (
                    <div className="grid grid-cols-3 gap-2 mb-2 text-[9px]">
                        <div className="bg-gray-50 p-1 text-center border"><p className="text-gray-600">School Opened</p><p className="text-base font-bold text-green-700">{report.attendance.schoolOpened}</p></div>
                        <div className="bg-gray-50 p-1 text-center border"><p className="text-gray-600">Times Present</p><p className="text-base font-bold text-blue-600">{report.attendance.timesPresent}</p></div>
                        <div className="bg-gray-50 p-1 text-center border"><p className="text-gray-600">Times Absent</p><p className="text-base font-bold text-red-600">{report.attendance.timesAbsent}</p></div>
                    </div>
                    )}
                    
                    <div className="mb-2">
                        <h3 className="font-bold text-green-700 text-[10px] mb-1 bg-green-50 px-2 py-0.5">ACADEMIC PERFORMANCE</h3>
                        <table className="w-full text-[8px] border-collapse">
                            <thead>
                            <tr className="bg-green-700 text-white">
                                <th className="border border-green-600 p-0.5 text-left">Subject</th>
                                <th className="border border-green-600 p-0.5">CA1<br/>(20)</th>
                                <th className="border border-green-600 p-0.5">CA2<br/>(20)</th>
                                <th className="border border-green-600 p-0.5">Exam<br/>(60)</th>
                                <th className="border border-green-600 p-0.5">Total<br/>(100)</th>
                                <th className="border border-green-600 p-0.5">Grade</th>
                                <th className="border border-green-600 p-0.5">Remark</th>
                            </tr>
                            </thead>
                            <tbody>
                            {report.grades.map((subject, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="border border-gray-300 p-0.5 font-semibold">{subject.subject}</td>
                                <td className="border border-gray-300 p-0.5 text-center">{subject.ca1 ?? 'N/A'}</td>
                                <td className="border border-gray-300 p-0.5 text-center">{subject.ca2 ?? 'N/A'}</td>
                                <td className="border border-gray-300 p-0.5 text-center">{subject.exam ?? 'N/A'}</td>
                                <td className="border border-gray-300 p-0.5 text-center font-bold">{subject.total}</td>
                                <td className="border border-gray-300 p-0.5 text-center font-bold text-green-700">{subject.grade}</td>
                                <td className="border border-gray-300 p-0.5 text-center">{subject.remark}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div className="grid grid-cols-4 gap-1 mt-2 text-[9px]">
                            <div className="bg-green-50 p-1 text-center border border-green-200"><p className="text-gray-600">Total</p><p className="text-sm font-bold text-green-700">{report.totalScore}</p></div>
                            <div className="bg-blue-50 p-1 text-center border border-blue-200"><p className="text-gray-600">Average</p><p className="text-sm font-bold text-blue-700">{report.averageScore.toFixed(1)}</p></div>
                            <div className="bg-yellow-50 p-1 text-center border border-yellow-200"><p className="text-gray-600">Position</p><p className="text-sm font-bold text-yellow-700">1st</p></div>
                            <div className="bg-purple-50 p-1 text-center border border-purple-200"><p className="text-gray-600">Out of</p><p className="text-sm font-bold text-purple-700">{studentsInClass.length || 1}</p></div>
                        </div>
                    </div>
                     <div className="mb-2 text-[7px]">
                      <h3 className="font-bold text-green-700 text-[9px] mb-1">GRADING SCALE</h3>
                      <div className="flex gap-1 flex-wrap">
                          <span className="bg-gray-50 px-1 py-0.5 border">A: 70-100 (Excellent)</span>
                          <span className="bg-gray-50 px-1 py-0.5 border">B: 60-69 (Good)</span>
                          <span className="bg-gray-50 px-1 py-0.5 border">C: 50-59 (Credit)</span>
                          <span className="bg-gray-50 px-1 py-0.5 border">D: 45-49 (Pass)</span>
                          <span className="bg-gray-50 px-1 py-0.5 border">F: 0-44 (Fail)</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <h3 className="font-bold text-green-700 text-[9px] mb-1 bg-green-50 px-1 py-0.5">AFFECTIVE DOMAIN</h3>
                            <table className="w-full text-[8px] border-collapse">
                                <thead><tr className="bg-green-700 text-white"><th className="border border-green-600 p-0.5 text-left">Trait</th><th className="border border-green-600 p-0.5">Rate</th><th className="border border-green-600 p-0.5">Remark</th></tr></thead>
                                <tbody>
                                {(report.traits || []).filter(t=>t.domain === 'Affective').map((trait, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}><td className="border border-gray-300 p-0.5">{trait.name}</td><td className="border border-gray-300 p-0.5 text-center font-bold">{trait.rating}</td><td className="border border-gray-300 p-0.5 text-center">{getRatingText(trait.rating)}</td></tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <h3 className="font-bold text-green-700 text-[9px] mb-1 bg-green-50 px-1 py-0.5">PSYCHOMOTOR DOMAIN</h3>
                            <table className="w-full text-[8px] border-collapse">
                            <thead><tr className="bg-green-700 text-white"><th className="border border-green-600 p-0.5 text-left">Skill</th><th className="border border-green-600 p-0.5">Rate</th><th className="border border-green-600 p-0.5">Remark</th></tr></thead>
                            <tbody>
                                {(report.traits || []).filter(t=>t.domain === 'Psychomotor').map((skill, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}><td className="border border-gray-300 p-0.5">{skill.name}</td><td className="border border-gray-300 p-0.5 text-center font-bold">{skill.rating}</td><td className="border border-gray-300 p-0.5 text-center">{getRatingText(skill.rating)}</td></tr>
                                ))}
                            </tbody>
                            </table>
                            <p className="text-[7px] text-gray-600 mt-0.5 italic">Rating: 5-Excellent, 4-Very Good, 3-Good, 2-Fair, 1-Poor</p>
                        </div>
                    </div>
                    <div className="mb-2">
                        <div className="mb-1"><h3 className="font-bold text-green-700 text-[9px] mb-0.5">FORM TEACHER'S COMMENT</h3><div className="bg-gray-50 p-1 border text-[8px] min-h-[30px]"><p>{report.formTeacherComment}</p></div><p className="text-[7px] text-gray-600 mt-0.5">Signature: _________________ Date: _______</p></div>
                        <div><h3 className="font-bold text-green-700 text-[9px] mb-0.5">PRINCIPAL'S COMMENT</h3><div className="bg-gray-50 p-1 border text-[8px] min-h-[30px]"><p>{report.principalComment}</p></div><p className="text-[7px] text-gray-600 mt-0.5">Signature: _________________ Date: _______</p></div>
                    </div>
                    <div className="text-center bg-green-700 text-white py-1 text-[9px]"><p className="font-bold">Next Term Begins: {report.nextTermBegins}</p></div>
                </div>
            ))}
        </div>
       <style jsx global>{`
        .a4-page {
            color: black;
        }
        @media screen {
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            box-sizing: border-box;
          }
        }
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .a4-page {
                width: 210mm;
                height: 297mm;
                padding: 15mm;
                margin: 0;
                box-shadow: none;
                page-break-after: always;
                box-sizing: border-box;
                background-color: white !important;
                color: black !important;
            }
             .a4-page * {
                color: black !important;
            }
            .print\\:hidden {
                display: none !important;
            }
            * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
        @page {
            size: A4;
            margin: 0;
        }
      `}</style>
    </>
  );
}
