
'use client';
import { useState, useCallback, useContext, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Edit, FileDown, Printer, PanelLeft, Clock } from 'lucide-react';
import type { Class, Timetable, TimetablePeriod } from '@/lib/types';
import ClassSidebar from '@/components/class-sidebar';
import TimetableGrid from '@/components/timetable-grid';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { SettingsContext } from '@/contexts/settings-context';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { format } from 'date-fns';

type TodaySchedulePeriod = TimetablePeriod & {
  className: string;
  classId: string;
};

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const { toast } = useToast();
  const { settings } = useContext(SettingsContext);
  const { firestore, user } = useFirebase();

  const timetablesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'timetables')) : null, [firestore, user]);
  const { data: allTimetables, isLoading: isLoadingTimetables } = useCollection<Timetable>(timetablesQuery);

  const [activeTimetable, setActiveTimetable] = useState<Timetable | null>(null);

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    setIsSidebarOpen(false);
    const associatedTimetable = allTimetables?.find(t => t.classId === cls.id) || null;
    setActiveTimetable(associatedTimetable);
  };
  
  const handlePrint = useCallback(() => {
    const printContainer = document.getElementById('printable-timetable');
    if (printContainer) {
      const timetableContent = document.getElementById('timetable-grid-content');
      if (timetableContent) {
        printContainer.innerHTML = timetableContent.innerHTML;
        window.print();
        printContainer.innerHTML = '';
      }
    }
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!selectedClass || !activeTimetable?.schedule) {
        toast({ variant: "destructive", title: "Error", description: "No timetable data to generate PDF." });
        return;
    }

    setIsProcessingPdf(true);
    toast({ title: "Generating PDF...", description: "Please wait while the timetable is being prepared." });

    try {
        const doc = new (jsPDF as any)({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(settings?.schoolName || 'School Timetable', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`${selectedClass.name} - Weekly Timetable`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
        
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const timeSlots = Array.from(new Set(
            Object.values(activeTimetable.schedule).flat().map(p => `${p.startTime} - ${p.endTime}`)
        )).sort();
        
        if (timeSlots.length === 0) {
           toast({ variant: 'destructive', title: "No Data", description: "There are no scheduled periods to include in the PDF." });
           setIsProcessingPdf(false);
           return;
        }

        const tableHead: any = [['Time', ...daysOfWeek]];
        const tableBody: any = timeSlots.map(slot => {
            const row = [slot];
            daysOfWeek.forEach(day => {
                const period = (activeTimetable.schedule as any)[day]?.find((p: TimetablePeriod) => `${p.startTime} - ${p.endTime}` === slot);
                row.push(period ? period.subject : '');
            });
            return row;
        });
        
        doc.autoTable({
            head: tableHead,
            body: tableBody,
            startY: 30,
            theme: 'grid',
            headStyles: {
                fillColor: [35, 122, 87], 
                textColor: 255,
                fontStyle: 'bold',
            },
            styles: {
                cellPadding: 2,
                fontSize: 8,
                overflow: 'linebreak'
            },
        });

        doc.save(`timetable_${selectedClass.name.replace(/\s+/g, '_')}.pdf`);
        toast({ title: 'Success!', description: 'Timetable PDF has been downloaded.' });

    } catch (error) {
        console.error("PDF Generation Error: ", error);
        toast({ variant: "destructive", title: "PDF Error", description: "Failed to generate PDF." });
    } finally {
        setIsProcessingPdf(false);
    }
  }, [selectedClass, activeTimetable, settings, toast]);

  const todaySchedule = useMemo((): TodaySchedulePeriod[] => {
    if (!allTimetables) return [];
    
    const today = format(new Date(), 'eeee'); // e.g., 'Monday'
    if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(today)) {
      return [];
    }

    const periods: TodaySchedulePeriod[] = [];
    allTimetables.forEach(timetable => {
      const todayPeriods = (timetable.schedule as any)[today];
      if (todayPeriods) {
        todayPeriods.forEach((period: TimetablePeriod) => {
          periods.push({
            ...period,
            className: timetable.className,
            classId: timetable.classId,
          });
        });
      }
    });

    return periods.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allTimetables]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Schedule & Timetables</h1>
        <p className="text-muted-foreground">View your schedule for today or manage weekly timetables for your classes.</p>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>Today's Schedule ({format(new Date(), 'eeee, MMMM do')})</CardTitle>
              <CardDescription>A summary of all your scheduled classes for today.</CardDescription>
          </CardHeader>
          <CardContent>
              {todaySchedule.length > 0 ? (
                  <div className="space-y-4">
                      {todaySchedule.map((period, index) => (
                          <div key={index} className="flex items-center gap-4 rounded-lg border p-4">
                              <div className="flex items-center gap-3 text-muted-foreground">
                                  <Clock className="h-5 w-5" />
                                  <span className="font-mono text-sm">{period.startTime} - {period.endTime}</span>
                              </div>
                              <div className="h-full border-l mx-2"></div>
                              <div className="flex-1">
                                  <p className="font-bold">{period.subject}</p>
                                  <p className="text-sm text-muted-foreground">{period.className}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center text-muted-foreground py-8">
                      <p>You have no classes scheduled for today.</p>
                  </div>
              )}
          </CardContent>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar for Desktop */}
          <div className="hidden lg:block lg:col-span-3 sticky top-20 self-start">
            <ClassSidebar selectedClass={selectedClass} onSelectClass={handleSelectClass} />
          </div>
        
          {/* Main Content */}
          <div className="lg:col-span-9 min-w-0">
            <div className="flex items-center gap-4 mb-4 lg:hidden">
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
            </div>

            <Card className="h-full">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-y-2 gap-x-4">
                <div>
                  <CardTitle className="font-headline">
                    Class Timetable Manager
                  </CardTitle>
                  <CardDescription>
                    {selectedClass ? `Viewing timetable for ${selectedClass.name}` : 'Select a class to view or edit its schedule.'}
                  </CardDescription>
                </div>
                {selectedClass && (
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
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
                <div id="timetable-grid-content">
                  {selectedClass ? (
                      <TimetableGrid 
                          key={selectedClass.id} // Add key to force re-render on class change
                          selectedClass={selectedClass} 
                          isSheetOpen={isSheetOpen}
                          setIsSheetOpen={setIsSheetOpen}
                          onTimetableLoad={setActiveTimetable}
                      />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-muted-foreground rounded-lg border border-dashed">
                      <CalendarDays className="h-16 w-16 mb-4 opacity-20" />
                      <p>Please select a class from the sidebar to view or edit its timetable.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
       <div id="printable-timetable" className="hidden print:block"></div>
        <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-timetable, #printable-timetable * {
                visibility: visible;
              }
              #printable-timetable {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
        `}</style>
    </div>
  );
}
