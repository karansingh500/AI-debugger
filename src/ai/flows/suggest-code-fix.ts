'use server';

/**
 * @fileOverview AI-powered code fix suggestion flow.
 *
 * - suggestCodeFix - A function that suggests code fixes based on identified errors.
 * - SuggestCodeFixInput - The input type for the suggestCodeFix function.
 * - SuggestCodeFixOutput - The return type for the suggestCodeFix function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCodeFixInputSchema = z.object({
  code: z.string().describe('The code containing the error.'),
  language: z.string().describe('The programming language of the code.'),
  errorDescription: z.string().describe('A description of the error in the code.'),
});
export type SuggestCodeFixInput = z.infer<typeof SuggestCodeFixInputSchema>;

const SuggestCodeFixOutputSchema = z.object({
  suggestedFix: z.string().describe('The suggested code fix to address the identified error.'),
  explanation: z.string().describe('An explanation of why the suggested fix is appropriate.'),
});
export type SuggestCodeFixOutput = z.infer<typeof SuggestCodeFixOutputSchema>;

export async function suggestCodeFix(input: SuggestCodeFixInput): Promise<SuggestCodeFixOutput> {
  return suggestCodeFixFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCodeFixPrompt',
  input: {schema: SuggestCodeFixInputSchema},
  output: {schema: SuggestCodeFixOutputSchema},
  prompt: `You are an AI code debugger. Given the following code, programming language, and error description, suggest a code fix to address the issue and explain why the fix is appropriate.

Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

Error Description: {{{errorDescription}}}

Suggested Fix:`,
});

const suggestCodeFixFlow = ai.defineFlow(
  {
    name: 'suggestCodeFixFlow',
    inputSchema: SuggestCodeFixInputSchema,
    outputSchema: SuggestCodeFixOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
