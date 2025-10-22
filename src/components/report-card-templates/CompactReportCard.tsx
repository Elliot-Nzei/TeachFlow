import React from 'react';
import { School } from 'lucide-react';
import { ReportWithStudentAndGradeInfo } from '@/components/report-card-generator';
import { Progress } from '../ui/progress';

const CompactReportCard = ({ report }: { report: ReportWithStudentAndGradeInfo }) => {
    const getRatingText = (rating: number) => {
        const ratings: Record<number, string> = { 5: "Excellent", 4: "V. Good", 3: "Good", 2: "Fair", 1: "Poor" };
        return ratings[rating] || "N/A";
    };

    const overallGradeColor = (grade: string) => {
        switch(grade) {
            case 'A': return 'text-green-600';
            case 'B': return 'text-blue-600';
            case 'C': return 'text-yellow-600';
            default: return 'text-red-600';
        }
    };
    
    return (
        <div id={`report-card-${report.studentId}`} className="w-[210mm] h-[297mm] mx-auto bg-white shadow-xl border border-gray-200 font-sans overflow-hidden">
            <div className="p-4 h-full flex flex-col">
                {/* Header - Compact */}
                <div className="flex justify-between items-center border-b-2 border-primary pb-2 mb-3">
                    <div className="flex items-center gap-2">
                         <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center p-0.5 border-2 border-primary">
                            {report.schoolLogo ? <img src={report.schoolLogo} alt="School Logo" className="object-contain h-full w-full rounded-full" /> : <School className="h-6 w-6 text-primary" />}
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-primary uppercase tracking-wide">{report.schoolName || 'Your School Name'}</h1>
                            <p className="text-[8px] text-gray-500">{report.schoolMotto || 'School Motto'}</p>
                        </div>
                    </div>
                     <div className="text-right">
                        <h2 className="text-sm font-bold text-gray-700">STUDENT REPORT</h2>
                        <p className="text-[9px] text-gray-500">{report.term}, {report.session}</p>
                    </div>
                </div>

                {/* Student Info - More Compact */}
                 <div className="mb-2 bg-primary/5 p-2 rounded border border-primary/20">
                    <div className="grid grid-cols-3 gap-3 text-[10px]">
                        <div>
                            <p className="text-[8px] text-gray-500">Student</p>
                            <p className="font-bold text-gray-800 leading-tight">{report.studentName}</p>
                        </div>
                         <div>
                            <p className="text-[8px] text-gray-500">Class</p>
                            <p className="font-bold text-gray-800">{report.className}</p>
                        </div>
                         <div>
                            <p className="text-[8px] text-gray-500">Student ID</p>
                            <p className="font-mono text-gray-600">{report.studentId}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid - Optimized spacing */}
                <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
                    {/* Academic Performance Column */}
                    <div className="col-span-2 flex flex-col min-h-0">
                        <h3 className="font-bold text-gray-700 text-xs mb-1 border-b border-primary/30 pb-0.5">Academic Performance</h3>
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-[9px]">
                                <thead className="sticky top-0 bg-white">
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="py-1 pr-2 font-semibold">SUBJECT</th>
                                        <th className="p-1 font-semibold text-center">SCORE</th>
                                        <th className="p-1 font-semibold text-center">GRADE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {report.grades.map((subject, index) => (
                                    <tr key={index} className="border-t border-gray-100">
                                        <td className="py-1 pr-2 font-medium text-gray-700">{subject.subject}</td>
                                        <td className="p-1 text-center">{subject.total}</td>
                                        <td className="p-1 text-center font-bold">{subject.grade}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Summary and Traits Column */}
                    <div className="col-span-1 flex flex-col gap-2 min-h-0">
                         {/* Performance Summary */}
                        <div>
                            <h3 className="font-bold text-gray-700 text-xs mb-1 border-b border-primary/30 pb-0.5">Summary</h3>
                            <div className="space-y-2 text-center">
                                 <div>
                                    <p className="text-[8px] text-gray-500">Overall Grade</p>
                                    <p className={`text-3xl font-extrabold ${overallGradeColor(report.overallGrade)}`}>{report.overallGrade}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[9px]">
                                    <div className="bg-gray-100 p-1.5 rounded">
                                        <p className="text-[8px] text-gray-500">Average</p>
                                        <p className="font-bold text-gray-800">{report.averageScore.toFixed(1)}%</p>
                                    </div>
                                    <div className="bg-gray-100 p-1.5 rounded">
                                        <p className="text-[8px] text-gray-500">Position</p>
                                        <p className="font-bold text-gray-800">{report.position > 0 ? `${report.position}/${report.totalStudents}` : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* Traits - Scrollable if needed */}
                        <div className="flex-1 min-h-0 flex flex-col">
                            <h3 className="font-bold text-gray-700 text-xs mb-1 border-b border-primary/30 pb-0.5">Behavioral Traits</h3>
                            <div className="space-y-1.5 text-[9px] overflow-y-auto">
                                {(report.traits || []).map((trait, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className="font-medium text-gray-600 text-[8px]">{trait.name}</p>
                                            <p className="font-semibold text-primary text-[8px]">{getRatingText(trait.rating)}</p>
                                        </div>
                                        <Progress value={trait.rating * 20} className="h-1"/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments - Fixed height with scrollable content */}
                <div className="mt-2 space-y-1.5 text-[9px]">
                    <div>
                        <h4 className="font-bold text-gray-600 text-[9px] tracking-wider mb-0.5">TEACHER'S COMMENT</h4>
                        <div className="text-gray-700 italic p-1.5 border-l-2 border-primary/50 bg-gray-50 h-[35px] overflow-y-auto">
                            <p className="leading-tight">{report.formTeacherComment}</p>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-bold text-gray-600 text-[9px] tracking-wider mb-0.5">PRINCIPAL'S COMMENT</h4>
                        <div className="text-gray-700 italic p-1.5 border-l-2 border-primary/50 bg-gray-50 h-[35px] overflow-y-auto">
                            <p className="leading-tight">{report.principalComment}</p>
                        </div>
                    </div>
                </div>
                
                 {/* Footer */}
                <div className="text-center text-primary py-1 mt-2 border-t-2 border-primary">
                    <p className="font-bold text-[9px]">Next Term Begins: TBA</p>
                </div>
            </div>
        </div>
    );
};

export default CompactReportCard;