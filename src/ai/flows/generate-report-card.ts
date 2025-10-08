'use server';

/**
 * @fileOverview Report card generation flow using GenAI to provide personalized feedback.
 *
 * - generateReportCard - A function that handles the report card generation process.
 * - GenerateReportCardInput - The input type for the generateReportCard function.
 * - GenerateReportCardOutput - The return type for the generateReportCard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReportCardInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  className: z.string().describe('The name of the class.'),
  grades: z.array(
    z.object({
      subject: z.string().describe('The subject name.'),
      score: z.number().describe('The score obtained in the subject.'),
    })
  ).describe('An array of grades for each subject.'),
  term: z.string().describe('The current academic term.'),
  session: z.string().describe('The current academic session.'),
});
export type GenerateReportCardInput = z.infer<typeof GenerateReportCardInputSchema>;

const GenerateReportCardOutputSchema = z.object({
  totalScore: z.number().describe('The total score of the student.'),
  averageScore: z.number().describe('The average score of the student.'),
  grade: z.string().describe('The overall grade of the student.'),
  remark: z.string().describe('Personalized remark for the student.'),
});
export type GenerateReportCardOutput = z.infer<typeof GenerateReportCardOutputSchema>;

export async function generateReportCard(input: GenerateReportCardInput): Promise<GenerateReportCardOutput> {
  return generateReportCardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportCardPrompt',
  input: {schema: GenerateReportCardInputSchema},
  output: {schema: GenerateReportCardOutputSchema},
  prompt: `You are an expert teacher generating report cards for students in a Nigerian school.

  Given the student's name, class, grades, term, and session, calculate the total score, average score, and assign an overall grade based on the Nigerian grading scale:

  A: 70–100
  B: 60–69
  C: 50–59
  D: 45–49
  F: below 45

  Also, provide a personalized remark for the student based on their performance.

  Student Name: {{{studentName}}}
  Class: {{{className}}}
  Term: {{{term}}}
  Session: {{{session}}}
  Grades:
  {{#each grades}}
  - Subject: {{{subject}}}, Score: {{{score}}}
  {{/each}}

  Based on the above information, generate the report card with total score, average score, grade, and a personalized remark.`,
});

const generateReportCardFlow = ai.defineFlow(
  {
    name: 'generateReportCardFlow',
    inputSchema: GenerateReportCardInputSchema,
    outputSchema: GenerateReportCardOutputSchema,
  },
  async input => {
    // Calculate total score and average score
    const totalScore = input.grades.reduce((sum, grade) => sum + grade.score, 0);
    const averageScore = totalScore / input.grades.length;

    // Assign grade based on the average score
    let grade = 'F';
    if (averageScore >= 70) {
      grade = 'A';
    } else if (averageScore >= 60) {
      grade = 'B';
    } else if (averageScore >= 50) {
      grade = 'C';
    } else if (averageScore >= 45) {
      grade = 'D';
    }

    const {output} = await prompt({...input, totalScore, averageScore, grade});
    return {
      ...output!,
      totalScore,
      averageScore,
      grade,
    };
  }
);
