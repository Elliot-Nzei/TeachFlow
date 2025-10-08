
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
  traits: z.array(
    z.object({
        name: z.string(),
        rating: z.number(),
    })
  ).describe("An array of the student's behavioral traits and their ratings (1-5)."),
  term: z.string().describe('The current academic term.'),
  session: z.string().describe('The current academic session.'),
});
export type GenerateReportCardInput = z.infer<typeof GenerateReportCardInputSchema>;

const GenerateReportCardOutputSchema = z.object({
  totalScore: z.number().describe('The total score of the student.'),
  averageScore: z.number().describe('The average score of the student.'),
  grade: z.string().describe('The overall grade of the student.'),
  formTeacherComment: z.string().describe("Personalized remark from the form teacher for the student, considering their grades and traits. Should be encouraging and constructive."),
  principalComment: z.string().describe("Personalized, concise remark from the principal for the student based on overall performance. Should be authoritative and motivational."),
});
export type GenerateReportCardOutput = z.infer<typeof GenerateReportCardOutputSchema>;

export async function generateReportCard(input: GenerateReportCardInput): Promise<GenerateReportCardOutput> {
  return generateReportCardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportCardPrompt',
  input: {schema: GenerateReportCardInputSchema},
  output: {schema: GenerateReportCardOutputSchema},
  prompt: `You are an expert Nigerian school administrator generating a report card.

  Given the student's details, grades, and behavioral traits for the term, provide:
  1. A personalized, encouraging, and constructive comment from the **Form Teacher**.
  2. A concise, authoritative, and motivational comment from the **Principal**.

  The comments should reflect the student's overall performance based on the data provided.

  Student Name: {{{studentName}}}
  Class: {{{className}}}
  Term: {{{term}}}
  Session: {{{session}}}
  
  Grades:
  {{#each grades}}
  - Subject: {{{subject}}}, Score: {{{score}}}
  {{/each}}
  
  Behavioral Traits (rated 1-5, 5 is highest):
  {{#each traits}}
  - Trait: {{{name}}}, Rating: {{{rating}}}
  {{/each}}

  Based on all the above information, generate the report card comments.
  `,
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

    const {output} = await prompt({...input});

    return {
      totalScore,
      averageScore,
      grade,
      formTeacherComment: output!.formTeacherComment,
      principalComment: output!.principalComment,
    };
  }
);
