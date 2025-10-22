import React from 'react';
import { School } from 'lucide-react';
import { ReportWithStudentAndGradeInfo } from '@/components/report-card-generator';

const ModernReportCard = ({ report }: { report: ReportWithStudentAndGradeInfo }) => {
    const getRatingText = (rating: number) => {
        const ratings: Record<number, string> = { 5: "Excellent", 4: "V.Good", 3: "Good", 2: "Fair", 1: "Poor" };
        return ratings[rating] || "N/A";
    };

    const affectiveTraits = (report.traits || []).filter(t => ["Punctuality", "Neatness", "Honesty", "Cooperation", "Attentiveness"].includes(t.name));
    const psychomotorSkills = (report.traits || []).filter(t => !affectiveTraits.map(at => at.name).includes(t.name));

    return (
        <div id={`report-card-${report.studentId}`} className="a4-page mx-auto bg-white shadow-lg border text-gray-800 font-sans">
            <div className="p-6 grid grid-cols-12 gap-6 h-full">
                {/* Left Column */}
                <div className="col-span-4 bg-gray-50 p-4 rounded-lg flex flex-col">
                    <div className="text-center mb-6">
                         <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center p-1 mb-2 border-2 border-gray-300">
                            {report.schoolLogo ? <img src={report.schoolLogo} alt="School Logo" className="object-contain h-full w-full rounded-full" /> : <School className="h-10 w-10 text-gray-400" />}
                        </div>
                        <h1 className="text-base font-extrabold text-gray-800 uppercase">{report.schoolName || 'Your School Name'}</h1>
                        <p className="text-[10px] text-gray-600">{report.schoolAddress || 'School Address Here'}</p>
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Overall Grade</p>
                        <p className="text-5xl font-extrabold text-primary">{report.overallGrade}</p>
                        
                        <div className="mt-2 text-xs">
                             <p>Average: <span className="font-bold">{report.averageScore.toFixed(1)}%</span></p>
                             <p>Position: <span className="font-bold">{report.position > 0 ? `${report.position} / ${report.totalStudents}` : 'N/A'}</span></p>
                        </div>
                    </div>

                    <div className="mt-auto text-[9px] text-center text-gray-500">
                        {report.schoolMotto && <p className="italic">"{report.schoolMotto}"</p>}
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-8 flex flex-col">
                    <div className="text-right mb-4">
                        <h2 className="text-lg font-bold text-gray-800">ACADEMIC REPORT</h2>
                        <p className="text-xs text-gray-600">{report.term}, {report.session}</p>
                    </div>

                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <span className="text-xs text-gray-500">Student Name:</span>
                            <p className="font-bold text-lg">{report.studentName}</p>
                        </div>
                        <div className="text-right">
                             <span className="text-xs text-gray-500">Class:</span>
                             <p className="font-bold">{report.className}</p>
                        </div>
                         <div className="text-right">
                             <span className="text-xs text-gray-500">ID:</span>
                             <p className="font-mono text-sm">{report.studentId}</p>
                        </div>
                    </div>

                    {/* Academic Performance */}
                    <div className="flex-grow">
                      <table className="w-full text-[9px] border-collapse">
                          <thead className="bg-gray-100"><tr className="text-left"><th className="p-1 border">SUBJECT</th><th className="p-1 border text-center">SCORE</th><th className="p-1 border text-center">GRADE</th></tr></thead>
                          <tbody>
                              {report.grades.map((subject, index) => (
                                  <tr key={index}><td className="p-1 border font-semibold">{subject.subject}</td><td className="p-1 border text-center font-bold">{subject.total}</td><td className="p-1 border text-center font-bold">{subject.grade}</td></tr>
                              ))}
                          </tbody>
                      </table>
                    </div>

                    {/* Traits Table */}
                    <div className="mt-4">
                        <table className="w-full text-[9px] border-collapse">
                            <thead><tr className="bg-gray-100"><th className="p-1 border text-left" colSpan={affectiveTraits.length > 0 ? 2 : 1}>AFFECTIVE TRAITS</th><th className="p-1 border text-left" colSpan={psychomotorSkills.length > 0 ? 2 : 1}>PSYCHOMOTOR SKILLS</th></tr></thead>
                            <tbody>
                                {Array.from({ length: Math.max(affectiveTraits.length, psychomotorSkills.length) }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-1 border">{affectiveTraits[i]?.name || ''}</td><td className="p-1 border text-center">{affectiveTraits[i] ? getRatingText(affectiveTraits[i].rating) : ''}</td>
                                        <td className="p-1 border">{psychomotorSkills[i]?.name || ''}</td><td className="p-1 border text-center">{psychomotorSkills[i] ? getRatingText(psychomotorSkills[i].rating) : ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="text-[8px] text-gray-500 mt-1">Rating: 5-Excellent, 4-V.Good, 3-Good, 2-Fair, 1-Poor</p>
                    </div>

                    {/* Comments */}
                    <div className="space-y-1 text-[9px] mt-3">
                        <div><p className="font-bold text-gray-700">TEACHER'S COMMENT:</p><p className="italic">{report.formTeacherComment}</p></div>
                        <div><p className="font-bold text-gray-700">PRINCIPAL'S COMMENT:</p><p className="italic">{report.principalComment}</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModernReportCard;
