
import React from 'react';
import { School, Award, CheckCircle, XCircle } from 'lucide-react';
import { ReportWithStudentAndGradeInfo } from '@/components/report-card-generator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

const ModernReportCard = ({ report }: { report: ReportWithStudentAndGradeInfo }) => {

    const getRatingText = (rating: number): string => {
        const ratings: Record<number, string> = { 5: "Excellent", 4: "Very Good", 3: "Good", 2: "Fair", 1: "Poor" };
        return ratings[rating] || "N/A";
    };

    const getGradeColorClass = (grade: string): string => {
        switch (grade) {
            case 'A': return 'bg-green-100 text-green-800';
            case 'B': return 'bg-blue-100 text-blue-800';
            case 'C': return 'bg-yellow-100 text-yellow-800';
            case 'D': return 'bg-orange-100 text-orange-800';
            default: return 'bg-red-100 text-red-800';
        }
    };
    
    return (
        <div id={`report-card-${report.studentId}`} className="a4-page mx-auto bg-white shadow-xl flex">
            {/* Left Sidebar */}
            <div className="w-1/3 bg-primary text-primary-foreground p-6 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1">
                            {report.schoolLogo ? <img src={report.schoolLogo} alt="School Logo" className="object-contain h-full w-full rounded-full" /> : <School className="h-6 w-6 text-primary" />}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold uppercase leading-tight">{report.schoolName || 'School Name'}</h1>
                            <p className="text-xs opacity-80">{report.schoolMotto || 'School Motto'}</p>
                        </div>
                    </div>
                    
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold leading-tight">{report.studentName}</h2>
                        <p className="text-sm opacity-80">{report.className}</p>
                        <p className="text-xs font-mono opacity-70 mt-1">{report.studentId}</p>
                    </div>

                    <Separator className="bg-primary-foreground/20 my-6" />

                    <div className="text-center space-y-4">
                        <div >
                            <p className="text-xs uppercase tracking-wider opacity-70">Overall Grade</p>
                            <p className="text-5xl font-extrabold">{report.overallGrade}</p>
                        </div>
                         <div>
                            <p className="text-xs uppercase tracking-wider opacity-70">Class Position</p>
                            <p className="text-2xl font-bold">{report.position > 0 ? `${report.position}/${report.totalStudents}` : 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-center opacity-70">
                    <p>{report.term}</p>
                    <p>{report.session}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-2/3 p-6 space-y-4 text-[10px] text-gray-800">
                 {/* Academic Performance */}
                 <div>
                    <h3 className="font-bold text-sm mb-2 text-primary tracking-wider">ACADEMIC PERFORMANCE</h3>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-gray-600 text-[9px] uppercase">
                                <tr>
                                    <th className="p-2 text-left">Subject</th>
                                    <th className="p-2 text-center">CA1</th>
                                    <th className="p-2 text-center">CA2</th>
                                    <th className="p-2 text-center">Exam</th>
                                    <th className="p-2 text-center">Total</th>
                                    <th className="p-2 text-center">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.grades.map((g, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="p-1.5 font-medium">{g.subject}</td>
                                        <td className="p-1.5 text-center">{g.ca1 ?? '-'}</td>
                                        <td className="p-1.5 text-center">{g.ca2 ?? '-'}</td>
                                        <td className="p-1.5 text-center">{g.exam ?? '-'}</td>
                                        <td className="p-1.5 text-center font-bold">{g.total}</td>
                                        <td className="p-1.5 text-center">
                                            <span className={cn('px-2 py-0.5 rounded-full font-bold text-xs', getGradeColorClass(g.grade))}>
                                                {g.grade}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     {/* Traits */}
                    <div>
                         <h3 className="font-bold text-sm mb-2 text-primary tracking-wider">BEHAVIOR & SKILLS</h3>
                         <div className="space-y-1">
                             {(report.traits || []).map((trait, i) => (
                                 <div key={i} className="flex justify-between items-center bg-gray-50 p-1.5 rounded-md">
                                     <span className="font-medium">{trait.name}</span>
                                     <span className="font-bold text-primary">{getRatingText(trait.rating)}</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                     {/* Attendance */}
                     <div>
                         <h3 className="font-bold text-sm mb-2 text-primary tracking-wider">ATTENDANCE</h3>
                         <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Days Present:</span>
                                <span className="font-bold text-green-600">{report.attendance?.presentDays}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Days Absent:</span>
                                <span className="font-bold text-red-600">{report.attendance?.absentDays}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Total School Days:</span>
                                <span className="font-bold">{report.attendance?.totalDays}</span>
                            </div>
                         </div>
                    </div>
                </div>
               
                {/* Comments */}
                <div className="space-y-3">
                    <div>
                        <h3 className="font-bold text-sm mb-1 text-primary tracking-wider">TEACHER'S COMMENT</h3>
                        <p className="text-[9px] p-2 bg-gray-50 rounded-md border-l-2 border-primary italic">
                            {report.formTeacherComment}
                        </p>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm mb-1 text-primary tracking-wider">PRINCIPAL'S COMMENT</h3>
                         <p className="text-[9px] p-2 bg-gray-50 rounded-md border-l-2 border-primary italic">
                            {report.principalComment}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModernReportCard;
