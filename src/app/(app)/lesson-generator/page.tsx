'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, FileDown, Printer, Trash2, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateLessonNote } from '@/ai/flows/generate-lesson-note';
import ReactMarkdown from 'react-markdown';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import jsPDF from 'jspdf';

type GenerateLessonNoteInput = {
  classLevel: string;
  subject: string;
  schemeOfWork: string;
  weeks: number;
};

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

  const saveToHistory = (note: string, input: GenerateLessonNoteInput) => {
    const newEntry: SavedNote = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      formState: input,
      note: note,
    };
    setHistory(prev => [newEntry, ...prev]);
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

    if (formState.weeks < 1 || formState.weeks > 52) {
      toast({
        variant: 'destructive',
        title: 'Invalid Weeks',
        description: 'Please enter a valid number of weeks (1-52).',
      });
      return;
    }

    setLoading(true);
    setGeneratedNote('');
    
    try {
      const result = await generateLessonNote(formState);
      setGeneratedNote(result.note);
      saveToHistory(result.note, formState);
      toast({
        title: 'Success!',
        description: 'Your lesson note has been generated.',
      });
    } catch (error) {
      console.error('Error generating lesson note:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'An error occurred while generating the lesson note. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrint = () => {
    if (!generatedNote) {
      toast({
        variant: 'destructive',
        title: 'Nothing to Print',
        description: 'Please generate a lesson note first.',
      });
      return;
    }
    window.print();
  };
  
  const handleDownloadPdf = () => {
    if (!generatedNote) {
      toast({
        variant: 'destructive',
        title: 'Nothing to Download',
        description: 'Please generate a lesson note first.',
      });
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxLineWidth = pageWidth - (margin * 2);
      
      // Add title
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(`${formState.subject} - ${formState.classLevel}`, margin, margin);
      
      // Add content
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Split text to handle markdown and line breaks
      const lines = doc.splitTextToSize(generatedNote.replace(/[#*_]/g, ''), maxLineWidth);
      let yPosition = margin + 10;
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      const fileName = `Lesson-Note-${formState.subject.replace(/\s+/g, '-')}-${formState.classLevel.replace(/\s+/g, '-')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: 'PDF Downloaded',
        description: 'Your lesson note has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Failed to generate PDF. Please try printing instead.',
      });
    }
  };

  const loadFromHistory = (note: SavedNote) => {
    setFormState(note.formState);
    setGeneratedNote(note.note);
    toast({
      title: 'Loaded from History',
      description: `Loaded note for ${note.formState.classLevel} - ${note.formState.subject}`,
    });
  };

  const clearHistory = () => {
    if (history.length === 0) return;
    
    if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      setHistory([]);
      toast({
        title: 'History Cleared',
        description: 'Your lesson note generation history has been cleared.',
      });
    }
  };

  const classLevels = [
    ...Array.from({ length: 3 }, (_, i) => `Nursery ${i + 1}`),
    ...Array.from({ length: 6 }, (_, i) => `Primary ${i + 1}`),
    ...Array.from({ length: 3 }, (_, i) => `JSS ${i + 1}`),
    ...Array.from({ length: 3 }, (_, i) => `SSS ${i + 1}`),
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4 print:hidden">
        <h1 className="text-3xl font-bold">AI Lesson Note Generator</h1>
      </div>
      
      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-4 print:hidden space-y-8">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Lesson Note Details</CardTitle>
                <CardDescription>Provide the details for the lesson note you want to generate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="classLevel">Class Level</Label>
                  <Select 
                    name="classLevel" 
                    onValueChange={(value) => handleSelectChange('classLevel', value)} 
                    value={formState.classLevel}
                  >
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
                  <Input 
                    id="subject" 
                    name="subject" 
                    value={formState.subject} 
                    onChange={handleInputChange} 
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="schemeOfWork">Scheme of Work / Topic Outline</Label>
                  <Textarea 
                    id="schemeOfWork" 
                    name="schemeOfWork" 
                    value={formState.schemeOfWork} 
                    onChange={handleInputChange} 
                    placeholder="Week 1: Introduction to Algebra&#10;Week 2: Linear Equations&#10;Week 3: Quadratic Equations" 
                    className="h-32"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weeks">Number of Weeks / Lessons</Label>
                  <Input 
                    id="weeks" 
                    name="weeks" 
                    type="number" 
                    min="1" 
                    max="52"
                    value={formState.weeks} 
                    onChange={(e) => setFormState(prev => ({...prev, weeks: parseInt(e.target.value, 10) || 1}))}
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Lesson Note
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {history.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Generation History</CardTitle>
                  <CardDescription>Previously generated notes ({history.length})</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={clearHistory} 
                  aria-label="Clear history"
                  title="Clear all history"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {history.map((item) => (
                    <AccordionItem value={item.id} key={item.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col text-left">
                          <span className="font-semibold">{item.formState.classLevel} - {item.formState.subject}</span>
                          <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="text-xs space-y-2">
                          <p className="text-muted-foreground line-clamp-3">
                            {item.note.substring(0, 200)}...
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => loadFromHistory(item)}
                            className="w-full"
                          >
                            Load This Note
                          </Button>
                        </div>
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
            <CardHeader className="flex flex-row justify-between items-start print:hidden">
              <div>
                <CardTitle>Generated Lesson Note</CardTitle>
                <CardDescription>
                  {generatedNote 
                    ? `${formState.classLevel} - ${formState.subject}` 
                    : 'The AI-generated lesson note will appear here.'}
                </CardDescription>
              </div>
              {generatedNote && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownloadPdf} size="sm">
                    <FileDown className="mr-2 h-4 w-4" /> PDF
                  </Button>
                  <Button onClick={handlePrint} size="sm">
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
                  <History className="h-12 w-12 mb-4" />
                  <p className="font-semibold">Your generated lesson note will be displayed here.</p>
                  <p className="text-sm">Fill in the details and click "Generate Lesson Note" to begin.</p>
                </div>
              )}
              
              {generatedNote && (
                <div className="prose prose-sm dark:prose-invert max-w-none print:prose-base">
                  <ReactMarkdown>{generatedNote}</ReactMarkdown>
                </div>
              )}
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
          .prose {
            color: black !important;
          }
          .prose * {
            color: black !important;
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