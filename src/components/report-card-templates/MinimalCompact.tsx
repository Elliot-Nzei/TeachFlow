
import React from 'react';
import { ReportWithStudentAndGradeInfo } from '@/components/report-card-generator';
import { School } from 'lucide-react';

const MinimalCompact = ({ report }: { report: ReportWithStudentAndGradeInfo }) => {
  const getRatingText = (rating: number) => {
    const ratings: Record<number, string> = { 5: "E", 4: "VG", 3: "G", 2: "F", 1: "P" };
    return ratings[rating] || "N/A";
  };

  const affectiveTraits = (report.traits || []).filter(t => ["Punctuality", "Neatness", "Honesty", "Cooperation", "Attentiveness"].includes(t.name));
  const psychomotorSkills = (report.traits || []).filter(t => !affectiveTraits.map(at => at.name).includes(t.name));

  return (
    <div id={`report-card-${report.studentId}`} className="a4-page mx-auto bg-white shadow-xl border border-gray-200 text-gray-800 p-4 font-sans text-[9px] leading-tight">
      {/* Header */}
      <header className="text-center mb-2 border-b pb-2">
        <h1 className="text-sm font-bold uppercase">{report.schoolName}</h1>
        <p className="text-[8px]">{report.schoolAddress}</p>
      </header>

      {/* Student Info */}
      <section className="grid grid-cols-4 gap-x-2 text-[9px] mb-2">
        <div className="col-span-2"><b>Student:</b> {report.studentName}</div>
        <div><b>Class:</b> {report.className}</div>
        <div className="text-right"><b>Session:</b> {report.session}</div>
        <div className="col-span-2"><b>Student ID:</b> {report.studentId}</div>
        <div><b>Term:</b> {report.term}</div>
        <div className="text-right"><b>Position:</b> {report.position > 0 ? `${report.position}/${report.totalStudents}` : 'N/A'}</div>
      </section>

      {/* Main Content */}
      <main className="grid grid-cols-12 gap-x-2">
        {/* Academic Performance */}
        <div className="col-span-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1 text-left font-semibold">SUBJECT</th>
                <th className="border p-1 font-semibold">CA1</th>
                <th className="border p-1 font-semibold">CA2</th>
                <th className="border p-1 font-semibold">EXAM</th>
                <th className="border p-1 font-semibold">TOTAL</th>
                <th className="border p-1 font-semibold">GRADE</th>
              </tr>
            </thead>
            <tbody>
              {report.grades.map((grade, index) => (
                <tr key={index}>
                  <td className="border p-1 font-semibold">{grade.subject}</td>
                  <td className="border p-1 text-center">{grade.ca1 ?? '-'}</td>
                  <td className="border p-1 text-center">{grade.ca2 ?? '-'}</td>
                  <td className="border p-1 text-center">{grade.exam ?? '-'}</td>
                  <td className="border p-1 text-center font-bold">{grade.total}</td>
                  <td className="border p-1 text-center font-bold">{grade.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Traits and Summary */}
        <div className="col-span-4 space-y-2">
           <table className="w-full border-collapse">
                <thead className="bg-gray-100"><tr className="text-left"><th className="border p-1 font-semibold" colSpan={2}>AFFECTIVE TRAITS</th></tr></thead>
                <tbody>
                    {affectiveTraits.map((t, i) => <tr key={i}><td className="border p-1">{t.name}</td><td className="border p-1 text-center">{getRatingText(t.rating)}</td></tr>)}
                </tbody>
           </table>
            <table className="w-full border-collapse">
                <thead className="bg-gray-100"><tr className="text-left"><th className="border p-1 font-semibold" colSpan={2}>PSYCHOMOTOR SKILLS</th></tr></thead>
                <tbody>
                    {psychomotorSkills.map((t, i) => <tr key={i}><td className="border p-1">{t.name}</td><td className="border p-1 text-center">{getRatingText(t.rating)}</td></tr>)}
                </tbody>
            </table>
            <div className="text-[8px] text-gray-500">E: Excellent, VG: V.Good, G: Good, F: Fair, P: Poor</div>
        </div>
      </main>

      {/* Comments */}
      <footer className="mt-2 text-[9px] space-y-1 border-t pt-1">
        <p><b>Teacher's Comment:</b> <span className="italic">{report.formTeacherComment}</span></p>
        <p><b>Principal's Comment:</b> <span className="italic">{report.principalComment}</span></p>
      </footer>
    </div>
  );
};

export default MinimalCompact;
