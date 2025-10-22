
import React from 'react';
import { ReportWithStudentAndGradeInfo } from '@/components/report-card-generator';

const MinimalCompact = ({ report }: { report: ReportWithStudentAndGradeInfo }) => {
  const rate = (r: number) => ({5:"E",4:"VG",3:"G",2:"F",1:"P"}[r] || "N/A");
  const aff = (report.traits||[]).filter(t=>["Punctuality","Neatness","Honesty","Cooperation","Attentiveness"].includes(t.name));
  const psy = (report.traits||[]).filter(t=>!aff.map(a=>a.name).includes(t.name));

  return (
    <div id={`report-card-${report.studentId}`} className="a4-page w-[210mm] h-[297mm] mx-auto bg-white text-[8px] font-sans p-2 leading-tight">
      <div className="text-center border-b border-gray-300 mb-1">
        <h1 className="font-bold text-xs">{report.schoolName}</h1>
        <p>{report.schoolAddress}</p>
        {report.schoolMotto && <p className="italic">"{report.schoolMotto}"</p>}
      </div>

      <div className="flex justify-between text-[8px] mb-1">
        <p><b>Name:</b> {report.studentName}</p>
        <p><b>Class:</b> {report.className}</p>
        <p><b>ID:</b> {report.studentId}</p>
      </div>

      <table className="w-full border border-gray-300 border-collapse mb-1">
        <thead><tr>{["Subj","CA1","CA2","Exam","Tot","Grd","Rem"].map(h=><th key={h} className="border px-[1px]">{h}</th>)}</tr></thead>
        <tbody>
          {report.grades.map((g,i)=><tr key={i}><td className="border px-[1px]">{g.subject}</td><td className="border text-center">{g.ca1}</td><td className="border text-center">{g.ca2}</td><td className="border text-center">{g.exam}</td><td className="border text-center">{g.total}</td><td className="border text-center">{g.grade}</td><td className="border text-center">{g.remark}</td></tr>)}
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-[2px] mb-1">
        <div>
          <h4 className="font-semibold border-b text-[7px]">Affective</h4>
          <table className="w-full border-collapse"><tbody>{aff.map((t,i)=><tr key={i}><td>{t.name}</td><td className="text-center">{rate(t.rating)}</td></tr>)}</tbody></table>
        </div>
        <div>
          <h4 className="font-semibold border-b text-[7px]">Psychomotor</h4>
          <table className="w-full border-collapse"><tbody>{psy.map((t,i)=><tr key={i}><td>{t.name}</td><td className="text-center">{rate(t.rating)}</td></tr>)}</tbody></table>
        </div>
        <div className="text-center border rounded p-[1px]">
          <p>Ttl: <b>{report.totalScore}</b></p>
          <p>Avg: <b>{report.averageScore.toFixed(1)}%</b></p>
          <p>Pos: <b>{report.position}/{report.totalStudents}</b></p>
        </div>
      </div>

      <p><b>Tchr:</b> <i>{report.formTeacherComment}</i></p>
      <p><b>Princ:</b> <i>{report.principalComment}</i></p>

      <div className="text-center bg-gray-800 text-white mt-1 py-[1px] rounded-b text-[7px]">
        Next Term: TBA
      </div>
    </div>
  );
};

export default MinimalCompact;
