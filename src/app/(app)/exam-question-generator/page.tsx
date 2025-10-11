'use client';
import { useState, useContext, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, FileDown, Printer, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Class, Subject } from '@/lib/types';
import { SettingsContext } from '@/contexts/settings-context';
import { generateExamQuestions, type GenerateExamInput, type GenerateExamOutput } from '@/ai/flows/generate-exam-questions';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const initialFormState: Omit<GenerateExamInput, 'questionCount'> = {
  classLevel: '',
  subject: '',
  topics: '',
  questionType: 'Both',
  additionalRequest: '',
};

type LoadingState = 'idle' | 'generating' | 'downloading';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ExamQuestionGeneratorPage() {
  // State
  const [formState, setFormState] = useState(initialFormState);
  const [questionCount, setQuestionCount] = useState<string>('10');
  const [generatedExam, setGeneratedExam] = useState<GenerateExamOutput | null>(null);
  const [answerKey, setAnswerKey] = useState<string[] | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const { settings, isLoading: isLoadingSettings } = useContext(SettingsContext);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  
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
    if (!formState.classLevel || !classes || !allSubjects) return allSubjects || [];
    const selectedClass = classes.find(c => c.name === formState.classLevel);
    if (!selectedClass?.subjects) return allSubjects || [];
    return allSubjects.filter(s => selectedClass.subjects.includes(s.name));
  }, [formState.classLevel, classes, allSubjects]);

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    setGenerationError(null);
  }, []);

  const handleSelectChange = useCallback((name: keyof typeof initialFormState, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
    if (name === 'classLevel') {
      setFormState(prev => ({ ...prev, subject: '' }));
    }
    setGenerationError(null);
  }, []);

  const handleRadioChange = useCallback((value: 'Objective' | 'Essay' | 'Both') => {
    setFormState(prev => ({ ...prev, questionType: value }));
  }, []);

  const handleQuestionCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty string to clear input, but validate number range
    if (val === '' || (/^\d+$/.test(val) && parseInt(val) >= 1 && parseInt(val) <= 50)) {
        setQuestionCount(val);
    }
  }, []);

  // ============================================================================
  // FORM VALIDATION
  // ============================================================================

  const formValidation = useMemo(() => {
    const errors: string[] = [];
    const count = parseInt(questionCount, 10);
    
    if (!formState.classLevel) errors.push('Class level is required');
    if (!formState.subject) errors.push('Subject is required');
    if (!formState.topics.trim()) errors.push('Topics are required');
    if (isNaN(count) || count < 1 || count > 50) {
      errors.push('Question count must be between 1 and 50');
    }

    const topicCount = formState.topics.split(',').filter(t => t.trim()).length;
    if (topicCount > 10) {
      errors.push('Please limit to 10 topics for better quality');
    }

    return {
      isValid: errors.length === 0,
      errors,
      finalInput: {
        ...formState,
        questionCount: count,
      } as GenerateExamInput
    };
  }, [formState, questionCount]);

  // ============================================================================
  // EXAM GENERATION
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      
      setGeneratedExam(result);
      
      if (result.objectiveQuestions?.length) {
        setAnswerKey(result.objectiveQuestions.map(q => q.answer));
      }

      toast({
        title: 'Success!',
        description: `Generated ${(result.objectiveQuestions?.length || 0) + (result.essayQuestions?.length || 0)} questions.`,
      });

      setTimeout(() => {
        document.getElementById('pdf-preview-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate questions. The AI may have returned an invalid response. Please try again.';
      setGenerationError(errorMessage);
      
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorMessage,
      });
    } finally {
      setLoadingState('idle');
    }
  };

  // ============================================================================
  // PDF & PRINT HANDLERS
  // ============================================================================

  const handleDownloadPdf = async (includeAnswers: boolean) => {
    const contentElement = document.getElementById('pdf-preview-content');
    if (!contentElement) {
      toast({ 
        title: 'Error', 
        description: 'Preview content not found.', 
        variant: 'destructive' 
      });
      return;
    }

    setLoadingState('downloading');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 20; // 20mm margin
    const contentWidth = pdfWidth - margin * 2;
    
    // Create a hidden div to render the HTML with specific styles
    const renderContainer = document.createElement('div');
    renderContainer.style.position = 'absolute';
    renderContainer.style.left = '-9999px';
    renderContainer.style.width = `${contentWidth}mm`;
    renderContainer.style.fontFamily = 'Arial, sans-serif';
    renderContainer.style.fontSize = '12pt';
    renderContainer.style.lineHeight = '1.15';
    renderContainer.style.textAlign = 'justify';
    renderContainer.style.color = 'black';
    renderContainer.innerHTML = contentElement.innerHTML;
    document.body.appendChild(renderContainer);

    try {
      const canvas = await html2canvas(renderContainer, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        width: renderContainer.scrollWidth,
        height: renderContainer.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * contentWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }
      
      if (includeAnswers && answerKey && answerKey.length > 0) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text("Answer Key - Objective Questions", margin, margin);
        pdf.setFontSize(12);
        
        let yPos = margin + 15;
        answerKey.forEach((answer, index) => {
          if (yPos > pdfHeight - margin) {
            pdf.addPage();
            yPos = margin + 15;
          }
          pdf.text(`${index + 1}. ${answer}`, margin + 5, yPos);
          yPos += 7; // Adjust line spacing for answer key
        });
      }

      const filename = `${formState.subject.replace(/\s+/g, '_')}_${formState.classLevel.replace(/\s+/g, '_')}_Exam${includeAnswers ? '_with_Answers' : ''}.pdf`;
      pdf.save(filename);

      toast({
        title: 'Download Complete',
        description: `${filename} has been downloaded.`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Could not generate PDF. Please try again.',
      });
    } finally {
      document.body.removeChild(renderContainer);
      setLoadingState('idle');
    }
  };
  
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isGenerating = loadingState === 'generating';
  const isDownloading = loadingState === 'downloading';
  const isProcessing = isGenerating || isDownloading;

  const totalQuestions = (generatedExam?.objectiveQuestions?.length || 0) + (generatedExam?.essayQuestions?.length || 0);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <div className="mb-6 print:hidden">
        <h1 className="text-3xl font-bold font-headline">Exam Question Generator</h1>
        <p className="text-muted-foreground mt-1">
          Automatically generate exam questions aligned with the Nigerian NERDC curriculum.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 print:hidden">
        {/* FORM SECTION */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
                <CardDescription>
                  Provide the details for your exam generation.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classLevel">Class *</Label>
                    <Select 
                      value={formState.classLevel}
                      onValueChange={(value) => handleSelectChange('classLevel', value)}
                      disabled={isLoadingClasses || isProcessing}
                    >
                      <SelectTrigger id="classLevel">
                        <SelectValue placeholder="Select class..." />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.map(c => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Select 
                      value={formState.subject}
                      onValueChange={(value) => handleSelectChange('subject', value)}
                      disabled={!formState.classLevel || isLoadingSubjects || isProcessing}
                    >
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Select subject..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectsForClass.map(s => (
                          <SelectItem key={s.id} value={s.name}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topics">Topics *</Label>
                  <Textarea
                    id="topics"
                    name="topics"
                    value={formState.topics}
                    onChange={handleInputChange}
                    placeholder="e.g., Algebra, Photosynthesis, Nigerian Civil War"
                    rows={3}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple topics with commas (max 10)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Question Type *</Label>
                    <RadioGroup 
                      value={formState.questionType}
                      onValueChange={handleRadioChange}
                      disabled={isProcessing}
                      className="flex flex-col gap-2 pt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Objective" id="type-objective" />
                        <Label htmlFor="type-objective" className="font-normal cursor-pointer">
                          Objective
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Essay" id="type-essay" />
                        <Label htmlFor="type-essay" className="font-normal cursor-pointer">
                          Essay
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Both" id="type-both" />
                        <Label htmlFor="type-both" className="font-normal cursor-pointer">
                          Both
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="questionCount">Question Count *</Label>
                    <Input
                      id="questionCount"
                      name="questionCount"
                      type="number"
                      value={questionCount}
                      onChange={handleQuestionCountChange}
                      min="1"
                      max="50"
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-muted-foreground">
                      1-50 questions
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalRequest">Additional Instructions</Label>
                  <Textarea
                    id="additionalRequest"
                    name="additionalRequest"
                    value={formState.additionalRequest}
                    onChange={handleInputChange}
                    placeholder="e.g., 'Include 2 questions about historical figures', 'Focus on practical examples'"
                    rows={3}
                    disabled={isProcessing}
                  />
                </div>

                {!formValidation.isValid && (formState.topics.trim() || parseInt(questionCount) > 0) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {formValidation.errors[0]}
                    </AlertDescription>
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
                <Button 
                  type="submit" 
                  disabled={!formValidation.isValid || isProcessing}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* PREVIEW SECTION */}
        <div className="lg:col-span-8 min-w-0">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    {generatedExam 
                      ? `${totalQuestions} question${totalQuestions !== 1 ? 's' : ''} generated`
                      : 'Your exam will appear here'
                    }
                  </CardDescription>
                </div>
                
                {generatedExam && (
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      disabled={isProcessing}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadPdf(false)}
                      disabled={isProcessing}
                    >
                      {isDownloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="mr-2 h-4 w-4" />
                      )}
                      PDF
                    </Button>
                    {answerKey && answerKey.length > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownloadPdf(true)}
                        disabled={isProcessing}
                      >
                        {isDownloading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="mr-2 h-4 w-4" />
                        )}
                        PDF + Answers
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div
                id="pdf-preview-content"
                className="p-8 border rounded-md bg-white text-black min-h-[500px]"
              >
                {isGenerating && (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="text-lg font-semibold">Generating questions...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This may take a few moments
                    </p>
                  </div>
                )}

                {!isGenerating && !generatedExam && (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-muted-foreground">
                    <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg">Ready to generate exam questions</p>
                    <p className="text-sm mt-2">
                      Fill in the form and click "Generate Questions" to begin
                    </p>
                  </div>
                )}

                {generatedExam && !isGenerating && (
                  <div className="exam-paper space-y-6">
                    <div className="text-center border-b-2 border-black pb-4 mb-6">
                      <h1 className="text-2xl font-bold uppercase mb-2">
                        {settings?.schoolName || 'School Name'}
                      </h1>
                      <h2 className="text-xl font-semibold mb-1">
                        {formValidation.finalInput.subject} - {formValidation.finalInput.classLevel}
                      </h2>
                      <p className="text-sm">
                         {settings?.currentTerm}, {settings?.currentSession}
                      </p>
                    </div>

                    {generatedExam.objectiveQuestions && generatedExam.objectiveQuestions.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-300">
                          Section A: Objective Questions
                        </h3>
                        <div className="space-y-4">
                          {generatedExam.objectiveQuestions.map((q, idx) => (
                            <div key={idx} className="question">
                              <p className="font-medium mb-2">
                                {idx + 1}. {q.question}
                              </p>
                              <div className="ml-4 grid grid-cols-2 gap-x-4 gap-y-1">
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="option text-sm">
                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedExam.essayQuestions && generatedExam.essayQuestions.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-300">
                          {generatedExam.objectiveQuestions ? 'Section B: Essay Questions' : 'Essay Questions'}
                        </h3>
                        <div className="space-y-6">
                          {generatedExam.essayQuestions.map((q, idx) => (
                            <div key={idx} className="question">
                              <p className="font-medium mb-2">
                                {idx + 1}. {q.question}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-300">
                      <p>End of Examination</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

       <div className="hidden print:block">
           <div id="print-content" className="exam-paper-print">
               {generatedExam && (
                  <div className="exam-paper space-y-6">
                    <div className="text-center border-b-2 border-black pb-4 mb-6">
                      <h1 className="text-2xl font-bold uppercase mb-2">
                        {settings?.schoolName || 'School Name'}
                      </h1>
                      <h2 className="text-xl font-semibold mb-1">
                        {formValidation.finalInput.subject} - {formValidation.finalInput.classLevel}
                      </h2>
                      <p className="text-sm">
                         {settings?.currentTerm}, {settings?.currentSession}
                      </p>
                    </div>

                    {generatedExam.objectiveQuestions && generatedExam.objectiveQuestions.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-300">
                          Section A: Objective Questions
                        </h3>
                        <div className="space-y-4">
                          {generatedExam.objectiveQuestions.map((q, idx) => (
                            <div key={idx} className="question">
                              <p className="font-medium mb-2">
                                {idx + 1}. {q.question}
                              </p>
                              <div className="ml-4 grid grid-cols-2 gap-x-4 gap-y-1">
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="option text-sm">
                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedExam.essayQuestions && generatedExam.essayQuestions.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-300">
                          {generatedExam.objectiveQuestions ? 'Section B: Essay Questions' : 'Essay Questions'}
                        </h3>
                        <div className="space-y-6">
                          {generatedExam.essayQuestions.map((q, idx) => (
                            <div key={idx} className="question">
                              <p className="font-medium mb-2">
                                {idx + 1}. {q.question}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-300">
                      <p>End of Examination</p>
                    </div>
                  </div>
                )}
           </div>
       </div>
       <style jsx global>{`
        @media print {
            body * {
                visibility: hidden;
            }
            #print-content, #print-content * {
                visibility: visible;
            }
            #print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
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
