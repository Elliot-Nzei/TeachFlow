import ReportCardGenerator from '@/components/report-card-generator';

export default function ReportsPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Report Card Generation</h1>
      </div>
      <ReportCardGenerator />
    </>
  );
}
