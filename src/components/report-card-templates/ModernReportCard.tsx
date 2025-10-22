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
        <div id={`report-card-${report.studentId}`} className="w-[210mm] h-[297mm] mx-auto bg-white shadow-xl border border-gray-200 rounded-lg text-gray-800 overflow-hidden">
            <div className="p-4 h-full flex flex-col">
                {/* Header Section - Compact */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center p-0.5">
                            {report.schoolLogo ? <img src={report.schoolLogo} alt="School Logo" className="object-contain h-full w-full" /> : <School className="h-6 w-6 text-gray-400" />}
                        </div>
                        <div>
                            <h1 className="text-base font-extrabold uppercase leading-tight">{report.schoolName || 'Your School Name'}</h1>
                            <p className="text-[8px] text-gray-600">{report.schoolAddress || 'School Address Here'}</p>
                            {report.schoolMotto && <p className="text-[8px] italic text-gray-500">"{report.schoolMotto}"</p>}
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <h2 className="text-sm font-bold">TERMINAL REPORT</h2>
                        <p className="text-[9px] text-gray-600">{report.term}, {report.session}</p>
                    </div>
                </div>

                {/* Student Info - Compact */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-[9px]">
                    <div className="bg-gray-50 p-1.5 rounded">
                        <p className="font-semibold text-gray-500 text-[8px]">STUDENT NAME</p>
                        <p className="font-bold text-[10px] leading-tight">{report.studentName}</p>
                    </div>
                    <div className="bg-gray-50 p-1.5 rounded">
                        <p className="font-semibold text-gray-500 text-[8px]">CLASS</p>
                        <p className="font-bold text-[10px]">{report.className}</p>
                    </div>
                    <div className="bg-gray-50 p-1.5 rounded">
                        <p className="font-semibold text-gray-500 text-[8px]">STUDENT ID</p>
                        <p className="font-mono text-[10px]">{report.studentId}</p>
                    </div>
                </div>

                {/* Main Content Grid - Flexible height */}
                <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
                    {/* Academic Performance */}
                    <div className="col-span-8 flex flex-col min-h-0">
                        <h3 className="font-bold text-gray-700 text-xs mb-1 border-b pb-0.5">ACADEMIC PERFORMANCE</h3>
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-[8px] border-collapse">
                                <thead className="sticky top-0 bg-white">
                                    <tr className="bg-gray-100">
                                        <th className="border p-0.5 text-left font-semibold">SUBJECT</th>
                                        <th className="border p-0.5 font-semibold">CA1(20)</th>
                                        <th className="border p-0.5 font-semibold">CA2(20)</th>
                                        <th className="border p-0.5 font-semibold">EXAM(60)</th>
                                        <th className="border p-0.5 font-semibold">TOTAL</th>
                                        <th className="border p-0.5 font-semibold">GRADE</th>
                                        <th className="border p-0.5 font-semibold">REMARK</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.grades.map((subject, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border p-0.5 font-semibold">{subject.subject}</td>
                                            <td className="border p-0.5 text-center">{subject.ca1 ?? 'N/A'}</td>
                                            <td className="border p-0.5 text-center">{subject.ca2 ?? 'N/A'}</td>
                                            <td className="border p-0.5 text-center">{subject.exam ?? 'N/A'}</td>
                                            <td className="border p-0.5 text-center font-bold">{subject.total}</td>
                                            <td className="border p-0.5 text-center">
                                                <span className={`px-1.5 py-0.5 rounded-full font-bold text-[7px] ${getGradeColor(subject.grade)}`}>
                                                    {subject.grade}
                                                </span>
                                            </td>
                                            <td className="border p-0.5 text-center">{subject.remark}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Side Column */}
                    <div className="col-span-4 flex flex-col gap-2 min-h-0">
                        {/* Summary */}
                        <div className="bg-gray-100 p-2 rounded-lg border">
                             <div className="grid grid-cols-2 gap-2 text-center">
                                <div>
                                    <p className="text-[8px] text-gray-600">Average</p>
                                    <p className="text-base font-bold">{report.averageScore.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-[8px] text-gray-600">Position</p>
                                    <p className="text-base font-bold">{report.position > 0 ? `${report.position}/${report.totalStudents}` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Traits - Scrollable */}
                        <div className="flex-1 min-h-0 flex flex-col">
                             <h3 className="font-bold text-gray-700 text-xs mb-1 border-b pb-0.5">BEHAVIOUR & SKILLS</h3>
                             <div className="overflow-y-auto flex-1">
                                 <table className="w-full text-[8px]">
                                     <tbody>
                                         {allTraits.map((trait, index) => (
                                             <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                                 <td className="p-0.5 font-medium text-gray-600">{trait.name}</td>
                                                 <td className="p-0.5 text-right font-semibold text-gray-800">{getRatingText(trait.rating)}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                             <p className="text-[7px] text-gray-500 mt-1 italic text-center">Rating: 5-Excellent, 4-V.Good, 3-Good, 2-Fair, 1-Poor</p>
                        </div>
                    </div>
                </div>

                {/* Comments Section - Fixed height with scroll */}
                <div className="mt-2 space-y-1.5 text-[9px]">
                    <div>
                        <h3 className="font-bold text-gray-700 text-[9px] mb-0.5">FORM TEACHER'S COMMENT:</h3>
                        <div className="bg-gray-50 p-1.5 border text-[8px] h-[30px] overflow-y-auto italic">
                            <p className="leading-tight">{report.formTeacherComment}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 text-[9px] mb-0.5">PRINCIPAL'S COMMENT:</h3>
                        <div className="bg-gray-50 p-1.5 border text-[8px] h-[30px] overflow-y-auto italic">
                            <p className="leading-tight">{report.principalComment}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center bg-gray-800 text-white py-1 mt-2 rounded-b-lg">
                    <p className="font-bold text-[9px]">Next Term Begins: TBA</p>
                </div>
            </div>
        </div>
    );
};

export default ModernReportCard;