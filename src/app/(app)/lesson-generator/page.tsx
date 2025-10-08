
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, FileDown, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  generateLessonNote,
  type GenerateLessonNoteInput,
} from '@/ai/flows/generate-lesson-note';
import ReactMarkdown from 'react-markdown';

export default function LessonGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [generatedNote, setGeneratedNote] = useState('');
  const [formState, setFormState] = useState<GenerateLessonNoteInput>({
    classLevel: '',
    subject: '',
    schemeOfWork: '',
    weeks: 1,
  });
  const { toast } = useToast();

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
            <Card className="md:col-span-4 @media print:hidden">
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

            <div className="md:col-span-8">
                 <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle>Generated Lesson Note</CardTitle>
                            <CardDescription>The AI-generated lesson note will appear here.</CardDescription>
                        </div>
                        {generatedNote && (
                            <div className="flex gap-2 @media print:hidden">
                                <Button variant="outline" onClick={handlePrint}>
                                    <FileDown className="mr-2 h-4 w-4" /> Download as PDF
                                </Button>
                                <Button onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" /> Print
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="min-h-[600px] prose prose-sm dark:prose-invert max-w-none" id="print-section">
                        {loading && (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                                <p className="font-semibold">Generating Lesson Note...</p>
                                <p className="text-sm">This may take some time depending on the length.</p>
                            </div>
                        )}
                        {!loading && !generatedNote && (
                            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                                <p>Your generated lesson note will be displayed here.</p>
                            </div>
                        )}
                        {generatedNote && <ReactMarkdown>{generatedNote}</ReactMarkdown>}
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
