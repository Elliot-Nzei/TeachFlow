
import React from 'react';
import { School, Award, TrendingUp } from 'lucide-react';
import { ReportWithStudentAndGradeInfo } from '@/components/report-card-generator';

const ModernReportCard = ({ report }: { report: ReportWithStudentAndGradeInfo }) => {
    const getRatingText = (rating: number) => {
        const ratings: Record<number, string> = { 5: "Excellent", 4: "Very Good", 3: "Good", 2: "Fair", 1: "Poor" };
        return ratings[rating] || "N/A";
    };

    const getGradeColor = (grade: string) => {
        const colors: Record<string, string> = {
            'A': 'bg-green-100 text-green-800',
            'B': 'bg-blue-100 text-blue-800',
            'C': 'bg-yellow-100 text-yellow-800',
            'D': 'bg-orange-100 text-orange-800',
            'E': 'bg-red-100 text-red-800',
            'F': 'bg-red-200 text-red-900'
        };
        return colors[grade] || 'bg-gray-100 text-gray-800';
    };

    const allTraits = [...(report.traits || [])];

    return (
        <div id={`report-card-${report.studentId}`} className="a4-page mx-auto bg-white shadow-xl border border-gray-200 rounded-lg text-gray-800">
            {/* Header Section */}
            <div className="p-6">
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center p-1">
                            {report.schoolLogo ? <img src={report.schoolLogo} alt="School Logo" className="object-contain h-full w-full" /> : <School className="h-8 w-8 text-gray-400" />}
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold uppercase">{report.schoolName || 'Your School Name'}</h1>
                            <p className="text-[10px] text-gray-600">{report.schoolAddress || 'School Address Here'}</p>
                            {report.schoolMotto && <p className="text-[10px] italic text-gray-500">"{report.schoolMotto}"</p>}
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <h2 className="text-lg font-bold">TERMINAL REPORT</h2>
                        <p className="text-xs text-gray-600">{report.term}, {report.session}</p>
                    </div>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-[10px]">
                    <div className="bg-gray-50 p-2 rounded-md">
                        <p className="font-semibold text-gray-500">STUDENT NAME</p>
                        <p className="font-bold text-sm">{report.studentName}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md">
                        <p className="font-semibold text-gray-500">CLASS</p>
                        <p className="font-bold text-sm">{report.className}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md">
                        <p className="font-semibold text-gray-500">STUDENT ID</p>
                        <p className="font-mono text-sm">{report.studentId}</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-12 gap-4">
                    {/* Academic Performance */}
                    <div className="col-span-8">
                        <h3 className="font-bold text-gray-700 text-sm mb-1 border-b pb-1">ACADEMIC PERFORMANCE</h3>
                        <table className="w-full text-[9px] border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-1 text-left font-semibold">SUBJECT</th>
                                    <th className="border p-1 font-semibold">CA1(20)</th>
                                    <th className="border p-1 font-semibold">CA2(20)</th>
                                    <th className="border p-1 font-semibold">EXAM(60)</th>
                                    <th className="border p-1 font-semibold">TOTAL</th>
                                    <th className="border p-1 font-semibold">GRADE</th>
                                    <th className="border p-1 font-semibold">REMARK</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.grades.map((subject, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="border p-1 font-semibold">{subject.subject}</td>
                                        <td className="border p-1 text-center">{subject.ca1 ?? 'N/A'}</td>
                                        <td className="border p-1 text-center">{subject.ca2 ?? 'N/A'}</td>
                                        <td className="border p-1 text-center">{subject.exam ?? 'N/A'}</td>
                                        <td className="border p-1 text-center font-bold">{subject.total}</td>
                                        <td className="border p-1 text-center">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] ${getGradeColor(subject.grade)}`}>
                                                {subject.grade}
                                            </span>
                                        </td>
                                        <td className="border p-1 text-center">{subject.remark}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Side Column */}
                    <div className="col-span-4 space-y-3">
                        {/* Summary */}
                        <div className="bg-gray-100 p-2 rounded-lg border">
                             <div className="grid grid-cols-2 gap-2 text-center">
                                <div>
                                    <p className="text-[9px] text-gray-600">Average</p>
                                    <p className="text-lg font-bold">{report.averageScore.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-600">Position</p>
                                    <p className="text-lg font-bold">{report.position > 0 ? `${report.position}/${report.totalStudents}` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Traits */}
                        <div>
                             <h3 className="font-bold text-gray-700 text-sm mb-1 border-b pb-1">BEHAVIOUR & SKILLS</h3>
                             <table className="w-full text-[9px]">
                                 <tbody>
                                     {allTraits.map((trait, index) => (
                                         <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                             <td className="p-1 font-medium text-gray-600">{trait.name}</td>
                                             <td className="p-1 text-right font-semibold text-gray-800">{getRatingText(trait.rating)}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                             <p className="text-[8px] text-gray-500 mt-1 italic text-center">Rating: 5-Excellent, 4-V.Good, 3-Good, 2-Fair, 1-Poor</p>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="mt-4 space-y-2 text-[10px]">
                    <div>
                        <h3 className="font-bold text-gray-700 text-sm mb-0.5">FORM TEACHER'S COMMENT:</h3>
                        <div className="bg-gray-50 p-2 border text-[10px] min-h-[30px] italic">
                            <p>{report.formTeacherComment}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 text-sm mb-0.5">PRINCIPAL'S COMMENT:</h3>
                        <div className="bg-gray-50 p-2 border text-[10px] min-h-[30px] italic">
                            <p>{report.principalComment}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center bg-gray-800 text-white py-1 mt-4 rounded-b-lg">
                    <p className="font-bold text-xs">Next Term Begins: TBA</p>
                </div>
            </div>
        </div>
    );
};

export default ModernReportCard;
