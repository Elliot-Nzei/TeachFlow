import React from 'react';
import { School } from 'lucide-react';
import { ReportWithStudentAndGradeInfo } from '@/components/report-card-generator';

const ClassicCompact = ({ report }: { report: ReportWithStudentAndGradeInfo }) => {
  const getRatingText = (r: number) =>
    ({ 5: "Excellent", 4: "V.Good", 3: "Good", 2: "Fair", 1: "Poor" }[r] || "N/A");

  const affective = (report.traits || []).filter(t =>
    ["Punctuality", "Neatness", "Honesty", "Cooperation", "Attentiveness"].includes(t.name)
  );
  const psychomotor = (report.traits || []).filter(
    t => !affective.map(a => a.name).includes(t.name)
  );

  return (
    <div id={`report-card-${report.studentId}`} className="a4-page w-[210mm] h-[297mm] mx-auto bg-white border border-gray-300 shadow-sm text-[9px] p-3 leading-tight">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-400 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-gray-50 flex items-center justify-center border rounded">
            {report.schoolLogo ? <img src={report.schoolLogo} alt="School Logo" className="object-contain h-full w-full" /> : <School className="h-5 w-5 text-gray-400" />}
          </div>
          <div>
            <h1 className="font-extrabold text-gray-800 text-sm uppercase">{report.schoolName}</h1>
            <p className="text-[8px] text-gray-600">{report.schoolAddress}</p>
            {report.schoolMotto && <p className="text-[8px] italic text-gray-500">"{report.schoolMotto}"</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xs font-bold text-gray-800">TERMINAL REPORT</h2>
          <p className="text-[8px] text-gray-600">{report.term}, {report.session}</p>
        </div>
      </div>

      {/* Student Info */}
      <div className="flex justify-between mb-2 text-[9px]">
        <div><b>Name:</b> {report.studentName}</div>
        <div><b>Class:</b> {report.className}</div>
        <div><b>ID:</b> {report.studentId}</div>
      </div>

      {/* Grades Table */}
      <table className="w-full border-collapse mb-2">
        <thead>
          <tr className="bg-gray-100">
            {["Subject", "CA1", "CA2", "Exam", "Total", "Grade", "Remark"].map(h => (
              <th key={h} className="border border-gray-300 px-[2px] py-[1px] text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.grades.map((s, i) => (
            <tr key={i} className={i % 2 ? "bg-gray-50" : "bg-white"}>
              <td className="border px-[2px] py-[1px]">{s.subject}</td>
              <td className="border text-center">{s.ca1 ?? "-"}</td>
              <td className="border text-center">{s.ca2 ?? "-"}</td>
              <td className="border text-center">{s.exam ?? "-"}</td>
              <td className="border text-center font-bold">{s.total}</td>
              <td className="border text-center">{s.grade}</td>
              <td className="border text-center">{s.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Traits */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-8">
          <div className="grid grid-cols-2 gap-1">
            <div>
              <h4 className="font-semibold text-[8px] border-b">Affective</h4>
              <table className="w-full border-collapse">
                <tbody>
                  {affective.map((t, i) => (
                    <tr key={i}><td className="border px-[2px]">{t.name}</td><td className="border text-center">{getRatingText(t.rating)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="font-semibold text-[8px] border-b">Psychomotor</h4>
              <table className="w-full border-collapse">
                <tbody>
                  {psychomotor.map((t, i) => (
                    <tr key={i}><td className="border px-[2px]">{t.name}</td><td className="border text-center">{getRatingText(t.rating)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-span-4 border p-1 rounded bg-gray-50 text-center">
          <p>Total: <b>{report.totalScore}</b></p>
          <p>Avg: <b>{report.averageScore.toFixed(1)}%</b></p>
          <p>Pos: <b>{report.position}/{report.totalStudents}</b></p>
        </div>
      </div>

      {/* Comments */}
      <div className="mt-2 text-[8px] space-y-1">
        <div><b>Teacher:</b> <i>{report.formTeacherComment}</i></div>
        <div><b>Principal:</b> <i>{report.principalComment}</i></div>
      </div>

      <div className="text-center bg-gray-800 text-white text-[8px] mt-2 py-[2px] rounded-b">
        Next Term: TBA
      </div>
    </div>
  );
};

export default ClassicCompact;
