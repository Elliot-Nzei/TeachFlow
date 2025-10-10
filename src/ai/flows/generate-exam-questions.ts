
'use server';
/**
 * @fileOverview AI Exam Question Generator Flow.
 *
 * - generateExamQuestions - A function that generates exam questions based on user inputs.
 * - GenerateExamInput - The input type for the generateExamQuestions function.
 * - GenerateExamOutput - The return type for the generateExamQuestions function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateExamInputSchema = z.object({
  classLevel: z.string().describe('The class level for the exam (e.g., Primary 4, JSS 2).'),
  subject: z.string().describe('The subject for the exam (e.g., English, Mathematics).'),
  topics: z.string().describe('A comma-separated list of topics to be covered in the exam.'),
  questionType: z.enum(['Objective', 'Essay', 'Both']).describe('The type of questions to generate.'),
  questionCount: z.number().min(1).max(50).describe('The total number of questions to generate.'),
  additionalRequest: z.string().optional().describe('Any additional specific instructions for the AI.'),
});
export type GenerateExamInput = z.infer<typeof GenerateExamInputSchema>;

const GenerateExamOutputSchema = z.object({
  objectiveQuestions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
  })).optional().describe('An array of objective questions, each with options and the correct answer.'),
  essayQuestions: z.array(z.object({
    question: z.string(),
  })).optional().describe('An array of essay or theory questions.'),
});
export type GenerateExamOutput = z.infer<typeof GenerateExamOutputSchema>;

export async function generateExamQuestions(input: GenerateExamInput): Promise<GenerateExamOutput> {
    if (!input.classLevel || !input.subject || !input.topics) {
        throw new Error('Class, subject, and topics are required.');
    }
    return generateExamQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExamQuestionsPrompt',
  input: { schema: GenerateExamInputSchema },
  output: { schema: GenerateExamOutputSchema },
  prompt: `You are an expert Nigerian educator and examiner. Your task is to generate high-quality exam questions based on the NERDC curriculum for the specified class and subject.

**Exam Details:**
- Class: {{{classLevel}}}
- Subject: {{{subject}}}
- Topics: {{{topics}}}
- Question Type: {{{questionType}}}
- Number of Questions: {{{questionCount}}}
{{#if additionalRequest}}
- Special Instructions: {{{additionalRequest}}}
{{/if}}

**Formatting Instructions:**

Your entire response MUST be a valid JSON object.

1.  **If 'questionType' is 'Objective'**:
    -   Generate {{{questionCount}}} multiple-choice questions.
    -   The JSON output should have an "objectiveQuestions" array.
    -   Each object in the array must have a "question" (string), an "options" array of 4 strings (A, B, C, D), and an "answer" (string, which is the correct option text).

    *Example for Objective:*
    {
      "objectiveQuestions": [
        {
          "question": "What is the capital of Nigeria?",
          "options": ["Lagos", "Kano", "Abuja", "Ibadan"],
          "answer": "Abuja"
        }
      ]
    }

2.  **If 'questionType' is 'Essay'**:
    -   Generate {{{questionCount}}} essay/theory questions.
    -   The JSON output should have an "essayQuestions" array.
    -   Each object in the array must have a "question" (string).

    *Example for Essay:*
    {
      "essayQuestions": [
        { "question": "Explain the process of photosynthesis." },
        { "question": "Describe the three arms of the Nigerian government." }
      ]
    }

3.  **If 'questionType' is 'Both'**:
    -   Generate a mix of questions, approximately 60% objective and 40% essay, totaling {{{questionCount}}} questions.
    -   The JSON output should have BOTH "objectiveQuestions" and "essayQuestions" arrays.

    *Example for Both:*
    {
      "objectiveQuestions": [
        {
          "question": "Which of these is a primary color?",
          "options": ["Green", "Orange", "Blue", "Purple"],
          "answer": "Blue"
        }
      ],
      "essayQuestions": [
        { "question": "Write a short composition about your last holiday." }
      ]
    }

**CRITICAL GUIDELINES:**
-   Ensure questions are clear, age-appropriate for the '{{{classLevel}}}', and relevant to the Nigerian context.
-   Adhere strictly to the JSON output format specified for each question type. Do not add any extra text or explanations outside the JSON structure.
-   For objective questions, ensure the "answer" field contains the full text of the correct option.`,
});

const generateExamQuestionsFlow = ai.defineFlow(
  {
    name: 'generateExamQuestionsFlow',
    inputSchema: GenerateExamInputSchema,
    outputSchema: GenerateExamOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate exam questions.');
    }
    return output;
  }
);
