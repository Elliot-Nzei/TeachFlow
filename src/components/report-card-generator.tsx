
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
import { useToast } from '@/hooks/use-toast';
import type { Student, Class, Grade, Trait, Attendance } from '@/lib/types';
import { FileDown, Loader2, Printer, Search, User, Users, Medal, Award, Star, X, AlertCircle, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Logo } from './logo';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { SettingsContext } from '@/contexts/settings-context';
import { Progress } from './ui/progress';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type ReportWithStudentAndGradeInfo = GenerateReportCardOutput & {
  studentName: string;
  studentId: string;
  className: string;
  term: string;
  session: string;
  grades: { subject: string; ca1?: number; ca2?: number; exam?: number; total: number, grade: string, remark: string }[];
  attendance?: { totalDays: number; presentDays: number; absentDays: number };
  traits?: { name: string; rating: number }[];
  formTeacherComment: string;
  principalComment: string;
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
    { threshold: 1, color: "text-yellow-500", Icon: Award, label: "1st" },
    { threshold: 2, color: "text-slate-400", Icon: Medal, label: "2nd" },
    { threshold: 3, color: "text-amber-700", Icon: Award, label: "3rd" },
    { threshold: 10, color: "text-blue-600", Icon: X, label: getOrdinal(position) },
  ];

  const config = configs.find(c => position <= c.threshold) || 
    { color: "text-gray-600", Icon: null, label: getOrdinal(position) };
  
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

    const affectiveTraits = (report.traits || []).filter(t => ["Punctuality", "Neatness", "Honesty", "Cooperation", "Attentiveness"].includes(t.name));
    const psychomotorSkills = (report.traits || []).filter(t => !affectiveTraits.map(at => at.name).includes(t.name));


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
                        {affectiveTraits.map((trait, index) => (
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
                        {psychomotorSkills.map((skill, index) => (
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
            <div className="text-center bg-green-700 text-white py-1 text-[9px]"><p className="font-bold">Next Term Begins: TBA</p></div>
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
  const [classPopoverOpen, setClassPopoverOpen] = useState(false);
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);

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

  const validateSettings = useCallback(() => {
    if (!settings) {
      toast({
        variant: 'destructive',
        title: 'Settings Not Found',
        description: 'Please configure your school settings before generating reports.',
      });
      return false;
    }

    if (!settings.currentTerm || !settings.currentSession) {
      toast({
        variant: 'destructive',
        title: 'Missing Configuration',
        description: 'Please set the current term and session in your settings.',
      });
      return false;
    }

    return true;
  }, [settings, toast]);

  const handleGenerateReports = async () => {
    if (!selectedClass && !selectedStudent) {
      toast({
        variant: 'destructive',
        title: 'Selection Required',
        description: 'Please select a class or a student to generate reports.',
      });
      return;
    }

    if (!validateSettings() || !allGrades) {
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setCurrentStudent('');
    setGeneratedReports([]);

    const targets: Student[] = selectedStudent ? [selectedStudent] : studentsInClass;
    const term = settings!.currentTerm;
    const session = settings!.currentSession;
    
    const newReports: ReportWithStudentAndGradeInfo[] = [];
    
    try {
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
                  console.warn(`No grades found for ${student.name}`);
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
                      return traitEntries.map(([name, rating]) => ({ name, rating: rating as number }));
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
                  schoolName: settings!.schoolName,
                  schoolMotto: settings!.schoolMotto,
                  schoolAddress: settings!.schoolAddress,
                  attendance: { totalDays, presentDays, absentDays },
                  traits: input.traits,
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
                  description: 'Could not generate report for this student. Continuing with others...',
              });
              continue;
          }
      }
      
      setGeneratedReports(newReports);

      if (newReports.length === 0) {
          const description = selectedStudent
              ? `No valid grades found for ${selectedStudent.name} for ${term}, ${session}.`
              : `No students in ${selectedClass?.name} have valid grades for ${term}, ${session}.`;
          toast({
              variant: "destructive",
              title: "No Grades Found",
              description: description,
          });
      } else {
        toast({
          title: "Success!",
          description: `Generated ${newReports.length} report card(s) successfully.`,
        });
      }
    } catch (error) {
      console.error('Error generating report cards:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
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
        toast({
            variant: "destructive",
            title: "No reports to download.",
            description: "Please generate reports first."
        });
        return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setCurrentStudent('Preparing PDF...');

    const doc = new jsPDF('p', 'mm', 'a4');
    const a4_width = 210;
    const a4_height = 297;

    try {
        for (let i = 0; i < generatedReports.length; i++) {
            const report = generatedReports[i];
            setCurrentStudent(`Processing ${report.studentName}...`);
            setLoadingProgress(((i + 1) / generatedReports.length) * 100);

            const reportElement = document.getElementById(`report-card-${report.studentId}`);
            if (!reportElement) {
                console.error(`Report element not found for ${report.studentId}`);
                continue;
            }

            try {
                const canvas = await html2canvas(reportElement, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc) => {
                      const clonedElement = clonedDoc.getElementById(`report-card-${report.studentId}`);
                      if(clonedElement) {
                        clonedElement.style.display = 'block';
                        clonedElement.style.visibility = 'visible';
                      }
                    }
                });
                
                if (!canvas || canvas.width === 0 || canvas.height === 0) {
                    throw new Error('Invalid canvas generated');
                }

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                if (!imgData || imgData === 'data:,') {
                    throw new Error('Failed to generate image data');
                }

                if (i > 0) {
                    doc.addPage();
                }
                
                doc.addImage(imgData, 'JPEG', 0, 0, a4_width, a4_height, undefined, 'FAST');
            } catch (canvasError) {
                console.error(`Error processing canvas for ${report.studentName}:`, canvasError);
                toast({
                    variant: 'destructive',
                    title: `PDF Generation Warning`,
                    description: `Could not process report for ${report.studentName}. Continuing with others...`,
                });
                continue;
            }
        }
        
        const fileName = selectedStudent
            ? `report-card-${selectedStudent.name.replace(' ', '-')}.pdf`
            : `report-cards-${selectedClass?.name.replace(' ', '-')}.pdf`;
        doc.save(fileName);

    } catch (error) {
        console.error("PDF generation failed:", error);
        toast({
            variant: "destructive",
            title: "PDF Download Failed",
            description: "An unexpected error occurred while creating the PDF.",
        });
    } finally {
        setLoading(false);
        setCurrentStudent('');
        setLoadingProgress(0);
    }
};


  const isLoadingData = isLoadingClasses || isLoadingStudents || isLoadingGrades || isLoadingTraits || isLoadingAttendance;
  
  if (isLoadingData) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
          </div>
      )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Generation Target</CardTitle>
              <CardDescription>Choose a class or an individual student.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Popover open={classPopoverOpen} onOpenChange={setClassPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={classPopoverOpen} className="w-full justify-between">
                            {selectedClass ? selectedClass.name : "Select a class..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                        <Command>
                            <CommandInput placeholder="Search class..." />
                            <CommandList>
                                <CommandEmpty>No class found.</CommandEmpty>
                                <CommandGroup>
                                    {classes?.map((cls) => (
                                        <CommandItem
                                            key={cls.id}
                                            value={cls.name}
                                            onSelect={() => {
                                                setSelectedClass(cls);
                                                setSelectedStudent(null);
                                                setClassPopoverOpen(false);
                                            }}
                                        >
                                            <Users className="mr-2 h-4 w-4" />
                                            {cls.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                 </Popover>
               </div>
               <div className="flex items-center">
                    <div className="flex-grow border-t border-muted-foreground"></div>
                    <span className="flex-shrink mx-2 text-xs text-muted-foreground">OR</span>
                    <div className="flex-grow border-t border-muted-foreground"></div>
                </div>
                 <div className="space-y-2">
                     <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={studentPopoverOpen} className="w-full justify-between">
                                {selectedStudent ? selectedStudent.name : "Select a student..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Search student..." />
                                <CommandList>
                                    <CommandEmpty>No student found.</CommandEmpty>
                                    <CommandGroup>
                                        {allStudents?.map((student) => (
                                            <CommandItem
                                                key={student.id}
                                                value={student.name}
                                                onSelect={() => {
                                                    setSelectedStudent(student);
                                                    setSelectedClass(null);
                                                    setStudentPopoverOpen(false);
                                                }}
                                            >
                                                <User className="mr-2 h-4 w-4" />
                                                {student.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                     </Popover>
                </div>
                {(selectedClass || selectedStudent) && (
                <div className="mt-4 p-3 bg-secondary border rounded-lg">
                    <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                        {selectedStudent ? 'Selected Student' : 'Selected Class'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                        {selectedStudent ? selectedStudent.name : selectedClass?.name}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClearSelection}>
                        <X className="h-4 w-4" />
                    </Button>
                    </div>
                </div>
                )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerateReports} disabled={loading || (!selectedClass && !selectedStudent)}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : 'Generate Reports'}
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="lg:col-span-2">
            <Card className="min-h-[400px]">
                <CardHeader>
                    <CardTitle>Generated Reports</CardTitle>
                    <CardDescription>
                        {generatedReports.length > 0 ? `Showing ${generatedReports.length} report(s).` : 'Reports will be displayed here after generation.'}
                    </CardDescription>
                     {generatedReports.length > 0 && (
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={loading}>
                                {loading && currentStudent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                                Download PDF
                            </Button>
                            <Button size="sm" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print All
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading && (
                        <div className="flex flex-col items-center justify-center pt-10">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="font-semibold mb-2">{currentStudent || 'Generating Reports...'}</p>
                            <Progress value={loadingProgress} className="w-3/4" />
                            <p className="text-xs mt-2">{Math.round(loadingProgress)}% Complete</p>
                        </div>
                    )}

                    {!loading && generatedReports.length === 0 && (
                       <div className="flex flex-col items-center justify-center text-center pt-10">
                            <Award className="h-16 w-16 mb-4 text-muted-foreground/30" />
                            <p className="text-lg font-medium text-muted-foreground">
                            No Reports Generated Yet
                            </p>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                            Select a class or student and click "Generate Reports" to see the results.
                            </p>
                        </div>
                    )}

                    {!loading && generatedReports.length > 0 && (
                        <div className="space-y-4">
                           {generatedReports.map((report) => (
                                <Card key={report.studentId} className="border-l-4 border-l-primary">
                                <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                    <CardTitle className="text-lg">{report.studentName}</CardTitle>
                                    <CardDescription>
                                        {report.className} • {report.studentId}
                                    </CardDescription>
                                    </div>
                                    <Badge variant="outline">
                                    Position: {report.position > 0 ? `${report.position}/${report.totalStudents}` : 'N/A'}
                                    </Badge>
                                </div>
                                </CardHeader>
                                <CardContent>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                    <p className="text-muted-foreground">Average Score</p>
                                    <p className="text-xl font-bold text-blue-700">
                                        {report.averageScore.toFixed(1)}
                                    </p>
                                    </div>
                                    <div>
                                    <p className="text-muted-foreground">Overall Grade</p>
                                    <p className="text-xl font-bold text-green-700">
                                        {report.overallGrade}
                                    </p>
                                    </div>
                                    <div>
                                    <p className="text-muted-foreground">Attendance</p>
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
      <div className="hidden print:block space-y-4">
        {generatedReports.map((report, index) => (
          <Fragment key={report.studentId}>
            <ReportCard report={report} />
            {index < generatedReports.length - 1 && <div className="page-break" />}
          </Fragment>
        ))}
      </div>
       <style jsx global>{`
        @media print {
            body {
                background-color: #fff;
            }
            .print\\:hidden {
                display: none;
            }
            .print\\:block {
                display: block;
            }
            .a4-page, .a4-page * {
                visibility: visible !important;
                color: black !important;
            }
            .a4-page {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
            }
            .page-break {
                page-break-after: always;
            }
        }
        @page {
            size: A4;
            margin: 1cm;
        }
        .a4-page {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            margin: 1rem auto;
            border: 1px #D3D3D3 solid;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
            color: black;
            visibility: hidden;
            display: none;
        }
    `}</style>
    </>
  );
}
