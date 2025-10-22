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

    const affectiveTraits = (report.traits || []).filter(t => ["Punctuality", "Neatness", "Honesty", "Cooperation", "Attentiveness"].includes(t.name));
    const psychomotorSkills = (report.traits || []).filter(t => !affectiveTraits.map(at => at.name).includes(t.name));

    return (
        <div id={`report-card-${report.studentId}`} className="a4-page mx-auto bg-gradient-to-br from-blue-50 to-purple-50 shadow-2xl rounded-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-2 shadow-lg">
                            {report.schoolLogo ? (
                                <img src={report.schoolLogo} alt="School Logo" className="object-contain h-full w-full" />
                            ) : (
                                <School className="h-10 w-10 text-blue-600" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-wide">{report.schoolName || 'Your School Name'}</h1>
                            <p className="text-xs text-blue-100">{report.schoolAddress || 'School Address Here'}</p>
                            {report.schoolMotto && <p className="text-xs italic text-blue-200 mt-1">"{report.schoolMotto}"</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-white text-blue-600 px-4 py-2 rounded-lg shadow-md">
                            <h2 className="text-sm font-bold">REPORT CARD</h2>
                            <p className="text-xs">{report.term}, {report.session}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Student Info Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                        <p className="text-xs text-gray-500 mb-1">Student Name</p>
                        <p className="font-bold text-base text-gray-800">{report.studentName}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
                        <p className="text-xs text-gray-500 mb-1">Class</p>
                        <p className="font-bold text-base text-gray-800">{report.className}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                        <p className="text-xs text-gray-500 mb-1">Student ID</p>
                        <p className="font-mono text-sm text-gray-700">{report.studentId}</p>
                    </div>
                </div>

                {/* Performance Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium">Total Score</p>
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <p className="text-3xl font-bold">{report.totalScore}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium">Average</p>
                            <Award className="h-4 w-4" />
                        </div>
                        <p className="text-3xl font-bold">{report.averageScore.toFixed(1)}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium">Class Position</p>
                            <Award className="h-4 w-4" />
                        </div>
                        <p className="text-3xl font-bold">{report.position > 0 ? `${report.position}/${report.totalStudents}` : 'N/A'}</p>
                    </div>
                </div>

                {/* Academic Performance */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                    <h3 className="font-bold text-gray-800 text-base mb-3 flex items-center gap-2">
                        <div className="w-1 h-6 bg-blue-600 rounded"></div>
                        ACADEMIC PERFORMANCE
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[10px]">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-100 to-purple-100">
                                    <th className="p-2 text-left font-semibold text-gray-700">SUBJECT</th>
                                    <th className="p-2 text-center font-semibold text-gray-700">CA1<br/>(20)</th>
                                    <th className="p-2 text-center font-semibold text-gray-700">CA2<br/>(20)</th>
                                    <th className="p-2 text-center font-semibold text-gray-700">EXAM<br/>(60)</th>
                                    <th className="p-2 text-center font-semibold text-gray-700">TOTAL<br/>(100)</th>
                                    <th className="p-2 text-center font-semibold text-gray-700">GRADE</th>
                                    <th className="p-2 text-center font-semibold text-gray-700">REMARK</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.grades.map((subject, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                        <td className="p-2 font-semibold text-gray-800">{subject.subject}</td>
                                        <td className="p-2 text-center text-gray-700">{subject.ca1 ?? 'N/A'}</td>
                                        <td className="p-2 text-center text-gray-700">{subject.ca2 ?? 'N/A'}</td>
                                        <td className="p-2 text-center text-gray-700">{subject.exam ?? 'N/A'}</td>
                                        <td className="p-2 text-center font-bold text-gray-900">{subject.total}</td>
                                        <td className="p-2 text-center">
                                            <span className={`px-2 py-1 rounded-full font-bold ${getGradeColor(subject.grade)}`}>
                                                {subject.grade}
                                            </span>
                                        </td>
                                        <td className="p-2 text-center text-gray-600">{subject.remark}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Traits Section */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                            <div className="w-1 h-5 bg-green-600 rounded"></div>
                            AFFECTIVE DOMAIN
                        </h4>
                        <div className="space-y-2">
                            {affectiveTraits.map((trait, index) => (
                                <div key={index} className="flex justify-between items-center text-[10px] p-2 bg-gray-50 rounded">
                                    <span className="text-gray-700">{trait.name}</span>
                                    <span className="font-bold text-gray-900">{getRatingText(trait.rating)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                            <div className="w-1 h-5 bg-orange-600 rounded"></div>
                            PSYCHOMOTOR SKILLS
                        </h4>
                        <div className="space-y-2">
                            {psychomotorSkills.map((skill, index) => (
                                <div key={index} className="flex justify-between items-center text-[10px] p-2 bg-gray-50 rounded">
                                    <span className="text-gray-700">{skill.name}</span>
                                    <span className="font-bold text-gray-900">{getRatingText(skill.rating)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-3 mb-4">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <h3 className="font-bold text-gray-800 text-sm mb-2">FORM TEACHER'S COMMENT</h3>
                        <p className="text-[10px] text-gray-700 italic bg-blue-50 p-3 rounded">{report.formTeacherComment}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <h3 className="font-bold text-gray-800 text-sm mb-2">PRINCIPAL'S COMMENT</h3>
                        <p className="text-[10px] text-gray-700 italic bg-purple-50 p-3 rounded">{report.principalComment}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-lg shadow-lg">
                    <p className="font-bold text-sm">Next Term Begins: TBA</p>
                    <p className="text-xs mt-1">Rating Scale: 5-Excellent | 4-Very Good | 3-Good | 2-Fair | 1-Poor</p>
                </div>
            </div>
        </div>
    );
};

export default ModernReportCard;