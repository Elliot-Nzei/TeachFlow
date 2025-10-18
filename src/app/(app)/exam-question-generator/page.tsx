
'use client';
import { useState, useContext, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, FileDown, Printer, AlertCircle, Lock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import jsPDF from 'jspdf';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Class, Subject } from '@/lib/types';
import { SettingsContext } from '@/contexts/settings-context';
import { generateExamQuestions, type GenerateExamInput, type GenerateExamOutput } from '@/ai/flows/generate-exam-questions';
import { usePlan } from '@/contexts/plan-context';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type LoadingState = 'idle' | 'generating' | 'downloading';

const initialFormState: Omit<GenerateExamInput, 'questionCount'> = {
  classGrade: '',
  subject: '',
  topics: '',
  questionType: 'Both',
  additionalRequest: '',
};

export default function ExamQuestionGeneratorPage() {
  const [formState, setFormState] = useState(initialFormState);
  const [questionCount, setQuestionCount] = useState<string>('10');
  const [generatedExam, setGeneratedExam] = useState<GenerateExamOutput | null>(null);
  const [answerKey, setAnswerKey] = useState<string[] | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);

  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const { settings } = useContext(SettingsContext);
  const { features, aiUsage, incrementUsage } = usePlan();

  // Fetch classes & subjects
  const classesQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'classes')) : null,
    [firestore, user]
  );
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);

  const subjectsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'subjects')) : null,
    [firestore, user]
  );
  const { data: allSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>(subjectsQuery);

  const subjectsForClass = useMemo(() => {
    if (!formState.classGrade || !classes || !allSubjects) return allSubjects || [];
    const selectedClass = classes.find(c => c.name === formState.classGrade);
    if (!selectedClass?.subjects) return allSubjects || [];
    return allSubjects.filter(s => selectedClass.subjects.includes(s.name));
  }, [formState.classGrade, classes, allSubjects]);

  // Handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    setGenerationError(null);
  }, []);

  const handleSelectChange = useCallback((name: keyof typeof initialFormState, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
    if (name === 'classGrade') setFormState(prev => ({ ...prev, subject: '' }));
    setGenerationError(null);
  }, []);

  const handleRadioChange = useCallback((value: 'Objective' | 'Essay' | 'Both') => {
    setFormState(prev => ({ ...prev, questionType: value }));
  }, []);

  const handleQuestionCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
        const num = parseInt(val, 10);
        if (val === '' || (num >= 1 && num <= 50)) {
            setQuestionCount(val);
        }
    }
  }, []);


  // Validation
  const formValidation = useMemo(() => {
    const errors: string[] = [];
    const count = parseInt(questionCount || '0', 10);

    if (!formState.classGrade) errors.push('Class grade is required');
    if (!formState.subject) errors.push('Subject is required');
    if (!formState.topics.trim()) errors.push('Topics are required');
    if (isNaN(count) || count < 1 || count > 50) errors.push('Question count must be between 1 and 50');

    const topicCount = formState.topics.split(',').filter(t => t.trim()).length;
    if (topicCount > 10) errors.push('Please limit to 10 topics for better quality');

    return {
      isValid: errors.length === 0,
      errors,
      finalInput: {
        ...formState,
        questionCount: count,
      } as GenerateExamInput
    };
  }, [formState, questionCount]);

  const isGenerating = loadingState === 'generating';
  const isDownloading = loadingState === 'downloading';
  const isProcessing = isGenerating || isDownloading;

  const totalQuestions = (generatedExam?.objectiveQuestions?.length || 0) + (generatedExam?.essayQuestions?.length || 0);

  const canGenerate = useMemo(() => {
    if (!features.canUseAdvancedAI) return false;
    if (features.aiGenerations === 'Unlimited') return true;
    return aiUsage.examGenerations < features.aiGenerations;
  }, [features, aiUsage]);

  // Submit: call AI
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canGenerate) {
        toast({ variant: 'destructive', title: 'Limit Reached', description: 'You have used all your AI exam generations for this month.' });
        return;
    }
    const { isValid, errors, finalInput } = formValidation;
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Invalid Form',
        description: errors[0],
      });
      return;
    }

    setLoadingState('generating');
    setGeneratedExam(null);
    setAnswerKey(null);
    setGenerationError(null);

    try {
      const result = await generateExamQuestions(finalInput);
      incrementUsage('exam');
      setGeneratedExam(result);
      if (result.objectiveQuestions?.length) {
        setAnswerKey(result.objectiveQuestions.map(q => {
             // Find the option that matches the answer text
            const matchingOption = q.options.find(opt => opt === q.answer);
            if(matchingOption) {
                const optionIndex = q.options.indexOf(matchingOption);
                const optionLetter = String.fromCharCode(65 + optionIndex);
                return `${optionLetter}. ${q.answer}`;
            }
            return q.answer; // fallback
        }));
      }
      toast({ title: 'Success!', description: `Generated ${(result.objectiveQuestions?.length || 0) + (result.essayQuestions?.length || 0)} questions.` });
      // scroll to preview
      setTimeout(() => {
        document.getElementById('pdf-preview-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate questions. Please try again.';
      setGenerationError(message);
      toast({ variant: 'destructive', title: 'Generation Failed', description: message });
    } finally {
      setLoadingState('idle');
    }
  };

  const handleDownloadPdf = async (includeAnswers: boolean) => {
    if (!generatedExam) {
      toast({ variant: 'destructive', title: 'No Exam', description: 'Generate questions first.' });
      return;
    }

    setLoadingState('downloading');

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const usableWidth = pageWidth - margin * 2;
      let currentY = margin;
      let pageNum = 1;

      const ptToMm = 0.3527777778;
      const lineHeightMultiplier = 1.15;
      
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerHeight = 15;

      const renderHeader = () => {
        currentY = margin;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        const schoolName = settings?.schoolName || 'School Name';
        doc.text(schoolName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
        currentY += 16 * ptToMm * lineHeightMultiplier * 0.8;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        const examLine = `${formState.subject} — ${formState.classGrade}`;
        doc.text(examLine, pageWidth / 2, currentY, { align: 'center' });
        currentY += 14 * ptToMm * lineHeightMultiplier * 0.8;
        
        const termSession = `${settings?.currentTerm || ''} ${settings?.currentSession || ''}`.trim();
        doc.setFontSize(12);
        doc.text(termSession, pageWidth / 2, currentY, { align: 'center' });
        currentY += 12 * ptToMm * lineHeightMultiplier * 0.8;

        doc.setLineWidth(0.3);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 4;
      };

      const renderFooter = (pageNumber: number) => {
        const footerY = pageHeight - margin + 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${pageNumber}`, pageWidth - margin, footerY, { align: 'right' });
      };

      const addNewPage = () => {
        renderFooter(pageNum);
        doc.addPage();
        pageNum++;
        currentY = margin;
      };

      renderHeader();

      doc.setFont('helvetica', 'normal');

      const writeText = (text: string | string[], y: number, options = {}) => {
        if (currentY + 10 > pageHeight - margin - footerHeight) {
          addNewPage();
          y = currentY;
        }
        doc.text(text, margin, y, options);
        return y;
      };

      if (generatedExam.objectiveQuestions && generatedExam.objectiveQuestions.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const sectionTitle = 'Section A: Objective Questions';
        const sectionTitleLines = doc.splitTextToSize(sectionTitle, usableWidth);
        const sectionTitleHeight = sectionTitleLines.length * (14 * ptToMm * lineHeightMultiplier) + 2;
        if (currentY + sectionTitleHeight > pageHeight - margin - footerHeight) addNewPage();
        doc.text(sectionTitle, margin, currentY);
        currentY += sectionTitleHeight;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const bodyLineHeight = 12 * ptToMm * lineHeightMultiplier;
        
        generatedExam.objectiveQuestions.forEach((q, qIndex) => {
          const qNumber = qIndex + 1;
          const questionText = `${qNumber}. ${q.question}`;
          const lines = doc.splitTextToSize(questionText, usableWidth);
          const questionHeight = lines.length * bodyLineHeight;

          const optionLines: string[] = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`);
          const optWrapped = optionLines.flatMap(optLine => doc.splitTextToSize(optLine, usableWidth - 8).map((l: string) => '  ' + l));
          const optionsHeight = optWrapped.length * bodyLineHeight;

          if (currentY + questionHeight + optionsHeight + (bodyLineHeight * 0.5) > pageHeight - margin - footerHeight) {
            addNewPage();
          }

          doc.text(lines, margin, currentY);
          currentY += questionHeight;

          optWrapped.forEach((optLine) => {
            if (currentY + bodyLineHeight > pageHeight - margin - footerHeight) addNewPage();
            doc.text(optLine, margin + 4, currentY);
            currentY += bodyLineHeight;
          });
          currentY += bodyLineHeight * 0.5;
        });
      }

      if (generatedExam.essayQuestions && generatedExam.essayQuestions.length > 0) {
        if (currentY + 14 * ptToMm * lineHeightMultiplier * 2.5 > pageHeight - margin - footerHeight) {
          addNewPage();
        } else {
          currentY += 12 * ptToMm * lineHeightMultiplier;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const sectionTitle = generatedExam.objectiveQuestions?.length ? 'Section B: Essay Questions' : 'Essay Questions';
        const sectionTitleLines = doc.splitTextToSize(sectionTitle, usableWidth);
        const sectionTitleHeight = sectionTitleLines.length * (14 * ptToMm * lineHeightMultiplier) + 2;
        if (currentY + sectionTitleHeight > pageHeight - margin - footerHeight) addNewPage();
        doc.text(sectionTitle, margin, currentY);
        currentY += sectionTitleHeight;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const bodyLineHeight = 12 * ptToMm * lineHeightMultiplier;

        generatedExam.essayQuestions.forEach((q, idx) => {
          const qNumber = idx + 1;
          const questionText = `${qNumber}. ${q.question}`;
          const lines = doc.splitTextToSize(questionText, usableWidth);
          const questionHeight = lines.length * bodyLineHeight;
          const answerSpaceHeight = bodyLineHeight * 5;

          if (currentY + questionHeight + answerSpaceHeight > pageHeight - margin - footerHeight) {
            addNewPage();
          }

          doc.text(lines, margin, currentY);
          currentY += questionHeight + answerSpaceHeight;
        });
      }

      if (currentY + 12 > pageHeight - margin - footerHeight) addNewPage();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('End of Examination', pageWidth / 2, currentY + 6, { align: 'center' });

      renderFooter(pageNum);

      if (includeAnswers && answerKey && answerKey.length > 0) {
        addNewPage();
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Answer Key - Objective Questions', margin, currentY);
        currentY += 14 * ptToMm * lineHeightMultiplier * 1.8;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const bodyLineHeight = 12 * ptToMm * lineHeightMultiplier;

        answerKey.forEach((ans, i) => {
          const text = `${i + 1}. ${ans}`;
          const lines = doc.splitTextToSize(text, usableWidth);
          const h = lines.length * bodyLineHeight;
          if (currentY + h > pageHeight - margin - footerHeight) {
            addNewPage();
          }
          doc.text(lines, margin, currentY);
          currentY += h + bodyLineHeight * 0.5;
        });
        renderFooter(pageNum);
      }
      
      const safeSubject = formState.subject ? formState.subject.replace(/\s+/g, '_') : 'Exam';
      const safeClass = formState.classGrade ? formState.classGrade.replace(/\s+/g, '_') : 'Class';
      const filename = `${safeSubject}_${safeClass}_Exam${includeAnswers ? '_with_Answers' : ''}.pdf`;
      doc.save(filename);

      toast({ title: 'Download Complete', description: `${filename} downloaded.` });
    } catch (err) {
      console.error('PDF generation failed', err);
      toast({ variant: 'destructive', title: 'PDF Failed', description: 'Could not create PDF. See console.' });
    } finally {
      setLoadingState('idle');
    }
  };

  const handlePrint = useCallback(() => {
    // Keep simple: print the preview container (browser print)
    window.print();
  }, []);

  const generationsLeft = features.aiGenerations === 'Unlimited' ? 'Unlimited' : features.aiGenerations - aiUsage.examGenerations;

  // Render UI (form + preview)
  return (
    <>
      <div className="mb-6 print:hidden">
        <h1 className="text-3xl font-bold font-headline">Exam Question Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate exam questions and export them as clean A4 PDFs with proper page breaks.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 print:hidden">
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
                <CardDescription>Provide the details for your exam generation.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                 <Alert variant={canGenerate ? 'default' : 'destructive'}>
                  {canGenerate ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  <AlertTitle>{features.canUseAdvancedAI ? 'Feature Enabled' : 'Upgrade Required'}</AlertTitle>
                  <AlertDescription>
                    {features.aiGenerations === 'Unlimited' ? 'You have unlimited generations.' :
                     features.canUseAdvancedAI ? `You have ${generationsLeft} exam generations left this month.` :
                     'Upgrade to a Basic or Prime plan to use this feature.'
                    }
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classGrade">Class *</Label>
                    <Select
                      value={formState.classGrade}
                      onValueChange={(value) => handleSelectChange('classGrade', value)}
                      disabled={isLoadingClasses || isProcessing}
                    >
                      <SelectTrigger id="classGrade">
                        <SelectValue placeholder="Select class..." />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Select
                      value={formState.subject}
                      onValueChange={(value) => handleSelectChange('subject', value)}
                      disabled={!formState.classGrade || isLoadingSubjects || isProcessing}
                    >
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Select subject..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectsForClass.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topics">Topics *</Label>
                  <Textarea id="topics" name="topics" value={formState.topics} onChange={handleInputChange}
                    placeholder="e.g., Algebra, Photosynthesis" rows={3} disabled={isProcessing} />
                  <p className="text-xs text-muted-foreground">Separate multiple topics with commas (max 10)</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Question Type *</Label>
                    <RadioGroup value={formState.questionType} onValueChange={handleRadioChange} className="flex flex-col gap-2 pt-2" disabled={isProcessing}>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="Objective" id="type-objective" /><Label htmlFor="type-objective" className="font-normal cursor-pointer">Objective</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="Essay" id="type-essay" /><Label htmlFor="type-essay" className="font-normal cursor-pointer">Essay</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="Both" id="type-both" /><Label htmlFor="type-both" className="font-normal cursor-pointer">Both</Label></div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="questionCount">Question Count *</Label>
                    <Input id="questionCount" name="questionCount" type="number" value={questionCount} onChange={handleQuestionCountChange} min={1} max={50} disabled={isProcessing} />
                    <p className="text-xs text-muted-foreground">1-50 questions</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalRequest">Additional Instructions</Label>
                  <Textarea id="additionalRequest" name="additionalRequest" value={formState.additionalRequest} onChange={handleInputChange}
                    placeholder="e.g., 'Include 2 diagrams', 'Mix comprehension with grammar' " rows={3} disabled={isProcessing} />
                </div>

                {!formValidation.isValid && (formState.topics.trim() || parseInt(questionCount) > 0) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formValidation.errors[0]}</AlertDescription>
                  </Alert>
                )}

                {generationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{generationError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="w-full">
                             <Button type="submit" disabled={!formValidation.isValid || isProcessing || !canGenerate} className="w-full">
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : !canGenerate ? <Lock className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                {isGenerating ? 'Generating...' : 'Generate Questions'}
                            </Button>
                        </div>
                    </TooltipTrigger>
                    {!canGenerate && (
                        <TooltipContent>
                           <p>{features.canUseAdvancedAI ? 'You have reached your monthly generation limit.' : 'Upgrade to a paid plan to use this feature.'}</p>
                        </TooltipContent>
                    )}
                </Tooltip>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-8 min-w-0">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>{generatedExam ? `${totalQuestions} question${totalQuestions !== 1 ? 's' : ''} generated` : 'Your exam will appear here'}</CardDescription>
                </div>

                {generatedExam && (
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button variant="outline" size="sm" onClick={handlePrint} disabled={isProcessing}><Printer className="mr-2 h-4 w-4" />Print</Button>
                    <Button size="sm" onClick={() => handleDownloadPdf(false)} disabled={isProcessing}>{isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}PDF</Button>
                    {answerKey && answerKey.length > 0 && (<Button size="sm" variant="secondary" onClick={() => handleDownloadPdf(true)} disabled={isProcessing}>{isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}PDF + Answers</Button>)}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div id="pdf-container" className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-[70vh]">
                <div id="pdf-preview-content" className="a4-page-preview">
                  {!generatedExam && !isGenerating && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-muted-foreground">
                      <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg">Ready to generate exam questions</p>
                      <p className="text-sm mt-2">Fill in the form and click "Generate Questions" to begin</p>
                    </div>
                  )}

                  {isGenerating && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                      <p className="text-lg font-semibold">Generating questions...</p>
                      <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                    </div>
                  )}

                  {generatedExam && !isGenerating && (
                    <div className="exam-paper space-y-4">
                      <div className="text-center border-b-2 border-black pb-2 mb-4">
                        <h1 className="text-base font-bold uppercase">{settings?.schoolName || 'School Name'}</h1>
                        <h2 className="text-sm font-semibold">{formState.subject} - {formState.classGrade}</h2>
                        <p className="text-xs">{settings?.currentTerm}, {settings?.currentSession}</p>
                      </div>

                      {generatedExam.objectiveQuestions && generatedExam.objectiveQuestions.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-bold text-sm mb-2 pb-1 border-b border-gray-300">Section A: Objective Questions</h3>
                          <div className="space-y-3">
                            {generatedExam.objectiveQuestions.map((q, idx) => (
                              <div key={idx} className="question">
                                <p className="font-medium mb-1 text-sm">{idx + 1}. {q.question}</p>
                                <div className="ml-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                  {q.options.map((opt, optIdx) => <div key={optIdx} className="option">{String.fromCharCode(65 + optIdx)}. {opt}</div>)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {generatedExam.essayQuestions && generatedExam.essayQuestions.length > 0 && (
                        <div>
                          <h3 className="font-bold text-sm mb-2 pb-1 border-b border-gray-300">{generatedExam.objectiveQuestions ? 'Section B: Essay Questions' : 'Essay Questions'}</h3>
                          <div className="space-y-4">
                            {generatedExam.essayQuestions.map((q, idx) => (
                              <div key={idx} className="question">
                                <p className="font-medium mb-2 text-sm">{idx + 1}. {q.question}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-center text-xs text-gray-500 mt-6 pt-2 border-t border-gray-300">
                        <p>End of Examination</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .a4-page-preview {
            background: white;
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: auto;
            color: black;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .exam-paper {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.15;
            text-align: justify;
        }
        .exam-paper h1, .exam-paper h2, .exam-paper h3, .exam-paper p, .exam-paper div { font-size: 12pt !important; }
        @media print {
            body, html { background: white; }
            .print\\:hidden { display: none; }
            #pdf-preview-content {
                box-shadow: none; 
                margin: 0; 
                padding: 0;
                width: 100%;
                height: auto;
            }
            @page { size: A4; margin: 20mm; }
        }
      `}</style>
    </>
  );
}
