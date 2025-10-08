
'use server';
/**
 * @fileOverview AI Lesson Note Generator Flow.
 *
 * - generateLessonNote - A function that generates a lesson note based on user inputs.
 * - GenerateLessonNoteInput - The input type for the generateLessonNote function.
 * - GenerateLessonNoteOutput - The return type for the generateLessonNote function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateLessonNoteInputSchema = z.object({
  classLevel: z.string().describe('The class level for the lesson note (e.g., Primary 4, JSS 2).'),
  subject: z.string().describe('The subject for the lesson note (e.g., English, Mathematics).'),
  schemeOfWork: z.string().describe('The scheme of work or topic outline.'),
  weeks: z.number().describe('The number of weeks or lessons to generate.'),
});
export type GenerateLessonNoteInput = z.infer<typeof GenerateLessonNoteInputSchema>;

const GenerateLessonNoteOutputSchema = z.object({
  note: z.string().describe('The generated lesson note in Markdown format.'),
});
export type GenerateLessonNoteOutput = z.infer<typeof GenerateLessonNoteOutputSchema>;

export async function generateLessonNote(input: GenerateLessonNoteInput): Promise<GenerateLessonNoteOutput> {
  return generateLessonNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLessonNotePrompt',
  input: { schema: GenerateLessonNoteInputSchema },
  output: { schema: GenerateLessonNoteOutputSchema },
  prompt: `You are an experienced Nigerian school teacher.
Generate a well-structured, repetition-free lesson note in Markdown format for:
Class: {{{classLevel}}}
Subject: {{{subject}}}
Scheme of Work: {{{schemeOfWork}}}
Number of Weeks: {{{weeks}}}

The lesson note must include for each week:
1.  **Week Number and Topic**: Clearly stated.
2.  **Lesson Objectives**: At the end of the lesson, pupils should be able to... (list 3-4 points).
3.  **Instructional Materials**: List of materials needed (e.g., Charts, Textbooks, Real objects).
4.  **Lesson Development**:
    *   **Introduction**: How to introduce the topic (e.g., review of previous lesson, story).
    *   **Presentation**: Step-by-step presentation of the new content.
    *   **Evaluation**: Questions to ask during or after the lesson to check understanding.
5.  **Summary**: A brief summary of the key points covered.
6.  **Assignment**: A short assignment for the students.

Ensure the content is aligned with the Nigerian curriculum standards, is factually accurate, has no spelling errors, and does not repeat content between weeks.
`,
});

const generateLessonNoteFlow = ai.defineFlow(
  {
    name: 'generateLessonNoteFlow',
    inputSchema: GenerateLessonNoteInputSchema,
    outputSchema: GenerateLessonNoteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
