
'use client';
import { useState, useCallback, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Edit, FileDown, Printer } from 'lucide-react';
import type { Class } from '@/lib/types';
import ClassSidebar from '@/components/class-sidebar';
import TimetableGrid from '@/components/timetable-grid';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PanelLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { SettingsContext } from '@/contexts/settings-context';

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const { toast } = useToast();
  const { settings } = useContext(SettingsContext);

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    setIsSidebarOpen(false);
  };
  
  const handlePrint = useCallback(() => {
    // We'll add a temporary class to the body to help CSS target print styles
    document.body.classList.add('printing-timetable');
    window.print();
    document.body.classList.remove('printing-timetable');
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!selectedClass) return;

    setIsProcessingPdf(true);
    toast({ title: "Generating PDF...", description: "Please wait while the timetable is being prepared." });

    const timetableElement = document.getElementById('printable-timetable');
    if (!timetableElement) {
        toast({ variant: 'destructive', title: "Error", description: "Could not find timetable element to generate PDF." });
        setIsProcessingPdf(false);
        return;
    }

    // Temporarily make the printable element visible for capturing
    const originalDisplay = timetableElement.style.display;
    timetableElement.style.display = 'block';

    try {
        const canvas = await html2canvas(timetableElement, {
            scale: 2,
            useCORS: true,
        });

        // Restore original display after capture
        timetableElement.style.display = originalDisplay;

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text(settings?.schoolName || 'School Timetable', pdfWidth / 2, margin + 5, { align: 'center' });
        pdf.setFontSize(14);
        pdf.text(`${selectedClass.name} - Weekly Timetable`, pdfWidth / 2, margin + 12, { align: 'center' });
        
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pdfWidth - margin * 2;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        let y = margin + 20;

        if (imgHeight > pdfHeight - y - margin) {
           toast({ variant: 'destructive', title: "PDF Error", description: "Timetable content is too large to fit on one page." });
           setIsProcessingPdf(false);
           return;
        }

        pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
        pdf.save(`timetable_${selectedClass.name.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
        console.error("PDF Generation Error: ", error);
        toast({ variant: 'destructive', title: "PDF Error", description: "Failed to generate PDF." });
    } finally {
        // Ensure the element is hidden again, even if an error occurs
        timetableElement.style.display = originalDisplay;
        setIsProcessingPdf(false);
    }
  }, [selectedClass, toast, settings]);

  return (
    <>
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
                width: 100vw;
                height: 100vh;
                background: white !important;
                color: black !important;
                display: block !important;
            }
            #printable-timetable .print-only-title {
                display: block !important;
                color: black !important;
            }
        }
    `}</style>

    <div className="flex flex-1 gap-8 print:hidden">
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
              <TimetableGrid 
                  selectedClass={selectedClass} 
                  isSheetOpen={isSheetOpen}
                  setIsSheetOpen={setIsSheetOpen}
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
    </>
  );
}
