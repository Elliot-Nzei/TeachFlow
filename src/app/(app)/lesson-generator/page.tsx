
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, FileDown, Printer, Trash2, History, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateLessonNote } from '@/ai/flows/generate-lesson-note';
import ReactMarkdown from 'react-markdown';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type GenerateLessonNoteInput = {
  classLevel: string;
  subject: string;
  schemeOfWork: string;
  weeks: number;
  additionalContext: string;
};

type SavedNote = {
  id: string;
  timestamp: string;
  formState: GenerateLessonNoteInput;
  note: string;
};

const initialFormState: GenerateLessonNoteInput = {
  classLevel: '',
  subject: '',
  schemeOfWork: '',
  weeks: 4,
  additionalContext: '',
};

export default function LessonGeneratorPage() {
  const [formState, setFormState] = useState<GenerateLessonNoteInput>(initialFormState);
  const [generatedNote, setGeneratedNote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem('lessonNotesHistory');
      if (storedNotes) {
        setSavedNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error("Failed to parse lesson notes history from localStorage", error);
      localStorage.removeItem('lessonNotesHistory');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof GenerateLessonNoteInput, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleWeeksChange = (value: string) => {
    const numWeeks = parseInt(value, 10);
    if (!isNaN(numWeeks) && numWeeks >= 1 && numWeeks <= 12) {
      setFormState(prev => ({ ...prev, weeks: numWeeks }));
    }
  };

  const isFormValid = () => {
    return formState.classLevel && formState.subject && formState.schemeOfWork && formState.weeks > 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields before generating.',
      });
      return;
    }
    setIsLoading(true);
    setGeneratedNote(null);
    try {
      const result = await generateLessonNote(formState);
      setGeneratedNote(result.note);
      saveNoteToHistory(formState, result.note);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveNoteToHistory = (formInput: GenerateLessonNoteInput, note: string) => {
    const newNote: SavedNote = {
      id: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      formState: formInput,
      note: note,
    };
    const updatedHistory = [newNote, ...savedNotes].slice(0, 20); // Keep last 20 notes
    setSavedNotes(updatedHistory);
    localStorage.setItem('lessonNotesHistory', JSON.stringify(updatedHistory));
  };
  
  const loadFromHistory = (note: SavedNote) => {
    setFormState(note.formState);
    setGeneratedNote(note.note);
    setIsHistoryOpen(false);
    toast({
      title: 'History Loaded',
      description: 'The selected lesson note has been loaded into the editor.',
    });
  };

  const deleteFromHistory = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updatedHistory = savedNotes.filter(note => note.id !== id);
    setSavedNotes(updatedHistory);
    localStorage.setItem('lessonNotesHistory', JSON.stringify(updatedHistory));
     toast({
      title: 'History Item Deleted',
      description: 'The lesson note has been removed from your history.',
    });
  };

  const handleCopy = () => {
    if (generatedNote) {
      navigator.clipboard.writeText(generatedNote);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!generatedNote) {
      toast({
        variant: 'destructive',
        title: 'Nothing to Download',
        description: 'Please generate a lesson note first.',
      });
      return;
    }

    setIsDownloadingPdf(true);
    const noteElement = printRef.current;

    if (!noteElement) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not find content to print.',
        });
        setIsDownloadingPdf(false);
        return;
    }
    
    try {
        const canvas = await html2canvas(noteElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        const pdfAspectRatio = pdfWidth / pdfHeight;

        let renderWidth = pdfWidth;
        let renderHeight = pdfWidth / canvasAspectRatio;

        if (renderHeight > pdfHeight) {
            renderHeight = pdfHeight;
            renderWidth = pdfHeight * canvasAspectRatio;
        }
        
        const xOffset = (pdfWidth - renderWidth) / 2;
        
        let yOffset = 0;
        let remainingCanvasHeight = canvasHeight;
        let page = 1;

        while (remainingCanvasHeight > 0) {
            if (page > 1) {
                pdf.addPage();
            }
            
            const pageCanvas = document.createElement('canvas');
            const pageCanvasContext = pageCanvas.getContext('2d');
            
            const sourceY = (page - 1) * (canvasHeight / (renderHeight/pdfHeight));
            const sourceHeight = Math.min(canvasHeight - sourceY, canvasHeight / (renderHeight/pdfHeight) );

            pageCanvas.width = canvasWidth;
            pageCanvas.height = sourceHeight;

            pageCanvasContext?.drawImage(canvas, 0, sourceY, canvasWidth, sourceHeight, 0, 0, canvasWidth, sourceHeight);

            const pageImgData = pageCanvas.toDataURL('image/png');
            pdf.addImage(pageImgData, 'PNG', xOffset, 0, renderWidth, pdfHeight * (sourceHeight/canvasHeight) * (renderHeight/pdfHeight) );

            remainingCanvasHeight -= sourceHeight * (pdfHeight/renderHeight);
            page++;
        }

        const sanitizedSubject = formState.subject.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        pdf.save(`lesson-note-${sanitizedSubject}.pdf`);

    } catch (error) {
        console.error("PDF Download Error:", error);
        toast({
            variant: 'destructive',
            title: 'PDF Download Failed',
            description: 'There was an error generating the PDF.',
        });
    } finally {
        setIsDownloadingPdf(false);
    }
  };
  
  return (
    <>
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold font-headline">AI Lesson Note Generator</h1>
          <p className="text-muted-foreground">Create NERDC-compliant lesson notes in seconds.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
                <History className="mr-2 h-4 w-4" />
                History
            </Button>
        </div>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 print:hidden space-y-6">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Lesson Details</CardTitle>
                <CardDescription>Provide the details for your lesson note.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="classLevel">Class Level</Label>
                  <Input id="classLevel" name="classLevel" value={formState.classLevel} onChange={handleInputChange} placeholder="e.g., Primary 4, JSS 2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" value={formState.subject} onChange={handleInputChange} placeholder="e.g., Mathematics, English Language" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schemeOfWork">Scheme of Work / Topic</Label>
                  <Textarea id="schemeOfWork" name="schemeOfWork" value={formState.schemeOfWork} onChange={handleInputChange} placeholder="Enter the topic or a brief scheme of work outline. E.g., 'Introduction to Algebra: Unknowns and Variables'" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weeks">Number of Weeks/Lessons</Label>
                   <Select onValueChange={handleWeeksChange} value={String(formState.weeks)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(week => (
                        <SelectItem key={week} value={String(week)}>
                          {week} Week{week > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
                  <Textarea id="additionalContext" name="additionalContext" value={formState.additionalContext} onChange={handleInputChange} placeholder="Any specific focus? E.g., 'Focus on hands-on activities', 'Include a section on Nigerian history'" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading || !isFormValid()} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Lesson Note
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        
        <div className="lg:col-span-8">
            {isLoading && (
              <Card className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <h2 className="text-xl font-semibold mb-2">Generating Your Lesson Note</h2>
                <p className="text-muted-foreground">This may take 30-60 seconds...</p>
                 <p className="text-sm text-muted-foreground mt-2 max-w-md">The AI is creating a comprehensive lesson plan based on your requirements, ensuring it meets NERDC standards.</p>
              </Card>
            )}

            {!isLoading && !generatedNote && (
                 <Card className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 border-dashed">
                    <Notebook className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Your Lesson Note Will Appear Here</h2>
                    <p className="text-muted-foreground max-w-md">Fill out the form on the left and click "Generate Lesson Note" to let our AI assistant create a detailed, curriculum-aligned lesson plan for you.</p>
                </Card>
            )}

            {generatedNote && (
            <div id="print-section">
              <Card>
                <CardHeader className="flex flex-row justify-between items-center print:hidden">
                    <div>
                        <CardTitle>Generated Lesson Note</CardTitle>
                        <CardDescription>
                            For {formState.classLevel} - {formState.subject}
                        </CardDescription>
                    </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {hasCopied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                      {hasCopied ? 'Copied!' : 'Copy'}
                    </Button>
                     <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                    <Button size="sm" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
                       {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent ref={printRef} className="prose prose-slate dark:prose-invert max-w-none">
                   <ReactMarkdown>{generatedNote}</ReactMarkdown>
                </CardContent>
              </Card>
            </div>
            )}
        </div>
      </div>
      
        {isHistoryOpen && (
            <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setIsHistoryOpen(false)}>
                <div className="fixed top-0 right-0 h-full w-full max-w-md bg-card shadow-lg z-50 flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold">Generation History</h2>
                        <p className="text-sm text-muted-foreground">Your last 20 generated notes.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {savedNotes.length > 0 ? (
                             <Accordion type="single" collapsible className="w-full">
                                {savedNotes.map(note => (
                                <AccordionItem value={note.id} key={note.id}>
                                    <AccordionTrigger className="px-4 hover:bg-muted/50" onClick={() => loadFromHistory(note)}>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold">{note.formState.subject}</p>
                                            <p className="text-xs text-muted-foreground">{note.formState.classLevel} - {new Date(note.timestamp).toLocaleString()}</p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 bg-muted/20 text-xs">
                                        <div className="flex justify-between items-center">
                                            <p className="text-muted-foreground truncate max-w-xs">Topic: {note.formState.schemeOfWork}</p>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => deleteFromHistory(note.id, e)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="text-center p-8">
                                <p className="text-muted-foreground">No history yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        <div id="note-content-wrapper" className="hidden print:block">
            <div ref={printRef} className="prose">
                <ReactMarkdown>{generatedNote || ''}</ReactMarkdown>
            </div>
        </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .prose {
             color: black !important;
          }
          .dark .prose {
            color: black !important;
          }
        }
        @page {
            size: A4;
            margin: 20mm;
        }
    `}</style>
    </>
  );
}

    