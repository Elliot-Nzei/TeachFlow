
'use client';
import { useState, useEffect, useCallback } from 'react';
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
};

type SavedNote = {
  id: string;
  timestamp: string;
  formState: GenerateLessonNoteInput;
  note: string;
};

const STORAGE_KEY = 'lesson-generator-history';
const MAX_HISTORY_ITEMS = 20;


// --- New PDF Download Logic ---
interface PdfFormState {
  subject: string;
  classLevel: string;
}

interface ToastProps {
  variant?: 'destructive' | 'default';
  title: string;
  description: string;
}

interface UseDownloadPdfProps {
  generatedNote: string | null;
  formState: PdfFormState;
  toast: (props: ToastProps) => void;
  setLoading: (loading: boolean) => void;
}

const validateDownloadRequirements = (generatedNote: string | null): boolean => {
  return Boolean(generatedNote && generatedNote.trim().length > 0);
};

const generateFileName = (subject: string, classLevel: string): string => {
  const sanitize = (str: string): string =>
    str.toLowerCase()
       .trim()
       .replace(/[^a-z0-9]+/g, '-')
       .replace(/^-+|-+$/g, '');

  const timestamp = new Date().toISOString().split('T')[0];
  const subjectSlug = sanitize(subject);
  const classSlug = sanitize(classLevel);

  return `lesson-note-${subjectSlug}-${classSlug}-${timestamp}.pdf`;
};

const convertToCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      removeContainer: true,
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Generated canvas is invalid or empty');
    }

    return canvas;
  } catch (error) {
    throw new Error(
      `Failed to convert content to image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

const calculatePdfDimensions = (
  canvas: HTMLCanvasElement,
  pdfWidth: number,
  pdfHeight: number
): { width: number; height: number; pages: number } => {
  const aspectRatio = canvas.width / canvas.height;
  const width = pdfWidth;
  const height = width / aspectRatio;
  const pages = Math.ceil(height / pdfHeight);
  return { width, height, pages };
};

const generatePdfFromCanvas = (
  canvas: HTMLCanvasElement,
  fileName: string
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = doc.internal.pageSize.getHeight();
  
  const { width, height, pages } = calculatePdfDimensions(canvas, pdfWidth, pdfHeight);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  if (pages === 1) {
    doc.addImage(imgData, 'JPEG', 0, 0, width, height);
  } else {
    for (let page = 0; page < pages; page++) {
      if (page > 0) {
        doc.addPage();
      }
      
      const yOffset = -page * pdfHeight;
      doc.addImage(imgData, 'JPEG', 0, yOffset, width, height);
    }
  }

  return doc;
};

const useDownloadPdf = ({
  generatedNote,
  formState,
  toast,
  setLoading,
}: UseDownloadPdfProps) => {
  const handleDownloadPdf = useCallback(async () => {
    if (!validateDownloadRequirements(generatedNote)) {
      toast({
        variant: 'destructive',
        title: 'Nothing to Download',
        description: 'Please generate a lesson note first.',
      });
      return;
    }

    setLoading(true);

    try {
      const noteElement = document.getElementById('note-content');
      if (!noteElement) {
        throw new Error('Note content element not found. Please ensure the element has id="note-content".');
      }

      const canvas = await convertToCanvas(noteElement);
      const fileName = generateFileName(formState.subject, formState.classLevel);
      const doc = generatePdfFromCanvas(canvas, fileName);
      doc.save(fileName);

      toast({
        title: 'PDF Downloaded',
        description: 'Your lesson note has been saved successfully.',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while generating the PDF. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [generatedNote, formState.subject, formState.classLevel, toast, setLoading]);

  return { handleDownloadPdf };
};
// --- End New PDF Download Logic ---


export default function LessonGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [generatedNote, setGeneratedNote] = useState('');
  const [history, setHistory] = useState<SavedNote[]>([]);
  const [copied, setCopied] = useState(false);
  const [formState, setFormState] = useState<GenerateLessonNoteInput>({
    classLevel: '',
    subject: '',
    schemeOfWork: '',
    weeks: 1,
  });
  const { toast } = useToast();

  const { handleDownloadPdf } = useDownloadPdf({
    generatedNote,
    formState,
    toast,
    setLoading,
  });

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading history from localStorage:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving history to localStorage:', error);
      toast({
        variant: 'destructive',
        title: 'Storage Error',
        description: 'Unable to save history. Your browser storage might be full.',
      });
    }
  }, [history, toast]);

  const saveToHistory = useCallback((note: string, input: GenerateLessonNoteInput) => {
    const newEntry: SavedNote = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      formState: { ...input },
      note: note,
    };
    
    setHistory(prev => {
      const updated = [newEntry, ...prev];
      // Keep only the most recent MAX_HISTORY_ITEMS
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormState(prev => ({...prev, [name]: value}));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const trimmedSubject = formState.subject.trim();
    const trimmedScheme = formState.schemeOfWork.trim();
    
    if (!formState.classLevel) {
      toast({
        variant: 'destructive',
        title: 'Missing Class Level',
        description: 'Please select a class level.',
      });
      return;
    }
    
    if (!trimmedSubject) {
      toast({
        variant: 'destructive',
        title: 'Missing Subject',
        description: 'Please enter a subject.',
      });
      return;
    }
    
    if (!trimmedScheme) {
      toast({
        variant: 'destructive',
        title: 'Missing Scheme of Work',
        description: 'Please enter the scheme of work or topic outline.',
      });
      return;
    }

    if (formState.weeks < 1 || formState.weeks > 52 || isNaN(formState.weeks)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Number of Weeks',
        description: 'Please enter a valid number of weeks between 1 and 52.',
      });
      return;
    }

    setLoading(true);
    setGeneratedNote('');
    
    try {
      const result = await generateLessonNote({
        ...formState,
        subject: trimmedSubject,
        schemeOfWork: trimmedScheme,
      });
      
      if (!result || !result.note) {
        throw new Error('Invalid response from AI service');
      }
      
      setGeneratedNote(result.note);
      saveToHistory(result.note, formState);
      toast({
        title: 'Success!',
        description: 'Your lesson note has been generated successfully.',
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
  
  const handlePrint = useCallback(() => {
    if (!generatedNote) {
      toast({
        variant: 'destructive',
        title: 'Nothing to Print',
        description: 'Please generate a lesson note first.',
      });
      return;
    }
    window.print();
  }, [generatedNote, toast]);

  const handleCopy = useCallback(async () => {
    if (!generatedNote) {
      toast({
        variant: 'destructive',
        title: 'Nothing to Copy',
        description: 'Please generate a lesson note first.',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedNote);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Lesson note copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Unable to copy to clipboard.',
      });
    }
  }, [generatedNote, toast]);

  const loadFromHistory = useCallback((note: SavedNote) => {
    setFormState(note.formState);
    setGeneratedNote(note.note);
    toast({
      title: 'Loaded from History',
      description: `Loaded ${note.formState.subject} lesson for ${note.formState.classLevel}`,
    });
  }, [toast]);

  const deleteFromHistory = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    toast({
      title: 'Deleted',
      description: 'Item removed from history.',
    });
  }, [toast]);

  const clearHistory = useCallback(() => {
    if (history.length === 0) return;
    
    if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      setHistory([]);
      toast({
        title: 'History Cleared',
        description: 'All saved lesson notes have been removed.',
      });
    }
  }, [history.length, toast]);

  const classLevels = [
    { group: 'Nursery', items: Array.from({ length: 3 }, (_, i) => `Nursery ${i + 1}`) },
    { group: 'Primary', items: Array.from({ length: 6 }, (_, i) => `Primary ${i + 1}`) },
    { group: 'Junior Secondary', items: Array.from({ length: 3 }, (_, i) => `JSS ${i + 1}`) },
    { group: 'Senior Secondary', items: Array.from({ length: 3 }, (_, i) => `SSS ${i + 1}`) },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold">AI Lesson Note Generator</h1>
          <p className="text-muted-foreground mt-1">Generate comprehensive lesson notes with AI assistance</p>
        </div>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 print:hidden space-y-6">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Lesson Details</CardTitle>
                <CardDescription>Fill in the information to generate your lesson note</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="classLevel">Class Level *</Label>
                  <Select 
                    name="classLevel" 
                    onValueChange={(value) => handleSelectChange('classLevel', value)} 
                    value={formState.classLevel}
                    disabled={loading}
                  >
                    <SelectTrigger id="classLevel">
                      <SelectValue placeholder="Select a class level" />
                    </SelectTrigger>
                    <SelectContent>
                      {classLevels.map(group => (
                        <div key={group.group}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            {group.group}
                          </div>
                          {group.items.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input 
                    id="subject" 
                    name="subject" 
                    value={formState.subject} 
                    onChange={handleInputChange} 
                    placeholder="e.g., Mathematics, English, Biology"
                    disabled={loading}
                    maxLength={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="schemeOfWork">Scheme of Work / Topics *</Label>
                  <Textarea 
                    id="schemeOfWork" 
                    name="schemeOfWork" 
                    value={formState.schemeOfWork} 
                    onChange={handleInputChange} 
                    placeholder="Week 1: Introduction to Algebra&#10;Week 2: Linear Equations&#10;Week 3: Solving Word Problems&#10;Week 4: Review and Assessment" 
                    className="h-32 resize-none"
                    disabled={loading}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formState.schemeOfWork.length}/2000 characters
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weeks">Number of Weeks *</Label>
                  <Input 
                    id="weeks" 
                    name="weeks" 
                    type="number" 
                    min="1" 
                    max="52"
                    value={formState.weeks} 
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value >= 0 && value <= 52) {
                        setFormState(prev => ({...prev, weeks: value}));
                      }
                    }}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the number of weeks/lessons (1-52)
                  </p>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Lesson Note...
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
                  <CardTitle className="text-base">Generation History</CardTitle>
                  <CardDescription>
                    {history.length} saved note{history.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={clearHistory}
                  disabled={loading}
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
                        <div className="flex flex-col text-left flex-1">
                          <span className="font-medium text-sm">
                            {item.formState.subject} - {item.formState.classLevel}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.timestamp} • {item.formState.weeks} week{item.formState.weeks !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground line-clamp-4">
                            {item.note.substring(0, 300)}...
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => loadFromHistory(item)}
                              className="flex-1"
                              disabled={loading}
                            >
                              Load Note
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => deleteFromHistory(item.id, e)}
                              disabled={loading}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {history.length >= MAX_HISTORY_ITEMS && (
            <Alert>
              <AlertDescription>
                You've reached the maximum of {MAX_HISTORY_ITEMS} saved notes. 
                Older items will be removed automatically when you generate new ones.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex flex-row justify-between items-start print:hidden">
              <div className="flex-1">
                <CardTitle>Generated Lesson Note</CardTitle>
                <CardDescription>
                  {generatedNote 
                    ? `${formState.subject} • ${formState.classLevel} • ${formState.weeks} week${formState.weeks !== 1 ? 's' : ''}` 
                    : 'Your AI-generated lesson note will appear here'}
                </CardDescription>
              </div>
              {generatedNote && (
                <div className="flex gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    onClick={handleCopy} 
                    size="sm"
                    disabled={loading}
                  >
                    {copied ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadPdf} 
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" />
                    )}
                    PDF
                  </Button>
                  <Button 
                    onClick={handlePrint} 
                    size="sm"
                    disabled={loading}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="min-h-[600px]" id="print-section">
                <div id="note-content" className="bg-background p-4">
                  {loading && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                      <p className="font-semibold text-lg">Generating Your Lesson Note</p>
                      <p className="text-sm mt-2">This may take 30-60 seconds...</p>
                      <p className="text-xs mt-4 text-center max-w-sm">
                        The AI is creating a comprehensive lesson plan based on your requirements
                      </p>
                    </div>
                  )}
                  
                  {!loading && !generatedNote && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-20">
                      <History className="h-12 w-12 mb-4 text-muted-foreground/50" />
                      <p className="font-semibold text-lg">Ready to Generate</p>
                      <p className="text-sm mt-2 max-w-md">
                        Fill in the lesson details and click "Generate Lesson Note" to create 
                        a comprehensive lesson plan with AI assistance.
                      </p>
                    </div>
                  )}
                  
                  {generatedNote && !loading && (
                    <div className="prose prose-sm dark:prose-invert max-w-none print:max-w-full">
                      <div className="print:hidden mb-4 pb-4 border-b">
                        <div className="text-sm text-muted-foreground">
                          Generated on {new Date().toLocaleString()}
                        </div>
                      </div>
                      <ReactMarkdown
                        components={{
                          h1: ({children}) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
                          h2: ({children}) => <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>,
                          h3: ({children}) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                          p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="mb-1">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                          blockquote: ({children}) => (
                            <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {generatedNote}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        /* Base styles for the note content - ALWAYS applied */
        #note-content {
          background: white !important;
          color: #000000 !important;
          padding: 40px !important;
          max-width: 210mm !important; /* A4 width */
          margin: 0 auto !important;
          box-shadow: none !important;
          border: none !important;
        }

        /* Force all text to be black */
        #note-content,
        #note-content *,
        #note-content h1,
        #note-content h2,
        #note-content h3,
        #note-content h4,
        #note-content h5,
        #note-content h6,
        #note-content p,
        #note-content span,
        #note-content div,
        #note-content li,
        #note-content a,
        #note-content strong,
        #note-content em,
        #note-content blockquote {
          background: transparent !important;
          background-color: transparent !important;
          color: #000000 !important;
          border-color: #000000 !important;
        }

        /* Fix prose styles */
        #note-content.prose,
        #note-content .prose {
          color: #000000 !important;
          max-width: none !important;
        }

        /* Headings - proper weights and sizes */
        #note-content h1 {
          font-size: 28px !important;
          font-weight: 700 !important;
          color: #000000 !important;
          margin-top: 24px !important;
          margin-bottom: 16px !important;
        }

        #note-content h2 {
          font-size: 24px !important;
          font-weight: 600 !important;
          color: #000000 !important;
          margin-top: 20px !important;
          margin-bottom: 12px !important;
        }

        #note-content h3 {
          font-size: 20px !important;
          font-weight: 600 !important;
          color: #000000 !important;
          margin-top: 16px !important;
          margin-bottom: 10px !important;
        }

        #note-content h4 {
          font-size: 18px !important;
          font-weight: 500 !important;
          color: #000000 !important;
        }

        /* Paragraph spacing */
        #note-content p {
          font-size: 14px !important;
          font-weight: 400 !important;
          line-height: 1.6 !important;
          margin-bottom: 12px !important;
          color: #000000 !important;
        }

        /* Lists */
        #note-content ul,
        #note-content ol {
          margin-left: 24px !important;
          margin-bottom: 12px !important;
          color: #000000 !important;
        }

        #note-content li {
          font-size: 14px !important;
          line-height: 1.6 !important;
          margin-bottom: 8px !important;
          color: #000000 !important;
        }

        /* Strong/Bold text */
        #note-content strong,
        #note-content b {
          font-weight: 700 !important;
          color: #000000 !important;
        }

        /* Emphasis/Italic */
        #note-content em,
        #note-content i {
          font-style: italic !important;
          color: #000000 !important;
        }

        /* Tables */
        #note-content table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 16px 0 !important;
          background: white !important;
        }

        #note-content th,
        #note-content td {
          border: 1px solid #000000 !important;
          padding: 8px !important;
          color: #000000 !important;
          background: white !important;
        }

        #note-content th {
          font-weight: 600 !important;
          background: #f5f5f5 !important;
        }

        /* Blockquotes */
        #note-content blockquote {
          border-left: 4px solid #000000 !important;
          padding-left: 16px !important;
          margin: 16px 0 !important;
          font-style: italic !important;
          color: #000000 !important;
        }

        /* Code blocks */
        #note-content code {
          background: #f5f5f5 !important;
          padding: 2px 6px !important;
          border-radius: 3px !important;
          font-family: monospace !important;
          color: #000000 !important;
          font-size: 13px !important;
        }

        #note-content pre {
          background: #f5f5f5 !important;
          padding: 12px !important;
          border-radius: 4px !important;
          overflow-x: auto !important;
          margin: 16px 0 !important;
        }

        #note-content pre code {
          background: transparent !important;
          padding: 0 !important;
        }

        /* Links */
        #note-content a {
          color: #0066cc !important;
          text-decoration: underline !important;
        }

        /* Dark mode override - force light mode for PDF content */
        .dark #note-content,
        .dark #note-content *,
        .dark #note-content h1,
        .dark #note-content h2,
        .dark #note-content h3,
        .dark #note-content h4,
        .dark #note-content h5,
        .dark #note-content h6,
        .dark #note-content p,
        .dark #note-content span,
        .dark #note-content div,
        .dark #note-content li,
        .dark #note-content a,
        .dark #note-content strong,
        .dark #note-content em {
          background: white !important;
          background-color: white !important;
          color: #000000 !important;
        }

        /* Remove any gradients or complex backgrounds */
        #note-content *::before,
        #note-content *::after {
          background: transparent !important;
          background-image: none !important;
        }

        /* Print-specific styles */
        @media print {
          body * {
            visibility: hidden;
          }
          
          #print-section,
          #print-section * {
            visibility: visible;
          }
          
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          #note-content {
            box-shadow: none !important;
          }
        }

        @page {
          size: A4;
          margin: 15mm;
        }
      `}</style>
    </>
    );
}
