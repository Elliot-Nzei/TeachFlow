
'use client';
import { useState, useCallback, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Edit, FileDown, Printer, PanelLeft } from 'lucide-react';
import type { Class, Timetable } from '@/lib/types';
import ClassSidebar from '@/components/class-sidebar';
import TimetableGrid from '@/components/timetable-grid';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { SettingsContext } from '@/contexts/settings-context';
import type { TimetablePeriod } from '@/lib/types';


export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const { toast } = useToast();
  const { settings } = useContext(SettingsContext);
  const [timetable, setTimetable] = useState<Timetable | null>(null);

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    setIsSidebarOpen(false);
  };
  
  const handlePrint = useCallback(() => {
    const printContent = document.getElementById('timetable-content');
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent?.innerHTML || '';
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!selectedClass || !timetable?.schedule) {
        toast({ variant: "destructive", title: "Error", description: "No timetable data to generate PDF." });
        return;
    }

    setIsProcessingPdf(true);
    toast({ title: "Generating PDF...", description: "Please wait while the timetable is being prepared." });

    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(settings?.schoolName || 'School Timetable', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(`${selectedClass.name} - Weekly Timetable`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
        
        const tableBody: (string | {content: string, colSpan?: number, rowSpan?: number, styles?: any})[][] = [];
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        const timeSlots = Array.from(new Set(
            Object.values(timetable.schedule).flat().map(p => `${p.startTime} - ${p.endTime}`)
        )).sort();

        const tableHead = ['Time', ...daysOfWeek];
        
        timeSlots.forEach(slot => {
            const row: string[] = [slot];
            daysOfWeek.forEach(day => {
                const period = timetable.schedule[day as keyof typeof timetable.schedule]?.find(p => `${p.startTime} - ${p.endTime}` === slot);
                row.push(period ? period.subject : '');
            });
            tableBody.push(row);
        });

        if (tableBody.length === 0) {
            toast({ variant: 'destructive', title: "No Data", description: "There are no scheduled periods to include in the PDF." });
            setIsProcessingPdf(false);
            return;
        }
        
        (doc as any).autoTable({
            head: [tableHead],
            body: tableBody,
            startY: 30,
            theme: 'grid',
            headStyles: {
                fillColor: [35, 122, 87], // A green shade from your theme
                textColor: 255,
                fontStyle: 'bold',
            },
            didParseCell: function (data: any) {
                if (data.cell.section === 'body' && data.cell.text[0] && data.cell.text[0].length > 15) {
                    data.cell.styles.fontSize = 8;
                }
            }
        });


        doc.save(`timetable_${selectedClass.name.replace(/\s+/g, '_')}.pdf`);
        toast({ title: 'Success!', description: 'Timetable PDF has been downloaded.' });

    } catch (error) {
        console.error("PDF Generation Error: ", error);
        toast({ variant: "destructive", title: "PDF Error", description: "Failed to generate PDF." });
    } finally {
        setIsProcessingPdf(false);
    }
  }, [selectedClass, timetable, settings, toast]);

  return (
    <div className="flex flex-1 gap-8">
        {/* Sidebar for Desktop */}
        <div className="hidden md:block md:w-1/4 lg:w-1/5 sticky top-20 self-start">
          <ClassSidebar selectedClass={selectedClass} onSelectClass={handleSelectClass} />
        </div>
      
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-4 md:hidden">
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                  <SheetTrigger asChild>
                      <Button variant="outline">
                      <PanelLeft className="mr-2 h-4 w-4" /> Select Class
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[80vw] max-w-xs p-0">
                    <SheetHeader>
                      <SheetTitle className="sr-only">Select Class</SheetTitle>
                      <SheetDescription className="sr-only">Choose a class to manage its timetable.</SheetDescription>
                    </SheetHeader>
                      <ClassSidebar selectedClass={selectedClass} onSelectClass={handleSelectClass} />
                  </SheetContent>
              </Sheet>
              {selectedClass && <h2 className="font-bold text-lg truncate">{selectedClass.name}</h2>}
          </div>

          <Card className="h-full">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-y-2 gap-x-4">
              <div>
                <CardTitle className="font-headline">
                  {selectedClass ? `${selectedClass.name} - Timetable` : 'Timetable'}
                </CardTitle>
                <CardDescription>
                  {selectedClass ? 'Weekly schedule of subjects and periods.' : 'Select a class to view its timetable.'}
                </CardDescription>
              </div>
              {selectedClass && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button onClick={handlePrint} size="sm" variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                  <Button onClick={handleDownloadPdf} size="sm" variant="outline" disabled={isProcessingPdf}><FileDown className="mr-2 h-4 w-4" /> PDF</Button>
                  <Button onClick={() => setIsSheetOpen(true)} size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Schedule
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent id="timetable-content">
              {selectedClass ? (
                  <TimetableGrid 
                      selectedClass={selectedClass} 
                      isSheetOpen={isSheetOpen}
                      setIsSheetOpen={setIsSheetOpen}
                      onTimetableLoad={setTimetable}
                  />
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-muted-foreground rounded-lg border border-dashed">
                  <CalendarDays className="h-16 w-16 mb-4 opacity-20" />
                  <p>Please select a class from the sidebar to view or edit its timetable.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}

// Add a hidden div for printing that can be styled independently
const PrintableTimetable = ({ timetable, settings, selectedClass }: { timetable: Timetable | null, settings: any, selectedClass: Class | null }) => {
  if (!timetable || !selectedClass) return null;
  return (
    <div id="printable-timetable" className="hidden print:block p-4">
      <h2 className="text-xl font-bold text-center">{settings?.schoolName || 'School Timetable'}</h2>
      <h3 className="text-lg text-center mb-4">{selectedClass.name} - Weekly Timetable</h3>
      <TimetableGrid
        selectedClass={selectedClass}
        isSheetOpen={false}
        setIsSheetOpen={() => { }}
        onTimetableLoad={() => { }}
        viewMode="print"
      />
    </div>
  );
};
