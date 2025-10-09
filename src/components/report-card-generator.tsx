
'use client';
import { useState, useMemo, Fragment, useContext, useCallback } from 'react';
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
import { FileDown, Loader2, Printer, Search, User, Users, Trophy, Medal, Award, Star, X } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from './ui/separator';
import { Logo } from './logo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { SettingsContext } from '@/contexts/settings-context';
import { Progress } from './ui/progress';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

type ReportWithStudentAndGradeInfo = GenerateReportCardOutput & {
  studentName: string;
  studentId: string;
  className: string;
  term: string;
  session: string;
  grades: { subject: string; ca1?: number; ca2?: number; exam?: number; total: number, grade: string, remark?: string }[];
  age?: number;
  gender?: 'Male' | 'Female';
  attendance?: { totalDays: number; presentDays: number; absentDays: number };
  traits?: { name: string; domain: string; rating: number }[];
  formTeacherComment: string;
  principalComment: string;
  nextTermBegins?: string;
  schoolName?: string;
  schoolMotto?: string;
  schoolAddress?: string;
  position: number;
  totalStudents: number;
};

const getGradeColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 45) return 'bg-orange-500';
    return 'bg-red-500';
};

const PositionBadge = ({ position }: { position: number }) => {
  const getOrdinal = (n: number) => {
    if (n <= 0) return `${n}`;
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const configs = [
    { threshold: 1, color: "text-yellow-500", Icon: Trophy, label: "1st" },
    { threshold: 2, color: "text-slate-400", Icon: Medal, label: "2nd" },
    { threshold: 3, color: "text-amber-700", Icon: Award, label: "3rd" },
    { threshold: 10, color: "text-blue-600", Icon: Star, label: getOrdinal(position) },
  ];

  const config = configs.find(c => position <= c.threshold) || 
    { color: "text-gray-600", Icon: X, label: getOrdinal(position) };
  
  if (position <= 0) {
    config.label = "N/A";
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', config.color)}>
      {config.Icon && <config.Icon className="h-10 w-10" />}
      <span className="text-lg font-bold">{config.label}</span>
      <span className="text-xs font-medium">Position</span>
    </div>
  );
};


const ReportCard = ({ report }: { report: ReportWithStudentAndGradeInfo }) => {
    const getRatingText = (rating: number) => {
        const ratings: Record<number, string> = { 5: "Excellent", 4: "Very Good", 3: "Good", 2: "Fair", 1: "Poor" };
        return ratings[rating] || "N/A";
    };

    return (
        <div id={`report-card-${report.studentId}`} className="a4-page mx-auto bg-white shadow-lg">
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
                <div className="bg-gray-50 p-1 text-center border"><p className="text-gray-600">School Opened</p><p className="text-base font-bold text-green-700">{report.attendance.totalDays}</p></div>
                <div className="bg-gray-50 p-1 text-center border"><p className="text-gray-600">Times Present</p><p className="text-base font-bold text-blue-600">{report.attendance.presentDays}</p></div>
                <div className="bg-gray-50 p-1 text-center border"><p className="text-gray-600">Times Absent</p><p className="text-base font-bold text-red-600">{report.attendance.absentDays}</p></div>
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
                        <td className="border border-gray-300 p-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <span className="font-bold">{subject.total}</span>
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className={cn("h-full", getGradeColor(subject.total))}
                                    style={{ width: `${subject.total}%` }}
                                />
                                </div>
                            </div>
                        </td>
                        <td className="border border-gray-300 p-0.5 text-center font-bold text-green-700">{subject.grade}</td>
                        <td className="border border-gray-300 p-0.5 text-center">{subject.remark}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-1 text-[9px]">
                      <div className="bg-green-50 p-1 text-center border border-green-200 min-w-[70px]"><p className="text-gray-600">Total</p><p className="text-sm font-bold text-green-700">{report.totalScore}</p></div>
                      <div className="bg-blue-50 p-1 text-center border border-blue-200 min-w-[70px]"><p className="text-gray-600">Average</p><p className="text-sm font-bold text-blue-700">{report.averageScore.toFixed(1)}</p></div>
                      <div className="bg-purple-50 p-1 text-center border border-purple-200 min-w-[70px]"><p className="text-gray-600">Out of</p><p className="text-sm font-bold text-purple-700">{report.totalStudents}</p></div>
                  </div>
                  <div className="p-1">
                    <PositionBadge position={report.position} />
                  </div>
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
    )
};


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

  const classAverages = useMemo(() => {
    if (!allGrades || !selectedClass) return [];
    return studentsInClass
      .map(student => {
        const studentGrades = allGrades.filter(
          g => g.studentId === student.id && 
               g.session === settings?.currentSession && 
               g.term === settings?.currentTerm && 
               typeof g.total === 'number'
        );
        if (studentGrades.length === 0) return { studentId: student.id, average: 0 };
        const totalScore = studentGrades.reduce((sum, g) => sum + g.total, 0);
        return { studentId: student.id, average: totalScore / studentGrades.length };
      })
      .sort((a, b) => b.average - a.average);
  }, [allGrades, studentsInClass, settings?.currentSession, settings?.currentTerm, selectedClass]);

  const handleClearSelection = useCallback(() => {
    setSelectedClass(null);
    setSelectedStudent(null);
    setGeneratedReports([]);
  }, []);

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
    if (!settings || !allGrades) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load settings or grades.'});
        setLoading(false);
        return;
    }
    const term = settings.currentTerm;
    const session = settings.currentSession;
    
    const newReports: ReportWithStudentAndGradeInfo[] = [];
    
    for (let i = 0; i < targets.length; i++) {
        const student = targets[i];
        setCurrentStudent(student.name);
        setLoadingProgress(((i + 1) / targets.length) * 100);

        try {
            const studentGrades = allGrades.filter(g => 
                g.studentId === student.id && 
                g.session === session && 
                g.term === term &&
                typeof g.total === 'number'
            );
            
            if (studentGrades.length === 0) {
                continue;
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
            
            const uniqueDates = new Set((allAttendance || []).filter(a => a.session === session && a.term === term).map(a => a.date));
            const totalDays = uniqueDates.size;
            const presentDays = studentAttendance.filter(a => a.status === 'Present').length;
            const absentDays = studentAttendance.filter(a => a.status === 'Absent').length;
            const lateDays = studentAttendance.filter(a => a.status === 'Late').length;
            
            const input: GenerateReportCardInput = {
                studentName: student.name,
                className: student.className,
                grades: studentGrades.map(g => ({ subject: g.subject, score: g.total, grade: g.grade })),
                attendance: {
                    totalDays,
                    presentDays,
                    absentDays,
                    lateDays
                },
                traits: studentTraits.flatMap(t => {
                    const traitEntries = Object.entries(t.traits);
                    return traitEntries.map(([name, rating]) => ({ name, rating }));
                }),
                term,
                session,
                positionInClass: classAverages.findIndex(avg => avg.studentId === student.id) + 1,
                totalStudentsInClass: studentsInClass.length,
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
            
            const position = classAverages.findIndex(avg => avg.studentId === student.id) + 1;

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
                attendance: { totalDays, presentDays, absentDays },
                traits: studentTraits.flatMap(t => {
                    const traitEntries = Object.entries(t.traits);
                    return traitEntries.map(([name, rating]) => ({ name, rating, domain: 'Affective' })); // Domain is hardcoded, needs schema update
                }),
                formTeacherComment: result.formTeacherComment,
                principalComment: result.principalComment,
                position: position > 0 ? position : 0,
                totalStudents: studentsInClass.length,
            });

        } catch (error) {
            console.error(`Error generating report for ${student.name}:`, error);
            toast({
                variant: 'destructive',
                title: `Generation Failed for ${student.name}`,
                description: 'Could not generate report for this student. Please check their data.',
            });
            continue;
        }
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
      
    setLoading(false);
    setCurrentStudent('');
    setLoadingProgress(0);
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
                const canvas = await html2canvas(reportElement, { scale: 3, useCORS: true });
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
  
  const isLoading = isLoadingClasses || isLoadingStudents || isLoadingGrades || isLoadingTraits || isLoadingAttendance;

  return (
    <>
      <div className="grid gap-8 md:grid-cols-12 print:hidden">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Select Target</CardTitle>
            <CardDescription>Choose to generate reports for an entire class or a single student.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    disabled={!!selectedStudent}
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
                        <CommandInput placeholder="Type student name or ID..." disabled={!!selectedClass} />
                        <CommandList>
                            <CommandEmpty>No student found.</CommandEmpty>
                            <CommandGroup>
                            {(allStudents || []).map((student) => (
                                <CommandItem
                                    key={student.id}
                                    value={`${student.name} ${student.studentId}`}
                                    onSelect={() => {
                                        setSelectedStudent(student);
                                        setSelectedClass(classes?.find(c => c.id === student.classId) || null);
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
                 {(selectedClass || selectedStudent) && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900">
                          {selectedStudent ? 'Selected Student' : 'Selected Class'}
                        </p>
                        <p className="text-sm text-blue-700">
                          {selectedStudent ? selectedStudent.name : selectedClass?.name}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateReports} disabled={loading || (!selectedClass && !selectedStudent)} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate Reports'}
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
                    {generatedReports.length > 0 && !loading && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleDownloadPdf} disabled={loading}>
                                <FileDown className="mr-2 h-4 w-4" /> Download All
                            </Button>
                            <Button onClick={handlePrint} disabled={loading}>
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
                        <p className="text-xs mt-2">{Math.round(loadingProgress)}% Complete</p>
                    </div>
                    )}
                    {!loading && generatedReports.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <Award className="h-16 w-16 mb-4 text-gray-300" />
                        <p className="text-lg font-medium text-muted-foreground">
                        No Reports Generated Yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                        Your generated report cards will be displayed here.
                        </p>
                    </div>
                    )}
                    {!loading && generatedReports.length > 0 && (
                        <div className="space-y-4">
                            {generatedReports.map((report) => (
                            <Card key={report.studentId} className="border-l-4 border-l-green-500">
                                <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                    <CardTitle className="text-lg">{report.studentName}</CardTitle>
                                    <CardDescription>
                                        {report.className} • {report.studentId}
                                    </CardDescription>
                                    </div>
                                    <Badge variant="outline">
                                    Position: {report.position}/{report.totalStudents}
                                    </Badge>
                                </div>
                                </CardHeader>
                                <CardContent>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                    <p className="text-gray-600">Average Score</p>
                                    <p className="text-xl font-bold text-blue-700">
                                        {report.averageScore.toFixed(1)}
                                    </p>
                                    </div>
                                    <div>
                                    <p className="text-gray-600">Overall Grade</p>
                                    <p className="text-xl font-bold text-green-700">
                                        {report.overallGrade}
                                    </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Attendance</p>
                                        <p className="text-xl font-bold text-purple-700">
                                            {report.attendance && report.attendance.totalDays > 0
                                            ? `${((report.attendance.presentDays / report.attendance.totalDays) * 100).toFixed(0)}%`
                                            : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                </CardContent>
                            </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
       <div id="print-container" className="hidden print:block">
            {generatedReports.map((report) => (
                <ReportCard key={report.studentId} report={report} />
            ))}
        </div>
       <style jsx global>{`
        .a4-page {
            color: black;
            background: white;
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
            body * {
                visibility: hidden;
            }
            #print-container, #print-container * {
                visibility: visible;
            }
            #print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
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
