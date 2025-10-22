import React from 'react';
import { School } from 'lucide-react';
import { ReportWithStudentAndGradeInfo } from '@/components/report-card-generator';

const CompactReportCard = ({ report }: { report: ReportWithStudentAndGradeInfo }) => {
  const getRatingText = (r: number) =>
    ({ 5: "Excellent", 4: "V.Good", 3: "Good", 2: "Fair", 1: "Poor" }[r] || "N/A");

  const affectiveTraits = (report.traits || []).filter(t =>
    ["Punctuality", "Neatness", "Honesty", "Cooperation", "Attentiveness"].includes(t.name)
  );
  const psychomotorSkills = (report.traits || []).filter(
    t => !affectiveTraits.map(a => a.name).includes(t.name)
  );

  return (
    <div id={`report-card-${report.studentId}`} className="a4-page mx-auto bg-white shadow-xl border border-gray-200 rounded-lg text-gray-800 p-4 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center border-b-2 border-gray-700 pb-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gray-100 p-1 flex items-center justify-center border rounded">
            {report.schoolLogo ? <img src={report.schoolLogo} alt="School Logo" className="object-contain h-full w-full" /> : <School className="h-6 w-6 text-gray-400" />}
          </div>
          <div>
            <h1 className="text-lg font-extrabold uppercase">{report.schoolName}</h1>
            <p className="text-[9px] text-gray-600">{report.schoolAddress}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-bold">TERMINAL REPORT</h2>
          <p className="text-[9px] text-gray-600">{report.term}, {report.session}</p>
        </div>
      </header>

      {/* Student Info */}
      <section className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
        <div><span className="text-gray-500">NAME:</span> <b className="block">{report.studentName}</b></div>
        <div><span className="text-gray-500">CLASS:</span> <b className="block">{report.className}</b></div>
        <div><span className="text-gray-500">STUDENT ID:</span> <b className="block font-mono">{report.studentId}</b></div>
      </section>

      <main className="grid grid-cols-12 gap-4">
        {/* Grades Table */}
        <div className="col-span-8">
            <h3 className="font-bold text-gray-700 text-xs mb-1">ACADEMIC PERFORMANCE</h3>
            <table className="w-full text-[9px] border-collapse">
                <thead>
                    <tr className="bg-gray-100">
                        {["Subject", "CA1", "CA2", "Exam", "Total", "Grade"].map(h => (
                        <th key={h} className="border p-1 text-left font-semibold">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                {report.grades.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                        <td className="border p-1 font-semibold">{s.subject}</td>
                        <td className="border p-1 text-center">{s.ca1 ?? '-'}</td>
                        <td className="border p-1 text-center">{s.ca2 ?? '-'}</td>
                        <td className="border p-1 text-center">{s.exam ?? '-'}</td>
                        <td className="border p-1 text-center font-bold">{s.total}</td>
                        <td className="border p-1 text-center font-bold">{s.grade}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>

        {/* Summary & Traits */}
        <div className="col-span-4 space-y-3">
            <div className="bg-gray-50 p-2 rounded-lg border text-center">
                <p className="text-[9px] text-gray-600">Overall Average</p>
                <p className="text-2xl font-bold">{report.averageScore.toFixed(1)}%</p>
                <p className="text-[9px] text-gray-600 mt-1">Position: <b>{report.position > 0 ? `${report.position}/${report.totalStudents}` : 'N/A'}</b></p>
            </div>
             <div>
                <h4 className="font-semibold text-gray-700 text-[10px] mb-1 border-b">BEHAVIORAL TRAITS</h4>
                <table className="w-full text-[9px]">
                    <tbody>
                        {[...affectiveTraits, ...psychomotorSkills].map((trait, i) => (
                            <tr key={i}><td className="py-[1px]">{trait.name}</td><td className="py-[1px] text-right font-semibold">{getRatingText(trait.rating)}</td></tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
      </main>
      
      {/* Comments */}
       <footer className="mt-3 space-y-1 text-[9px] border-t pt-2">
            <div><b className="text-gray-600">Teacher's Comment:</b> <i>{report.formTeacherComment}</i></div>
            <div><b className="text-gray-600">Principal's Comment:</b> <i>{report.principalComment}</i></div>
       </footer>
    </div>
  );
};

export default CompactReportCard;
