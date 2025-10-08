
'use server';

/**
 * @fileOverview Enhanced report card generation flow using GenAI for personalized feedback.
 *
 * Improvements:
 * - Added attendance data integration
 * - Enhanced grading system with Nigerian standards
 * - Better trait analysis
 * - More contextual AI prompts
 * - Position in class calculation
 * - Comprehensive error handling
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReportCardInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  className: z.string().describe('The name of the class.'),
  grades: z.array(
    z.object({
      subject: z.string().describe('The subject name.'),
      score: z.number().min(0).max(100).describe('The score obtained in the subject (0-100).'),
      grade: z.string().describe('Letter grade for the subject.'),
    })
  ).describe('An array of grades for each subject.'),
  attendance: z.object({
    totalDays: z.number().describe('Total number of school days in the term.'),
    presentDays: z.number().describe('Number of days the student was present.'),
    absentDays: z.number().describe('Number of days the student was absent.'),
    lateDays: z.number().optional().describe('Number of days the student was late.'),
  }).describe("The student's attendance record for the term."),
  traits: z.array(
    z.object({
      name: z.string(),
      rating: z.number().min(1).max(5),
    })
  ).describe("An array of the student's behavioral traits and their ratings (1-5, where 5 is excellent)."),
  term: z.string().describe('The current academic term (First Term, Second Term, Third Term).'),
  session: z.string().describe('The current academic session (e.g., 2024/2025).'),
  positionInClass: z.number().optional().describe('Student position in class (1st, 2nd, etc.)'),
  totalStudentsInClass: z.number().optional().describe('Total number of students in the class.'),
});
export type GenerateReportCardInput = z.infer<typeof GenerateReportCardInputSchema>;

const GenerateReportCardOutputSchema = z.object({
  totalScore: z.number().describe('The total score of the student across all subjects.'),
  averageScore: z.number().describe('The average score of the student (rounded to 2 decimal places).'),
  overallGrade: z.string().describe('The overall grade of the student (A, B, C, D, E, or F).'),
  attendancePercentage: z.number().describe('Attendance percentage for the term.'),
  strengths: z.array(z.string()).describe('List of 2-3 key strengths identified from grades and traits.'),
  areasForImprovement: z.array(z.string()).describe('List of 2-3 areas where the student needs improvement.'),
  formTeacherComment: z.string().describe("Personalized, encouraging remark from the form teacher (3-4 sentences). Should acknowledge strengths, address areas for improvement constructively, and motivate the student."),
  principalComment: z.string().describe("Concise, authoritative remark from the principal (2-3 sentences). Should be motivational and reinforce positive behavior or academic excellence."),
});
export type GenerateReportCardOutput = z.infer<typeof GenerateReportCardOutputSchema>;

/**
 * Main function to generate a comprehensive report card with AI-powered comments.
 */
export async function generateReportCard(input: GenerateReportCardInput): Promise<GenerateReportCardOutput> {
  try {
    return await generateReportCardFlow(input);
  } catch (error) {
    console.error('Error generating report card:', error);
    throw new Error('Failed to generate report card. Please try again.');
  }
}

/**
 * Enhanced AI prompt with Nigerian educational context
 */
