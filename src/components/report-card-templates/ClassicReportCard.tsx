
import React from 'react';
import { School } from 'lucide-react';
import { ReportWithStudentAndGradeInfo } from '@/components/report-card-generator';

const ClassicReportCard = ({ report }: { report: ReportWithStudentAndGradeInfo }) => {
    const getRatingText = (rating: number) => {
        const ratings: Record<number, string> = { 5: "Excellent", 4: "Very Good", 3: "Good", 2: "Fair", 1: "Poor" };
        return ratings[rating] || "N/A";
    };

    const affectiveTraits = (report.traits || []).filter(t => ["Punctuality", "Neatness", "Honesty", "Cooperation", "Attentiveness"].includes(t.name));
    const psychomotorSkills = (report.traits || []).filter(t => !affectiveTraits.map(at => at.name).includes(t.name));

    return (
        <div id={`report-card-${report.studentId}`} className="a4-page mx-auto bg-white shadow-xl border border-gray-200 rounded-lg">
            <div className="p-6">
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center p-1">
                            {report.schoolLogo ? <img src={report.schoolLogo} alt="School Logo" className="object-contain h-full w-full" /> : <School className="h-8 w-8 text-gray-400" />}
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-gray-800 uppercase">{report.schoolName || 'Your School Name'}</h1>
                            <p className="text-[10px] text-gray-600">{report.schoolAddress || 'School Address Here'}</p>
                            {report.schoolMotto && <p className="text-[10px] italic text-gray-500">"{report.schoolMotto}"</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold text-gray-800">TERMINAL REPORT CARD</h2>
                        <p className="text-xs text-gray-600">{report.term}, {report.session}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between items-baseline">
                        <div>
                            <span className="text-xs text-gray-500">Student Name:</span>
                            <p className="font-bold text-lg text-gray-800">{report.studentName}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500">Class:</span>
                            <p className="font-bold text-lg text-gray-800">{report.className}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500">Student ID:</span>
                            <p className="font-mono text-sm text-gray-600">{report.studentId}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="font-bold text-gray-700 text-sm mb-1 border-b pb-1">ACADEMIC PERFORMANCE</h3>
                    <table className="w-full text-[9px] border-collapse">
                        <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-1 text-left align-middle font-semibold">SUBJECT</th>
                            <th className="border p-1 align-middle font-semibold">CA1 (20)</th>
                            <th className="border p-1 align-middle font-semibold">CA2 (20)</th>
                            <th className="border p-1 align-middle font-semibold">EXAM (60)</th>
                            <th className="border p-1 align-middle font-semibold">TOTAL (100)</th>
                            <th className="border p-1 align-middle font-semibold">GRADE</th>
                            <th className="border p-1 align-middle font-semibold">REMARK</th>
                        </tr>
                        </thead>
                        <tbody>
                        {report.grades.map((subject, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="border p-1 font-semibold align-middle">{subject.subject}</td>
                                <td className="border p-1 text-center align-middle">{subject.ca1 ?? 'N/A'}</td>
                                <td className="border p-1 text-center align-middle">{subject.ca2 ?? 'N/A'}</td>
                                <td className="border p-1 text-center align-middle">{subject.exam ?? 'N/A'}</td>
                                <td className="border p-1 text-center font-bold align-middle">{subject.total}</td>
                                <td className="border p-1 text-center font-bold align-middle">{subject.grade}</td>
                                <td className="border p-1 text-center align-middle">{subject.remark}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-12 gap-4 mb-4">
                    <div className="col-span-8">
                        <h3 className="font-bold text-gray-700 text-sm mb-1 border-b pb-1">PERFORMANCE SUMMARY & TRAITS</h3>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <h4 className="font-semibold text-gray-700 text-[10px] mb-1">AFFECTIVE DOMAIN</h4>
                                <table className="w-full text-[9px] border-collapse">
                                    <tbody>
                                    {affectiveTraits.map((trait, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}><td className="border p-1 align-middle">{trait.name}</td><td className="border p-1 text-center font-bold align-middle">{getRatingText(trait.rating)}</td></tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 text-[10px] mb-1">PSYCHOMOTOR SKILLS</h4>
                                <table className="w-full text-[9px] border-collapse">
                                    <tbody>
                                    {psychomotorSkills.map((skill, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}><td className="border p-1 align-middle">{skill.name}</td><td className="border p-1 text-center font-bold align-middle">{getRatingText(skill.rating)}</td></tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                     <div className="col-span-4 bg-gray-50 p-2 rounded-lg border">
                        <div className="text-center">
                            <p className="text-xs text-gray-600">Total Score</p>
                            <p className="text-2xl font-bold text-gray-800">{report.totalScore}</p>
                        </div>
                        <hr className="my-2"/>
                        <div className="flex justify-between text-center">
                             <div>
                                <p className="text-xs text-gray-600">Average</p>
                                <p className="text-xl font-bold text-gray-800">{report.averageScore.toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600">Position</p>
                                <p className="text-xl font-bold text-gray-800">{report.position > 0 ? `${report.position}/${report.totalStudents}` : 'N/A'}</p>
                            </div>
                        </div>
                         <hr className="my-2"/>
                         <p className="text-[9px] text-gray-600 mt-1 italic text-center">Rating: 5-Excellent, 4-V.Good, 3-Good, 2-Fair, 1-Poor</p>
                    </div>
                </div>

                <div className="space-y-2 text-[10px]">
                    <div><h3 className="font-bold text-gray-700 text-sm mb-0.5">FORM TEACHER'S COMMENT:</h3><div className="bg-gray-50 p-2 border text-[10px] min-h-[30px] italic"><p>{report.formTeacherComment}</p></div></div>
                    <div><h3 className="font-bold text-gray-700 text-sm mb-0.5">PRINCIPAL'S COMMENT:</h3><div className="bg-gray-50 p-2 border text-[10px] min-h-[30px] italic"><p>{report.principalComment}</p></div></div>
                </div>
                 <div className="text-center bg-gray-800 text-white py-1 mt-4 rounded-b-lg"><p className="font-bold text-xs">Next Term Begins: TBA</p></div>
            </div>
        </div>
    );
};

export default ClassicReportCard;
