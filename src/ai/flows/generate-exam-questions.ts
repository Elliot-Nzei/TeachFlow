
'use server';
/**
 * @fileOverview AI Exam Question Generator Flow.
 * Generates exam questions based on Nigerian curriculum standards.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ============================================================================
// SCHEMAS
// ============================================================================

const GenerateExamInputSchema = z.object({
  classLevel: z.string().min(1, 'Class level is required'),
  subject: z.string().min(1, 'Subject is required'),
  topics: z.string().min(1, 'Topics are required'),
  questionType: z.enum(['Objective', 'Essay', 'Both']),
  questionCount: z.number().int().min(1).max(50),
  additionalRequest: z.string().optional(),
});

export type GenerateExamInput = z.infer<typeof GenerateExamInputSchema>;

const ObjectiveQuestionSchema = z.object({
    question: z.string().min(10, 'Question must be substantial'),
    options: z.array(z.string()).length(4, 'Must have exactly 4 options'),
    answer: z.string().min(1, 'Answer is required'),
});

const EssayQuestionSchema = z.object({
    question: z.string().min(15, 'Essay question must be substantial'),
});

const GenerateExamOutputSchema = z.object({
  objectiveQuestions: z.array(ObjectiveQuestionSchema).optional(),
  essayQuestions: z.array(EssayQuestionSchema).optional(),
});

export type GenerateExamOutput = z.infer<typeof GenerateExamOutputSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateOutput(output: GenerateExamOutput, input: GenerateExamInput): void {
  const objCount = output.objectiveQuestions?.length || 0;
  const essayCount = output.essayQuestions?.length || 0;
  const totalCount = objCount + essayCount;

  if (totalCount === 0) {
    throw new Error('No questions were generated. The AI may have failed to produce a valid response. Please try again.');
  }

  if (input.questionType === 'Objective' && objCount === 0) {
    throw new Error('Objective questions were requested but none were generated.');
  }
  
  if (input.questionType === 'Essay' && essayCount === 0) {
    throw new Error('Essay questions were requested but none were generated.');
  }
  
  if (input.questionType === 'Both' && (objCount === 0 || essayCount === 0)) {
    throw new Error('Both question types were requested, but the AI only generated one type. Please try again.');
  }

  if (output.objectiveQuestions) {
    output.objectiveQuestions.forEach((q, idx) => {
      if (!q.options.includes(q.answer)) {
        throw new Error(`For objective question ${idx + 1}, the answer "${q.answer}" was not found in the provided options. The AI returned an invalid structure.`);
      }
      const uniqueOptions = new Set(q.options);
      if (uniqueOptions.size !== q.options.length) {
        throw new Error(`Objective question ${idx + 1} contains duplicate options.`);
      }
    });
  }
}

// ============================================================================
// PROMPT DEFINITION
// ============================================================================

const prompt = ai.definePrompt({
  name: 'generateExamQuestionsPrompt',
  input: { schema: GenerateExamInputSchema },
  output: { schema: GenerateExamOutputSchema },
  prompt: `You are an expert Nigerian educator and examiner with deep knowledge of the NERDC curriculum.

**TASK:** Generate a set of exam questions based on the specifications below.

**EXAM SPECIFICATIONS:**
- Class Level: {{{classLevel}}}
- Subject: {{{subject}}}
- Topics: {{{topics}}}
- Question Type: {{{questionType}}}
- Total Questions: {{{questionCount}}}
{{#if additionalRequest}}
- Special Instructions: {{{additionalRequest}}}
{{/if}}

**QUESTION DISTRIBUTION RULES:**
1.  If 'questionType' is "Objective": Generate EXACTLY {{{questionCount}}} multiple-choice questions with 4 options each.
2.  If 'questionType' is "Essay": Generate EXACTLY {{{questionCount}}} essay questions.
3.  If 'questionType' is "Both": Generate approximately 60% objective and 40% essay questions, with the total number of questions equaling {{{questionCount}}}.

**QUALITY STANDARDS:**
-   Questions must be clear, unambiguous, and age-appropriate for {{{classLevel}}}.
-   Use Nigerian context, examples, and terminology where relevant.
-   For objective questions:
    *   All 4 options must be plausible distractors.
    *   There must be only ONE correct answer.
    *   The correct answer MUST be one of the four options provided.
    -   Avoid "all of the above" or "none of the above" options.
-   For essay questions:
    *   Use clear action verbs (e.g., Explain, Discuss, Compare, Analyze, Describe).

**CRITICAL: Your entire output MUST be a single, valid JSON object that strictly conforms to the following schema. Do NOT include any extra text, explanations, or markdown formatting outside of the JSON structure.**
`,
});

// ============================================================================
// MAIN FLOW
// ============================================================================

const generateExamQuestionsFlow = ai.defineFlow(
  {
    name: 'generateExamQuestionsFlow',
    inputSchema: GenerateExamInputSchema,
    outputSchema: GenerateExamOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      
      if (!output) {
        throw new Error('AI failed to generate a response. Please try again.');
      }

      validateOutput(output, input);
      return output;
    } catch (error) {
      console.error('Exam generation flow error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate exam: ${error.message}`);
      }
      throw new Error('An unexpected error occurred during exam generation.');
    }
  }
);

// ============================================================================
// EXPORTED FUNCTION
// ============================================================================

export async function generateExamQuestions(input: GenerateExamInput): Promise<GenerateExamOutput> {
  const validationResult = GenerateExamInputSchema.safeParse(input);
  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(e => e.message).join(', ');
    throw new Error(`Invalid input: ${errors}`);
  }

  return generateExamQuestionsFlow(input);
}

    