const prompt = ai.definePrompt({
  name: 'generateReportCardPrompt',
  input: {schema: GenerateReportCardInputSchema.extend({ attendancePercentage: z.number() })},
  output: {schema: GenerateReportCardOutputSchema},
  prompt: `You are an experienced Nigerian school administrator generating a comprehensive report card for a student in the Nigerian education system.

**CONTEXT:**
You are writing comments that will be read by parents/guardians. Your tone should be professional, encouraging, and constructive. Comments should reflect Nigerian educational values, emphasizing both academic excellence and character development.

**STUDENT INFORMATION:**
- Name: {{studentName}}
- Class: {{className}}
- Term: {{term}}
- Session: {{session}}
{{#if positionInClass}}
- Position: {{positionInClass}} out of {{totalStudentsInClass}} students
{{/if}}

**ACADEMIC PERFORMANCE:**
{{#each grades}}
- {{subject}}: {{score}}/100 (Grade {{grade}})
{{/each}}

**ATTENDANCE RECORD:**
- Total School Days: {{attendance.totalDays}}
- Days Present: {{attendance.presentDays}}
- Days Absent: {{attendance.absentDays}}
{{#if attendance.lateDays}}
- Days Late: {{attendance.lateDays}}
{{/if}}
- Attendance Rate: {{attendancePercentage}}%

**BEHAVIORAL TRAITS (Rated 1-5, where 5 is Excellent):**
{{#each traits}}
- {{name}}: {{rating}}/5
{{/each}}

**INSTRUCTIONS:**

1. **Identify Strengths**: List 2-3 specific strengths based on:
   - High-performing subjects
   - Excellent behavioral traits (ratings 4-5)
   - Good attendance
   - Positive trends

2. **Identify Areas for Improvement**: List 2-3 specific areas needing attention:
   - Struggling subjects (scores below 50)
   - Poor behavioral traits (ratings 1-2)
   - Attendance issues
   - Specific skill gaps

3. **Form Teacher Comment** (3-4 sentences):
   - Start with a positive observation about the student
   - Acknowledge specific strengths with examples
   - Address areas for improvement constructively
   - End with encouragement and actionable advice
   - Use a warm, personal tone

4. **Principal Comment** (2-3 sentences):
   - Provide an authoritative, high-level assessment
   - Reinforce positive achievements or good character
   - Motivate the student toward excellence
   - Use a formal yet encouraging tone

**IMPORTANT:** 
- Be specific and reference actual data (subjects, traits, attendance)
- Avoid generic statements
- Balance praise with constructive feedback
- Use Nigerian English conventions
- Consider the term's position (First Term = fresh start, Second Term = mid-year progress, Third Term = year-end reflection)`,
});

/**
 * The main flow that processes student data and generates the report card
 */
const generateReportCardFlow = ai.defineFlow(
  {
    name: 'generateReportCardFlow',
    inputSchema: GenerateReportCardInputSchema,
    outputSchema: GenerateReportCardOutputSchema,
  },
  async input => {
    // Validate input
    if (input.grades.length === 0) {
      throw new Error('Cannot generate report card: No grades provided.');
    }

    // Calculate total score and average score
    const totalScore = input.grades.reduce((sum, grade) => sum + grade.score, 0);
    const averageScore = Math.round((totalScore / input.grades.length) * 100) / 100;

    // Calculate attendance percentage
    const attendancePercentage = input.attendance.totalDays > 0
      ? Math.round((input.attendance.presentDays / input.attendance.totalDays) * 100)
      : 0;

    // Determine overall grade using Nigerian grading system
    const overallGrade = calculateNigerianGrade(averageScore);

    // Call the AI prompt with enhanced context
    const {output} = await prompt({
      ...input,
      attendancePercentage,
    });

    if (!output) {
      throw new Error('AI failed to generate report card comments.');
    }

    return {
      totalScore,
      averageScore,
      overallGrade,
      attendancePercentage,
      strengths: output.strengths,
      areasForImprovement: output.areasForImprovement,
      formTeacherComment: output.formTeacherComment,
      principalComment: output.principalComment,
    };
  }
);

/**
 * Calculate grade based on Nigerian grading system
 * @param score - Average score (0-100)
 * @returns Letter grade
 */
function calculateNigerianGrade(score: number): string {
  if (score >= 75) return 'A'; // Excellent
  if (score >= 70) return 'B'; // Very Good
  if (score >= 60) return 'C'; // Good
  if (score >= 50) return 'D'; // Pass
  if (score >= 45) return 'E'; // Weak Pass
  return 'F'; // Fail
}

/**
 * Helper function to get grade interpretation
 */
function getGradeInterpretation(grade: string): string {
  const interpretations: Record<string, string> = {
    A: 'Excellent',
    B: 'Very Good',
    C: 'Good',
    D: 'Pass',
    E: 'Weak Pass',
    F: 'Fail',
  };
  return interpretations[grade] || 'Unknown';
}

/**
 * Helper function to calculate subject-specific remarks
 */
function getSubjectRemark(score: number): string {
  if (score >= 75) return 'Excellent performance';
  if (score >= 70) return 'Very good work';
  if (score >= 60) return 'Good effort';
  if (score >= 50) return 'Fair performance';
  if (score >= 45) return 'Needs improvement';
  return 'Requires serious attention';
}
