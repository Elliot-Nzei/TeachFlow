
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
import { TimetablePeriod } from '@/lib/types';


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
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!selectedClass || !timetable?.schedule) {
        toast({ variant: 'destructive', title: "Error", description: "No timetable data to generate PDF." });
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
        
        const tableBody: (string | null)[][] = [];
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        const allPeriods: { day: string; period: TimetablePeriod }[] = [];
        daysOfWeek.forEach(day => {
            const dayPeriods = timetable.schedule[day as keyof typeof timetable.schedule] || [];
            dayPeriods.forEach(p => allPeriods.push({ day, period: p }));
        });
        allPeriods.sort((a, b) => {
            if (a.period.startTime < b.period.startTime) return -1;
            if (a.period.startTime > b.period.startTime) return 1;
            return 0;
        });

        daysOfWeek.forEach(day => {
            const periodsForDay = (timetable.schedule[day as keyof typeof timetable.schedule] || []).sort((a,b) => a.startTime.localeCompare(b.startTime));
            if (periodsForDay.length > 0) {
                periodsForDay.forEach((period, index) => {
                    tableBody.push([
                        index === 0 ? day : '',
                        `${period.startTime} - ${period.endTime}`,
                        period.subject
                    ]);
                });
            } else {
                 tableBody.push([day, 'No periods scheduled', '']);
            }
             if (day !== 'Friday' && periodsForDay.length > 0) {
                 tableBody.push([{ content: '', colSpan: 3, styles: { fillColor: [240, 240, 240], minCellHeight: 1 } }]);
             }
        });
        
        (doc as any).autoTable({
            head: [['Day', 'Time', 'Subject']],
            body: tableBody,
            startY: 30,
            theme: 'grid',
            headStyles: {
                fillColor: [56, 142, 60],
                textColor: 255,
                fontStyle: 'bold',
            },
            didDrawCell: (data: any) => {
                if (data.cell.raw != null && daysOfWeek.includes(data.cell.raw) && data.column.index === 0) {
                   (doc as any).autoTable.drawText(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
                        halign: 'center',
                        valign: 'middle',
                        fontStyle: 'bold'
                    });
                    return false;
                }
            }
        });


        doc.save(`timetable_${selectedClass.name.replace(/\s+/g, '_')}.pdf`);
        toast({ title: 'Success!', description: 'Timetable PDF has been downloaded.' });

    } catch (error) {
        console.error("PDF Generation Error: ", error);
        toast({ variant: 'destructive', title: "PDF Error", description: "Failed to generate PDF." });
    } finally {
        setIsProcessingPdf(false);
    }
  }, [selectedClass, timetable, settings, toast]);

  return (
    <>
      <style jsx global>{`
        @media print {
            body, .print-container {
                background: white !important;
                color: black !important;
            }
            .print-hidden {
                display: none !important;
            }
            #printable-timetable {
                display: block !important;
                visibility: visible !important;
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
            #printable-timetable * {
                color: black !important;
            }
        }
      `}</style>
    
      <div id="printable-timetable" className="hidden print:block">
        {selectedClass && (
            <div className="p-4">
                 <h2 className="text-xl font-bold text-center">{settings?.schoolName || 'School Timetable'}</h2>
                 <h3 className="text-lg text-center mb-4">{selectedClass.name} - Weekly Timetable</h3>
                <TimetableGrid 
                    selectedClass={selectedClass} 
                    isSheetOpen={false}
                    setIsSheetOpen={() => {}}
                    onTimetableLoad={setTimetable}
                    viewMode="desktop"
                />
            </div>
        )}
      </div>

      <div className="flex flex-1 gap-8 print-hidden">
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
            <CardContent>
              {selectedClass ? (
                <div id="timetable-content">
                  <TimetableGrid 
                      selectedClass={selectedClass} 
                      isSheetOpen={isSheetOpen}
                      setIsSheetOpen={setIsSheetOpen}
                      onTimetableLoad={setTimetable}
                  />
                </div>
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
    </>
  );
}
