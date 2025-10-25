
'use server';
/**
 * @fileOverview A customer support AI agent for the TeachFlow application.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { readFileSync } from 'fs';
import path from 'path';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const CustomerSupportInputSchema = z.object({
  history: z.array(MessageSchema),
  question: z.string(),
});
export type CustomerSupportInput = z.infer<typeof CustomerSupportInputSchema>;

const CustomerSupportOutputSchema = z.object({
  response: z.string(),
});
export type CustomerSupportOutput = z.infer<typeof CustomerSupportOutputSchema>;

export async function customerSupport(
  input: CustomerSupportInput
): Promise<CustomerSupportOutput> {
  return customerSupportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customerSupportPrompt',
  input: { schema: CustomerSupportInputSchema.extend({ readmeContent: z.string(), backendSpecContent: z.string() }) },
  output: { schema: CustomerSupportOutputSchema },
  prompt: `You are a friendly and helpful customer support agent for a Nigerian School Management System called "TeachFlow". Your goal is to answer user questions and guide them on how to use the application from the perspective of a standard teacher or school staff member.

You have access to the application's documentation. Use this as your primary source of truth. Do not make up features.

**SECURITY CRITICAL INSTRUCTION:**
You MUST NOT discuss administrative functions, user management (changing roles, deleting users), system reset procedures, or any features found in the "/admin" section of the documentation. If a user asks about these topics, you must politely deflect by stating that "This functionality is reserved for system administrators and cannot be discussed." You may confirm that an admin role exists, but you must not provide any further details on what it can do. Do not reveal any information about specific users, user lists, or sensitive data structures from the backend schema.

**Context Documents:**

1.  **Application README:**
    \`\`\`markdown
    {{{readmeContent}}}
    \`\`\`

2.  **Backend Data Schema:**
    \`\`\`json
    {{{backendSpecContent}}}
    \`\`\`

**User's Question:**
"{{{question}}}"

**Conversation History:**
{{#each history}}
- **{{role}}**: {{content}}
{{/each}}


**Instructions:**

1.  Read the user's question and the conversation history, strictly adhering to the security instruction above.
2.  Consult the provided documentation (excluding admin sections) to find the most relevant information for a regular user.
3.  Provide a clear, concise, and helpful response.
4.  If the user asks about a feature, explain what it does and where to find it based on the documentation for standard users.
5.  If the question is about pricing or plans, refer to the "Billing" page or the features available in each plan (Free Trial, Basic, Prime).
6.  If the question is unclear, ask for clarification.
7.  Keep your responses focused on the TeachFlow application. Do not answer questions about other topics.
8.  Format your response using Markdown for readability (e.g., use lists, bold text).
`,
});

const customerSupportFlow = ai.defineFlow(
  {
    name: 'customerSupportFlow',
    inputSchema: CustomerSupportInputSchema,
    outputSchema: CustomerSupportOutputSchema,
  },
  async (input) => {
    // Read context files. Using readFileSync is acceptable here as it runs at server start-up.
    const readmePath = path.join(process.cwd(), 'src', 'README.md');
    const backendSpecPath = path.join(process.cwd(), 'docs', 'backend.json');

    const readmeContent = readFileSync(readmePath, 'utf-8');
    const backendSpecContent = readFileSync(backendSpecPath, 'utf-8');
    
    const { output } = await prompt({
      ...input,
      readmeContent,
      backendSpecContent,
    });

    if (!output) {
      return { response: "I'm sorry, I couldn't generate a response. Please try asking in a different way." };
    }
    return { response: output.response };
  }
);
