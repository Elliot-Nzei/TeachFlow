
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, FileDown, Printer, Trash2, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateLessonNote, type GenerateLessonNoteInput, type GenerateLessonNoteOutput } from '@/ai/flows/generate-lesson-note';
import ReactMarkdown from 'react-markdown';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import jsPDF from 'jspdf';

type SavedNote = {
  id: string;
  timestamp: string;
  formState: GenerateLessonNoteInput;
  note: string;
};

export default function LessonGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [generatedNote, setGeneratedNote] = useState('');
  const [history, setHistory] = useState<SavedNote[]>([]);
  const [formState, setFormState] = useState<GenerateLessonNoteInput>({
    classLevel: '',
    subject: '',
    schemeOfWork: '',
    weeks: 1,
  });
  const { toast } = useToast();

  useEffect(() => {
    const savedHistory = localStorage.getItem('lessonNoteHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (note: string, input: GenerateLessonNoteInput) => {
    const newEntry: SavedNote = {
      id: new Date().toISOString(),
      timestamp: new Date().toLocaleString(),
      formState: input,
      note: note,
    };
    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('lessonNoteHistory', JSON.stringify(updatedHistory));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
      setFormState(prev => ({...prev, [name]: value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.classLevel || !formState.subject || !formState.schemeOfWork) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please fill out the class, subject, and scheme of work.',
        });
        return;
    }
    setLoading(true);
    setGeneratedNote('');
    try {
      const result = await generateLessonNote(formState);
      setGeneratedNote(result.note);
      saveToHistory(result.note, formState);
    } catch (error) {
      console.error('Error generating lesson note:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'An error occurred while generating the lesson note. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  }
  
  const handleDownloadPdf = () => {
    if (!generatedNote) return;

    const doc = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4'
    });
    
    // It's better to target a specific element for conversion
    const noteContentElement = document.getElementById('note-content-for-pdf');
    if (noteContentElement) {
        doc.html(noteContentElement, {
            callback: function (doc) {
                doc.save(`Lesson-Note-${formState.subject}-${formState.classLevel}.pdf`);
            },
            x: 40,
            y: 40,
            width: 375,
            windowWidth: 750
        });
    } else {
        // Fallback for just the text if the element isn't found
        doc.text(generatedNote, 10, 10);
        doc.save(`Lesson-Note-${formState.subject}-${formState.classLevel}.pdf`);
    }
  };


  const loadFromHistory = (note: SavedNote) => {
    setFormState(note.formState);
    setGeneratedNote(note.note);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('lessonNoteHistory');
    toast({
        title: 'History Cleared',
        description: 'Your lesson note generation history has been cleared.',
    });
  };

  const classLevels = [
    ...Array.from({ length: 3 }, (_, i) => `Nursery ${i + 1}`),
    ...Array.from({ length: 6 }, (_, i) => `Primary ${i + 1}`),
    ...Array.from({ length: 3 }, (_, i) => `JSS ${i + 1}`),
    ...Array.from({ length: 3 }, (_, i) => `SSS ${i + 1}`),
  ];

  return (
    <>
        <div className="flex items-center justify-between mb-4 @media print:hidden">
            <h1 className="text-3xl font-bold font-headline">AI Lesson Note Generator</h1>
        </div>
        <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4 @media print:hidden space-y-8">
                <Card>
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Lesson Note Details</CardTitle>
                            <CardDescription>Provide the details for the lesson note you want to generate.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="classLevel">Class Level</Label>
                                 <Select name="classLevel" onValueChange={(value) => handleSelectChange('classLevel', value)} value={formState.classLevel}>
                                    <SelectTrigger id="classLevel">
                                        <SelectValue placeholder="Select a class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classLevels.map(level => (
                                            <SelectItem key={level} value={level}>{level}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" name="subject" value={formState.subject} onChange={handleInputChange} placeholder="e.g., Mathematics" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="schemeOfWork">Scheme of Work / Topic Outline</Label>
                                <Textarea id="schemeOfWork" name="schemeOfWork" value={formState.schemeOfWork} onChange={handleInputChange} placeholder="Week 1: ..., Week 2: ..." className="h-32" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weeks">Number of Weeks / Lessons</Label>
                                <Input id="weeks" name="weeks" type="number" min="1" value={formState.weeks} onChange={(e) => setFormState(prev => ({...prev, weeks: parseInt(e.target.value, 10)}))} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate Lesson Note
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {history.length > 0 && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                             <div>
                                <CardTitle>Generation History</CardTitle>
                                <CardDescription>Previously generated notes.</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={clearHistory} aria-label="Clear history">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {history.map((item) => (
                                    <AccordionItem value={item.id} key={item.id}>
                                        <AccordionTrigger onClick={() => loadFromHistory(item)}>
                                            <div className="flex flex-col text-left">
                                                <span className="font-semibold">{item.formState.classLevel} - {item.formState.subject}</span>
                                                <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="prose prose-sm dark:prose-invert max-w-none text-xs">
                                             <ReactMarkdown>{item.note.substring(0, 150)}...</ReactMarkdown>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="md:col-span-8">
                 <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle>Generated Lesson Note</CardTitle>
                            <CardDescription>The AI-generated lesson note will appear here.</CardDescription>
                        </div>
                        {generatedNote && (
                            <div className="flex gap-2 @media print:hidden">
                                <Button variant="outline" onClick={handleDownloadPdf}>
                                    <FileDown className="mr-2 h-4 w-4" /> Download as PDF
                                </Button>
                                <Button onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" /> Print
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="min-h-[600px]" id="print-section">
                        {loading && (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                                <p className="font-semibold">Generating Lesson Note...</p>
                                <p className="text-sm">This may take some time depending on the length.</p>
                            </div>
                        )}
                        {!loading && !generatedNote && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                <History className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="font-semibold">Your generated lesson note will be displayed here.</p>
                                <p className="text-sm">You can also view past notes in the history section.</p>
                            </div>
                        )}
                        <div id="note-content-for-pdf" className="prose prose-sm dark:prose-invert max-w-none">
                          {generatedNote && <ReactMarkdown>{generatedNote}</ReactMarkdown>}
                        </div>
                    </CardContent>
                </Card>
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
                padding: 1rem;
            }
            }
            @page {
                size: A4;
                margin: 0.5in;
            }
        `}</style>
    </>
  );
}
