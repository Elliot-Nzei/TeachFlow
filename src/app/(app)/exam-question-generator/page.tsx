
'use client';
import { useState, useContext, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, FileDown, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Class, Subject } from '@/lib/types';
import { SettingsContext } from '@/contexts/settings-context';
import { generateExamQuestions, type GenerateExamInput, type GenerateExamOutput } from '@/ai/flows/generate-exam-questions';

const initialFormState: GenerateExamInput = {
  classLevel: '',
  subject: '',
  topics: '',
  questionType: 'Both',
  questionCount: 10,
  additionalRequest: '',
};

export default function ExamQuestionGeneratorPage() {
  const [formState, setFormState] = useState<GenerateExamInput | any>(initialFormState);
  const [generatedExam, setGeneratedExam] = useState<GenerateExamOutput | null>(null);
  const [answerKey, setAnswerKey] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const { firestore, user } = useFirebase();
  const { settings, isLoading: isLoadingSettings } = useContext(SettingsContext);
  
  const classesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);
  
  const subjectsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'subjects')) : null, [firestore, user]);
  const { data: allSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>(subjectsQuery);

  const subjectsForClass = useMemo(() => {
    if (!formState.classLevel || !classes || !allSubjects) return allSubjects || [];
    const selectedClass = classes.find(c => c.name === formState.classLevel);
    if (!selectedClass || !selectedClass.subjects) return allSubjects || [];
    return allSubjects.filter(s => selectedClass.subjects.includes(s.name));
  }, [formState.classLevel, classes, allSubjects]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof GenerateExamInput, value: string | number) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: 'Objective' | 'Essay' | 'Both') => {
    setFormState(prev => ({...prev, questionType: value}));
  };

  const isFormValid = () => {
    return formState.classLevel && formState.subject && formState.topics && formState.questionCount > 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
      });
      return;
    }
    
    setIsLoading(true);
    setGeneratedExam(null);
    setAnswerKey(null);

    try {
      const result = await generateExamQuestions(formState);
      setGeneratedExam(result);
      if (result.objectiveQuestions) {
        setAnswerKey(result.objectiveQuestions.map(q => q.answer));
      }
      toast({
        title: 'Generation Complete!',
        description: 'Your exam questions are ready for preview.',
      });
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
  
  const handleDownloadPdf = async (includeAnswers: boolean) => {
    const contentElement = document.getElementById('pdf-preview-content');
    if (!contentElement) {
        toast({ title: 'Error', description: 'Preview content not found.', variant: 'destructive' });
        return;
    }
    
    setIsDownloading(true);

    const canvas = await html2canvas(contentElement, { scale: 2, windowWidth: contentElement.scrollWidth, windowHeight: contentElement.scrollHeight });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const canvasWidthInPdf = pdfWidth - 20; // with 10mm margins
    const canvasHeightInPdf = canvasWidthInPdf / ratio;
    
    let heightLeft = canvasHeightInPdf;
    let position = 15; // top margin
    
    pdf.addImage(imgData, 'PNG', 10, position, canvasWidthInPdf, canvasHeightInPdf);
    heightLeft -= (pdfHeight - 2 * position);

    while (heightLeft >= 0) {
      position = heightLeft - canvasHeightInPdf;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, canvasWidthInPdf, canvasHeightInPdf);
      heightLeft -= pdfHeight;
    }

    if (includeAnswers && answerKey) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text("Answer Key - Objectives", 10, 20);
        pdf.setFontSize(12);
        answerKey.forEach((answer, index) => {
            pdf.text(`${index + 1}. ${answer}`, 10, 30 + (index * 8));
        });
    }
    
    pdf.save(`${formState.subject}_${formState.classLevel}_Exam.pdf`);
    setIsDownloading(false);
  };
  
  const handlePrint = () => {
    const printContent = document.getElementById('pdf-preview-content');
    if (printContent) {
        const WinPrint = window.open('', '', 'width=900,height=650');
        WinPrint?.document.write('<html><head><title>Print Exam</title>');
        WinPrint?.document.write('<style>body { font-family: Arial, sans-serif; } .question-paper { padding: 20px; } .options-list { list-style-type: upper-alpha; padding-left: 20px; } </style>');
        WinPrint?.document.write('</head><body>');
        WinPrint?.document.write(printContent.innerHTML);
        WinPrint?.document.write('</body></html>');
        WinPrint?.document.close();
        WinPrint?.focus();
        WinPrint?.print();
        WinPrint?.close();
    }
  };

  return (
    <>
      <div className="mb-4">
          <h1 className="text-3xl font-bold font-headline">Exam Question Generator</h1>
          <p className="text-muted-foreground">Automatically generate exam questions for any subject and class.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
                <CardDescription>Provide the details for the exam.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select onValueChange={(value) => handleSelectChange('classLevel', value)} value={formState.classLevel} disabled={isLoadingClasses}>
                      <SelectTrigger><SelectValue placeholder="Select class..." /></SelectTrigger>
                      <SelectContent>{classes?.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select onValueChange={(value) => handleSelectChange('subject', value)} value={formState.subject} disabled={!formState.classLevel || isLoadingSubjects}>
                      <SelectTrigger><SelectValue placeholder="Select subject..." /></SelectTrigger>
                      <SelectContent>{subjectsForClass.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="topics">Topics</Label>
                    <Textarea id="topics" name="topics" value={formState.topics} onChange={handleInputChange} placeholder="e.g., Algebra, Photosynthesis, Nigerian Civil War" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Question Type</Label>
                        <RadioGroup defaultValue="Both" onValueChange={handleRadioChange} className="flex gap-4 pt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Objective" id="r1" /><Label htmlFor="r1">Objective</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Essay" id="r2" /><Label htmlFor="r2">Essay</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Both" id="r3" /><Label htmlFor="r3">Both</Label></div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="questionCount">Question Count</Label>
                        <Input 
                            id="questionCount" 
                            name="questionCount" 
                            type="number" 
                            value={formState.questionCount} 
                            onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                handleSelectChange('questionCount', isNaN(val) ? '' : val)
                            }} 
                            min="1" 
                            max="50" 
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="additionalRequest">Additional Request (Optional)</Label>
                    <Textarea id="additionalRequest" name="additionalRequest" value={formState.additionalRequest} onChange={handleInputChange} placeholder="e.g., 'Include 2 questions about historical figures', 'Focus on practical examples'" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading || !isFormValid()} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate Questions
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        <div className="lg:col-span-8 min-w-0">
          <Card className="h-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Preview</CardTitle>
                        <CardDescription>This is how your exam paper will look.</CardDescription>
                    </div>
                    {generatedExam && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrint} disabled={isDownloading}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                            <Button size="sm" onClick={() => handleDownloadPdf(false)} disabled={isDownloading}>
                                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                                PDF
                            </Button>
                             {answerKey && <Button size="sm" onClick={() => handleDownloadPdf(true)} disabled={isDownloading}>
                                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                                PDF with Answers
                            </Button>}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
              <div id="pdf-preview-content" className="p-4 border rounded-md bg-white text-black question-paper">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="text-lg font-semibold">Generating questions...</p>
                  </div>
                )}

                {!isLoading && !generatedExam && (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-muted-foreground">
                    <p>Your generated exam questions will appear here.</p>
                  </div>
                )}
                
                {generatedExam && (
                  <div className="a4-page-content">
                    {/* A4 PDF Header */}
                    <div className="text-center mb-4 pb-2 border-b-2 border-black">
                        {settings?.schoolName && <h1 className="text-xl font-bold uppercase">{settings.schoolName}</h1>}
                        {settings?.schoolAddress && <p className="text-xs">{settings.schoolAddress}</p>}
                        <h2 className="text-lg font-bold mt-2">{settings?.currentTerm || 'First Term'} Examination - {settings?.currentSession || new Date().getFullYear()}</h2>
                        <p className="text-sm">Class: {formState.classLevel} &nbsp;&nbsp;&nbsp; Subject: {formState.subject}</p>
                    </div>

                    {/* Body */}
                    {generatedExam.objectiveQuestions && generatedExam.objectiveQuestions.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-md font-bold mb-2">Section A: Objective Questions</h3>
                        <ol className="list-decimal list-outside pl-5 space-y-3">
                          {generatedExam.objectiveQuestions.map((q, i) => (
                            <li key={`obj-${i}`}>
                              <p>{q.question}</p>
                              <ol className="list-[upper-alpha] list-inside flex flex-wrap gap-x-4 mt-1">
                                {q.options.map((opt, j) => <li key={`opt-${j}`} className="ml-2">{opt}</li>)}
                              </ol>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {generatedExam.essayQuestions && generatedExam.essayQuestions.length > 0 && (
                      <div>
                        <h3 className="text-md font-bold mb-2">{formState.questionType === 'Both' ? 'Section B: ' : ''}Essay Questions</h3>
                        <ol className="list-decimal list-outside pl-5 space-y-6">
                          {generatedExam.essayQuestions.map((q, i) => (
                            <li key={`essay-${i}`}>{q.question}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
