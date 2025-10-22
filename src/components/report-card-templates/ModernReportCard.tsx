import React from 'react';
import { ReportWithStudentAndGradeInfo } from '@/components/report-card-generator';

const ModernCompact = ({ report }: { report: ReportWithStudentAndGradeInfo }) => {
  const rate = (r: number) => ({ 5: "E", 4: "VG", 3: "G", 2: "F", 1: "P" }[r] || "N/A");
  const affective = (report.traits || []).filter(t => ["Punctuality","Neatness","Honesty","Cooperation","Attentiveness"].includes(t.name));
  const psychomotor = (report.traits || []).filter(t => !affective.map(a => a.name).includes(t.name));

  return (
    <div className="a4-page w-[210mm] h-[297mm] mx-auto bg-white text-[9px] p-3 font-sans leading-tight">
      <header className="text-center border-b border-gray-400 pb-2 mb-2">
        <h1 className="font-bold text-sm uppercase">{report.schoolName}</h1>
        <p className="text-[8px] text-gray-600">{report.schoolAddress}</p>
        <p className="text-[8px] italic text-gray-500">"{report.schoolMotto}"</p>
      </header>

      <section className="grid grid-cols-3 text-[9px] mb-2">
        <p><b>Name:</b> {report.studentName}</p>
        <p><b>Class:</b> {report.className}</p>
        <p><b>ID:</b> {report.studentId}</p>
      </section>

      <table className="w-full border border-gray-300 border-collapse mb-2">
        <thead className="bg-gray-100">
          <tr>{["Subject","CA1","CA2","Exam","Total","Grade","Remark"].map(h => <th key={h} className="border px-[2px] py-[1px] text-left">{h}</th>)}</tr>
        </thead>
        <tbody>
          {report.grades.map((g,i)=>
            <tr key={i} className={i%2?"bg-gray-50":"bg-white"}>
              <td className="border px-[2px]">{g.subject}</td>
              <td className="border text-center">{g.ca1}</td>
              <td className="border text-center">{g.ca2}</td>
              <td className="border text-center">{g.exam}</td>
              <td className="border text-center font-bold">{g.total}</td>
              <td className="border text-center">{g.grade}</td>
              <td className="border text-center">{g.remark}</td>
            </tr>)}
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-1 mb-2">
        <div className="col-span-2 grid grid-cols-2 gap-1">
          <div>
            <h4 className="font-semibold border-b text-[8px]">Affective</h4>
            <table className="w-full border-collapse">
              <tbody>{affective.map((t,i)=><tr key={i}><td className="border px-[2px]">{t.name}</td><td className="border text-center">{rate(t.rating)}</td></tr>)}</tbody>
            </table>
          </div>
          <div>
            <h4 className="font-semibold border-b text-[8px]">Psychomotor</h4>
            <table className="w-full border-collapse">
              <tbody>{psychomotor.map((t,i)=><tr key={i}><td className="border px-[2px]">{t.name}</td><td className="border text-center">{rate(t.rating)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="bg-gray-50 border rounded text-center p-1">
          <p>Total: <b>{report.totalScore}</b></p>
          <p>Avg: <b>{report.averageScore.toFixed(1)}%</b></p>
          <p>Pos: <b>{report.position}/{report.totalStudents}</b></p>
        </div>
      </div>

      <footer className="text-[8px] space-y-[2px]">
        <p><b>Teacher:</b> <i>{report.formTeacherComment}</i></p>
        <p><b>Principal:</b> <i>{report.principalComment}</i></p>
        <div className="text-center bg-gray-800 text-white py-[2px] rounded-b">Next Term: TBA</div>
      </footer>
    </div>
  );
};

export default ModernCompact;
