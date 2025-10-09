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
  weeks: z.number().min(1).max(12).describe('The number of weeks or lessons to generate (1-12).'),
  additionalContext: z.string().optional().describe('Additional context or specific requirements for the lesson notes.'),
});
export type GenerateLessonNoteInput = z.infer<typeof GenerateLessonNoteInputSchema>;

const GenerateLessonNoteOutputSchema = z.object({
  note: z.string().describe('The generated lesson note in Markdown format.'),
  metadata: z.object({
    totalWeeks: z.number(),
    generatedAt: z.string(),
    classLevel: z.string(),
    subject: z.string(),
  }).optional(),
});
export type GenerateLessonNoteOutput = z.infer<typeof GenerateLessonNoteOutputSchema>;

export async function generateLessonNote(input: GenerateLessonNoteInput): Promise<GenerateLessonNoteOutput> {
  // Input validation
  if (!input.classLevel?.trim()) {
    throw new Error('Class level is required');
  }
  if (!input.subject?.trim()) {
    throw new Error('Subject is required');
  }
  if (!input.schemeOfWork?.trim()) {
    throw new Error('Scheme of work is required');
  }

  try {
    const result = await generateLessonNoteFlow(input);
    
    // Add metadata to the output
    return {
      ...result,
      metadata: {
        totalWeeks: input.weeks,
        generatedAt: new Date().toISOString(),
        classLevel: input.classLevel,
        subject: input.subject,
      },
    };
  } catch (error) {
    console.error('Error generating lesson note:', error);
    throw new Error('Failed to generate lesson note. Please try again.');
  }
}

const prompt = ai.definePrompt({
  name: 'generateLessonNotePrompt',
  input: { schema: GenerateLessonNoteInputSchema },
  output: { schema: GenerateLessonNoteOutputSchema },
  prompt: `You are an experienced Nigerian school teacher with deep knowledge of the Nigerian Educational Research and Development Council (NERDC) curriculum.

Your task is to generate a comprehensive, well-structured lesson note in Markdown format and return it in a JSON object.

**JSON Output Format:**
Your entire response MUST be a valid JSON object with a single key "note" containing the full Markdown lesson note as a string.
Example:
{
  "note": "### Week 1: [Topic]..."
}

## LESSON NOTE DETAILS

**Class Level**: {{{classLevel}}}
**Subject**: {{{subject}}}
**Scheme of Work**: {{{schemeOfWork}}}
**Number of Weeks**: {{{weeks}}}
{{#if additionalContext}}
**Additional Context**: {{{additionalContext}}}
{{/if}}

## CRITICAL REQUIREMENTS:

1. **No Repetition**: Each week must have unique, progressive content that builds upon previous weeks
2. **Age-Appropriate**: Ensure language and activities match the cognitive level of {{{classLevel}}}
3. **Nigerian Context**: Use examples, names, and scenarios relevant to Nigerian students
4. **Curriculum Alignment**: Follow NERDC curriculum standards for {{{subject}}}
5. **Progressive Difficulty**: Content should increase in complexity across weeks

## STRUCTURE FOR EACH WEEK:

### Week [Number]: [Specific Topic Title]

#### Learning Objectives
By the end of this lesson, students should be able to:
- [Measurable objective using action verbs: define, explain, demonstrate, etc.]
- [Objective 2]
- [Objective 3]
- [Objective 4 - if applicable]

#### Instructional Materials
- [Specific material 1]
- [Specific material 2]
- [Material 3]
(Be specific: instead of "charts", say "Chart showing parts of speech with examples")

#### Previous Knowledge
Students have already learned about [specific prerequisite topics]

#### Lesson Development

**Introduction (5-7 minutes)**
- [Specific engaging activity or question to activate prior knowledge]
- [Connection to real-life Nigerian context]

**Presentation (20-25 minutes)**

*Step 1: [Substep title]*
- [Detailed explanation of what to teach and how]
- [Teacher activities]
- [Student activities]

*Step 2: [Substep title]*
- [Continue progressive presentation]
- [Include examples relevant to Nigerian students]

*Step 3: [Substep title]*
- [Build on previous steps]
- [Include interactive elements]

**Student Activities**
- [Specific activity 1 with clear instructions]
- [Activity 2 - could be pair work, group work, or individual]

**Evaluation Questions**
1. [Question testing basic understanding]
2. [Question requiring application]
3. [Question for critical thinking]
4. [Question connecting to real life]

#### Summary
[2-3 sentences recapping the key concepts covered in this week's lesson]

#### Assignment
[Specific homework task that reinforces the lesson objectives. Be clear about expectations and format]

---

## IMPORTANT GUIDELINES:

- Use Nigerian names in examples (e.g., Chidi, Amina, Tunde, Ngozi)
- Include references to Nigerian culture, locations, and contexts where relevant
- Ensure proper grammar, spelling, and punctuation throughout
- Make each week's content distinctly different and progressively more challenging
- Use active learning strategies (think-pair-share, demonstrations, hands-on activities)
- Include formative assessment opportunities in each lesson
- Ensure timing is realistic for typical Nigerian classroom periods (35-40 minutes)

Generate {{{weeks}}} complete weeks of lesson notes following this exact structure, and provide the entire output as a single JSON object.`,
});

const generateLessonNoteFlow = ai.defineFlow(
  {
    name: 'generateLessonNoteFlow',
    inputSchema: GenerateLessonNoteInputSchema,
    outputSchema: GenerateLessonNoteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    
    if (!output) {
      throw new Error('No output generated from AI model');
    }
    
    return output;
  }
);
