'use client';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  generateReportCard,
  type GenerateReportCardInput,
  type GenerateReportCardOutput,
} from '@/ai/flows/generate-report-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from './ui/separator';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  studentName: z.string().min(2, { message: 'Student name is required.' }),
  className: z.string().min(2, { message: 'Class name is required.' }),
  term: z.string().min(2, { message: 'Term is required.' }),
  session: z.string().min(2, { message: 'Session is required.' }),
  grades: z.string().min(10, { message: 'Please enter at least one subject and score.' }),
});

export default function ReportCardGenerator() {
  const [report, setReport] = useState<GenerateReportCardOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: 'Ada Okoro',
      className: 'Primary 3B',
      term: 'First Term',
      session: '2023/2024',
      grades: 'Mathematics: 85, English: 92, Basic Science: 78, Social Studies: 88',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setReport(null);

    try {
        const gradesArray = values.grades
          .split(',')
          .map((g) => {
            const [subject, score] = g.split(':');
            return { subject: subject.trim(), score: parseInt(score.trim(), 10) };
          })
          .filter(g => g.subject && !isNaN(g.score));

        if (gradesArray.length === 0) {
            toast({
                variant: "destructive",
                title: "Invalid Grades Format",
                description: "Please ensure grades are in 'Subject: Score' format, separated by commas.",
            });
            setLoading(false);
            return;
        }

        const input: GenerateReportCardInput = {
          studentName: values.studentName,
          className: values.className,
          term: values.term,
          session: values.session,
          grades: gradesArray,
        };

        const result = await generateReportCard(input);
        setReport(result);
    } catch (error) {
        console.error('Error generating report card:', error);
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: "An unexpected error occurred. Please try again.",
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Enter Student Details</CardTitle>
          <CardDescription>Fill in the form below to generate a new report card.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Ada Okoro" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="className" render={({ field }) => (
                    <FormItem><FormLabel>Class</FormLabel><FormControl><Input placeholder="e.g., Primary 3B" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="term" render={({ field }) => (
                    <FormItem><FormLabel>Term</FormLabel><FormControl><Input placeholder="e.g., First Term" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="session" render={({ field }) => (
                    <FormItem><FormLabel>Session</FormLabel><FormControl><Input placeholder="e.g., 2023/2024" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField
                control={form.control}
                name="grades"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grades</FormLabel>
                    <FormControl><Textarea placeholder="Mathematics: 85, English: 92, ..." {...field} rows={4} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Generate Report
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Report Card</CardTitle>
          <CardDescription>The AI-generated report will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="font-semibold">Generating Report...</p>
              <p className="text-sm">This may take a moment.</p>
            </div>
          )}
          {!loading && !report && (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <p>Your generated report card will be displayed here.</p>
            </div>
          )}
          {report && (
             <div className="space-y-4">
                <div className="text-center">
                    <h3 className="text-2xl font-bold font-headline">{form.getValues('studentName')}</h3>
                    <p className="text-muted-foreground">{form.getValues('className')} - {form.getValues('term')}, {form.getValues('session')}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Score</p>
                        <p className="text-2xl font-bold">{report.totalScore}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Average</p>
                        <p className="text-2xl font-bold">{report.averageScore.toFixed(1)}%</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Grade</p>
                        <p className="text-2xl font-bold text-primary">{report.grade}</p>
                    </div>
                </div>
                <Separator />
                 <div>
                    <h4 className="font-semibold mb-2">Teacher's Remark</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-secondary rounded-md">{report.remark}</p>
                 </div>
             </div>
          )}
        </CardContent>
        {report && (
             <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => toast({ title: "Coming Soon!", description: "Excel export functionality will be available shortly."})}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
