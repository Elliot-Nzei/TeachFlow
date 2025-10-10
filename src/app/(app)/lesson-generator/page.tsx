
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, FileDown, Printer, Trash2, History, Copy, Check, Notebook, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateLessonNote, type GenerateLessonNoteInput } from '@/ai/flows/generate-lesson-note';
import ReactMarkdown from 'react-markdown';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Class, Subject } from '@/lib/types';

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
  const [generationProgress, setGenerationProgress] = useState('');
  const { toast } = useToast();

  const { firestore, user } = useFirebase();
  const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);
  
  const subjectsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'subjects')) : null, [firestore, user]);
  const { data: subjects, isLoading: isLoadingSubjects } = useCollection<Subject>(subjectsQuery);

  const handleDownloadPdf = useCallback(async () => {
    if (!generatedNote) {
      toast({
        variant: 'destructive',
        title: 'Nothing to Download',
        description: 'Please generate a lesson note first.',
      });
      return;
    }

    setIsDownloadingPdf(true);
    setGenerationProgress('Preparing PDF...');

    // Split by week separators
    const parts: string[] = [];
    if (generatedNote.includes('---')) {
      generatedNote.split(/\n-{3,}\n/).forEach(p => { if (p.trim()) parts.push(p.trim()); });
    } else {
      parts.push(generatedNote);
    }

    if (parts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No content found',
        description: 'Could not determine content to render into PDF.'
      });
      setIsDownloadingPdf(false);
      setGenerationProgress('');
      return;
    }

    // Create jsPDF for A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidthMm = pdf.internal.pageSize.getWidth();
    const pdfHeightMm = pdf.internal.pageSize.getHeight();
    const marginMm = 15;
    const contentWidthMm = pdfWidthMm - marginMm * 2;
    const contentHeightMm = pdfHeightMm - marginMm * 2;

    // Use a fixed scale for consistent rendering
    const scale = 2;
    const pxPerMm = 3.7795275591;
    const contentWidthPx = Math.round(contentWidthMm * pxPerMm * scale);

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = `${contentWidthPx / scale}px`;
    tempContainer.style.padding = '20px';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.background = '#ffffff';
    tempContainer.style.color = '#000000';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '12px';
    tempContainer.style.lineHeight = '1.6';
    tempContainer.style.wordBreak = 'break-word';
    tempContainer.style.overflowWrap = 'break-word';
    document.body.appendChild(tempContainer);

    try {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        setGenerationProgress(`Rendering part ${i + 1} of ${parts.length}...`);

        const html = marked.parse(part);
        let cleanHtml = html;
        if (typeof window !== 'undefined') {
            cleanHtml = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
        }

        tempContainer.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.style.fontFamily = 'Arial, sans-serif';
        wrapper.style.fontSize = '12px';
        wrapper.style.lineHeight = '1.6';
        wrapper.style.color = '#000000';

        const header = document.createElement('div');
        header.style.marginBottom = '15px';
        header.style.fontSize = '14px';
        header.style.fontWeight = 'bold';
        header.style.borderBottom = '2px solid #333';
        header.style.paddingBottom = '8px';
        header.innerHTML = `${formState.subject ? `${formState.subject}` : ''}${formState.classLevel ? ` - ${formState.classLevel}` : ''}`;
        wrapper.appendChild(header);

        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = cleanHtml;
        
        // Style all elements properly
        const allElements = contentDiv.querySelectorAll('*');
        allElements.forEach(el => {
          const element = el as HTMLElement;
          element.style.fontFamily = 'Arial, sans-serif';
          element.style.fontSize = '12px';
          element.style.lineHeight = '1.6';
          element.style.color = '#000000';
          element.style.wordBreak = 'break-word';
          element.style.overflowWrap = 'break-word';
        });

        // Style headings
        const headings = contentDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(h => {
          const heading = h as HTMLElement;
          heading.style.fontWeight = 'bold';
          heading.style.marginTop = '12px';
          heading.style.marginBottom = '8px';
          if (h.tagName === 'H1') heading.style.fontSize = '18px';
          else if (h.tagName === 'H2') heading.style.fontSize = '16px';
          else if (h.tagName === 'H3') heading.style.fontSize = '14px';
          else heading.style.fontSize = '12px';
        });

        // Style paragraphs and lists
        const paragraphs = contentDiv.querySelectorAll('p, li');
        paragraphs.forEach(p => {
          const para = p as HTMLElement;
          para.style.marginBottom = '8px';
          para.style.fontSize = '12px';
        });

        const lists = contentDiv.querySelectorAll('ul, ol');
        lists.forEach(list => {
          const l = list as HTMLElement;
          l.style.marginLeft = '20px';
          l.style.marginBottom = '8px';
        });

        const imgs = contentDiv.querySelectorAll('img');
        imgs.forEach(img => {
          (img as HTMLImageElement).style.maxWidth = '100%';
          (img as HTMLImageElement).style.height = 'auto';
        });

        wrapper.appendChild(contentDiv);
        tempContainer.appendChild(wrapper);

        await new Promise(res => setTimeout(res, 100));

        const canvas = await html2canvas(tempContainer, {
          scale: scale,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: tempContainer.scrollWidth,
          windowHeight: tempContainer.scrollHeight,
        });

        if (i > 0) {
          pdf.addPage();
        }

        const imgData = canvas.toDataURL('image/png', 1.0);
        const canvasPxWidth = canvas.width;
        const canvasPxHeight = canvas.height;

        const canvasMmWidth = canvasPxWidth / (pxPerMm * scale);
        const canvasMmHeight = canvasPxHeight / (pxPerMm * scale);

        const renderWidthMm = contentWidthMm;
        const renderHeightMm = (canvasMmHeight * renderWidthMm) / canvasMmWidth;

        if (renderHeightMm <= contentHeightMm + 0.01) {
          pdf.addImage(imgData, 'PNG', marginMm, marginMm, renderWidthMm, renderHeightMm, undefined, 'FAST');
        } else {
          const sliceHeightPx = Math.floor(contentHeightMm * pxPerMm * scale);
          let y = 0;
          let pageIndex = 0;
          while (y < canvasPxHeight) {
            const h = Math.min(sliceHeightPx, canvasPxHeight - y);
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvasPxWidth;
            sliceCanvas.height = h;
            const ctx = sliceCanvas.getContext('2d');
            if (!ctx) throw new Error('2D context unavailable');

            ctx.drawImage(canvas, 0, y, canvasPxWidth, h, 0, 0, canvasPxWidth, h);
            const sliceData = sliceCanvas.toDataURL('image/png', 1.0);
            const sliceMmHeight = h / (pxPerMm * scale);

            if (pageIndex > 0) {
              pdf.addPage();
            }
            pdf.addImage(sliceData, 'PNG', marginMm, marginMm, renderWidthMm, sliceMmHeight, undefined, 'FAST');

            y += h;
            pageIndex++;
          }
        }
      }

      const subjectSlug = (formState.subject || 'lesson-note').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
      const fileName = `lesson-note-${subjectSlug}-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`;
      pdf.save(fileName);

      toast({
        title: 'PDF ready',
        description: `Downloaded ${fileName}`,
      });

    } catch (err) {
      console.error('PDF generation error', err);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: (err instanceof Error) ? err.message : String(err),
      });
    } finally {
      try { document.body.removeChild(tempContainer); } catch (e) { /* ignore */ }
      setIsDownloadingPdf(false);
      setGenerationProgress('');
    }
  }, [generatedNote, formState.subject, formState.classLevel, toast]);

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

  const handleSelectChange = (name: keyof GenerateLessonNoteInput, value: string | number) => {
    setFormState(prev => ({ ...prev, [name]: value }));
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
    setGenerationProgress('');
    let fullNote = '';

    try {
      for (let i = 1; i <= formState.weeks; i++) {
        setGenerationProgress(`Generating Week ${i} of ${formState.weeks}...`);
        
        const result = await generateLessonNote({
          ...formState,
          weeks: 1,
          previousContent: fullNote,
          currentWeek: i,
        });

        fullNote += result.note + '\n\n---\n\n';
        setGeneratedNote(fullNote);
      }
      
      saveNoteToHistory(formState, fullNote);
      toast({
        title: 'Generation Complete!',
        description: `Successfully generated ${formState.weeks} weeks of lesson notes.`
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setGenerationProgress('');
    }
  };

  const saveNoteToHistory = (formInput: GenerateLessonNoteInput, note: string) => {
    const newNote: SavedNote = {
      id: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      formState: formInput,
      note: note,
    };
    const updatedHistory = [newNote, ...savedNotes].slice(0, 20);
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

  const handleDeleteAllHistory = () => {
    setSavedNotes([]);
    localStorage.removeItem('lessonNotesHistory');
    toast({
      title: 'History Cleared',
      description: 'All saved lesson notes have been deleted.',
    });
  };

  const handleCloseHistory = () => {
    setIsHistoryOpen(false);
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
                  <Select onValueChange={(value) => handleSelectChange('classLevel', value)} value={formState.classLevel}>
                    <SelectTrigger id="classLevel">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingClasses ? <SelectItem value="loading" disabled>Loading classes...</SelectItem> :
                        classes?.map(cls => (
                          <SelectItem key={cls.id} value={cls.name}>
                            {cls.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select onValueChange={(value) => handleSelectChange('subject', value)} value={formState.subject}>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingSubjects ? <SelectItem value="loading" disabled>Loading subjects...</SelectItem> :
                        subjects?.map(sub => (
                          <SelectItem key={sub.id} value={sub.name}>
                            {sub.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schemeOfWork">Scheme of Work / Topic</Label>
                  <Textarea id="schemeOfWork" name="schemeOfWork" value={formState.schemeOfWork} onChange={handleInputChange} placeholder="Enter the topic or a brief scheme of work outline. E.g., 'Introduction to Algebra: Unknowns and Variables'" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weeks">Number of Weeks/Lessons</Label>
                   <Select onValueChange={(value) => handleSelectChange('weeks', parseInt(value, 10))} value={String(formState.weeks)}>
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
        
        <div className="lg:col-span-8 min-w-0">
            {(isLoading || isDownloadingPdf) && (
              <Card className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <h2 className="text-xl font-semibold mb-2">{isDownloadingPdf ? 'Generating PDF' : 'Generating Your Lesson Note'}</h2>
                <p className="text-muted-foreground">{generationProgress || 'Initializing...'}</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    {isDownloadingPdf 
                        ? 'Please wait while the PDF is being prepared.'
                        : 'The AI is creating a comprehensive lesson plan based on your requirements, ensuring it meets NERDC standards.'
                    }
                </p>
              </Card>
            )}

            {!isLoading && !isDownloadingPdf && !generatedNote && (
                 <Card className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 border-dashed">
                    <Notebook className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Your Lesson Note Will Appear Here</h2>
                    <p className="text-muted-foreground max-w-md">Fill out the form on the left and click "Generate Lesson Note" to let our AI assistant create a detailed, curriculum-aligned lesson plan for you.</p>
                </Card>
            )}

            {generatedNote && !isLoading && !isDownloadingPdf && (
            <div id="print-section">
              <Card>
                <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
                    <div>
                        <CardTitle>Generated Lesson Note</CardTitle>
                        <CardDescription>
                            For {formState.classLevel} - {formState.subject}
                        </CardDescription>
                    </div>
                  <div className="flex gap-2 flex-wrap">
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
                <CardContent id="note-content" className="prose prose-slate dark:prose-invert max-w-none">
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
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-semibold">Generation History</h2>
                            <Button variant="ghost" size="icon" onClick={handleCloseHistory}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">Your last 20 generated notes.</p>
                            <Button variant="destructive" size="sm" onClick={handleDeleteAllHistory} disabled={savedNotes.length === 0}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete All
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {savedNotes.length > 0 ? (
                             <Accordion type="single" collapsible className="w-full">
                                {savedNotes.map(note => (
                                <AccordionItem value={note.id} key={note.id}>
                                    <AccordionTrigger className="px-4 hover:bg-muted/50" onClick={() => loadFromHistory(note)}>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold">{note.formState.subject}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(note.timestamp).toLocaleString()}</p>
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
      <style jsx global>{`
        body.printing .prose {
          background: white !important;
          color: black !important;
        }
        body.printing .prose * {
          color: black !important;
          background-color: transparent !important;
        }

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
            margin: 1cm;
        }
    `}</style>
    </>
  );
}
