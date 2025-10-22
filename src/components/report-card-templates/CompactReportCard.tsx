
import React from 'react';
import { School, Star } from 'lucide-react';
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
        <div id={`report-card-${report.studentId}`} className="a4-page mx-auto bg-white shadow-xl border border-gray-200 rounded-lg font-sans">
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center border-b-4 border-primary pb-4 mb-4">
                    <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center p-1 border-2 border-primary">
                            {report.schoolLogo ? <img src={report.schoolLogo} alt="School Logo" className="object-contain h-full w-full rounded-full" /> : <School className="h-8 w-8 text-primary" />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-primary uppercase tracking-wider">{report.schoolName || 'Your School Name'}</h1>
                            <p className="text-xs text-gray-500">{report.schoolMotto || 'School Motto'}</p>
                        </div>
                    </div>
                     <div className="text-right">
                        <h2 className="text-lg font-bold text-gray-700">STUDENT REPORT</h2>
                        <p className="text-xs text-gray-500">{report.term}, {report.session}</p>
                    </div>
                </div>

                {/* Student Info */}
                 <div className="mb-4 bg-primary/5 p-3 rounded-lg border border-primary/20">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-gray-500">Student</p>
                            <p className="font-bold text-gray-800">{report.studentName}</p>
                        </div>
                         <div>
                            <p className="text-xs text-gray-500">Class</p>
                            <p className="font-bold text-gray-800">{report.className}</p>
                        </div>
                         <div>
                            <p className="text-xs text-gray-500">Student ID</p>
                            <p className="font-mono text-gray-600">{report.studentId}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Academic Performance Column */}
                    <div className="col-span-2">
                        <h3 className="font-bold text-gray-700 text-base mb-2 border-b-2 border-primary/30 pb-1">Academic Performance</h3>
                        <table className="w-full text-[10px]">
                            <thead>
                                <tr className="text-left text-gray-500">
                                    <th className="py-1 pr-2 font-semibold">SUBJECT</th>
                                    <th className="p-1 font-semibold text-center">SCORE</th>
                                    <th className="p-1 font-semibold text-center">GRADE</th>
                                </tr>
                            </thead>
                            <tbody>
                            {report.grades.map((subject, index) => (
                                <tr key={index} className="border-t">
                                    <td className="py-1.5 pr-2 font-medium text-gray-700">{subject.subject}</td>
                                    <td className="p-1 text-center">{subject.total}</td>
                                    <td className="p-1 text-center font-bold">{subject.grade}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Summary and Traits Column */}
                    <div className="col-span-1 space-y-4">
                         {/* Performance Summary */}
                        <div>
                            <h3 className="font-bold text-gray-700 text-base mb-2 border-b-2 border-primary/30 pb-1">Summary</h3>
                            <div className="space-y-3 text-center">
                                 <div>
                                    <p className="text-xs text-gray-500">Overall Grade</p>
                                    <p className={`text-4xl font-extrabold ${overallGradeColor(report.overallGrade)}`}>{report.overallGrade}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-gray-100 p-2 rounded-md">
                                        <p className="text-xs text-gray-500">Average</p>
                                        <p className="font-bold text-gray-800">{report.averageScore.toFixed(1)}%</p>
                                    </div>
                                    <div className="bg-gray-100 p-2 rounded-md">
                                        <p className="text-xs text-gray-500">Position</p>
                                        <p className="font-bold text-gray-800">{report.position > 0 ? `${report.position}/${report.totalStudents}` : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* Traits */}
                        <div>
                            <h3 className="font-bold text-gray-700 text-base mb-2 border-b-2 border-primary/30 pb-1">Behavioral Traits</h3>
                            <div className="space-y-2 text-xs">
                                {(report.traits || []).map((trait, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className="font-medium text-gray-600">{trait.name}</p>
                                            <p className="font-semibold text-primary">{getRatingText(trait.rating)}</p>
                                        </div>
                                        <Progress value={trait.rating * 20} className="h-1.5"/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments */}
                <div className="mt-6 space-y-3 text-[10px]">
                    <div>
                        <h4 className="font-bold text-gray-600 text-xs tracking-wider">TEACHER'S COMMENT</h4>
                        <p className="text-gray-700 italic p-2 border-l-2 border-primary/50 bg-gray-50 min-h-[25px]">{report.formTeacherComment}</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-gray-600 text-xs tracking-wider">PRINCIPAL'S COMMENT</h4>
                        <p className="text-gray-700 italic p-2 border-l-2 border-primary/50 bg-gray-50 min-h-[25px]">{report.principalComment}</p>
                    </div>
                </div>
                
                 {/* Footer */}
                <div className="text-center text-primary py-2 mt-6 border-t-4 border-primary">
                    <p className="font-bold text-xs">Next Term Begins: TBA</p>
                </div>
            </div>
        </div>
    );
};

export default CompactReportCard;
