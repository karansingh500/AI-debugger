// src/ai/flows/generate-code-from-description.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that generates code based on a user-provided description.
 *
 * - generateCodeFromDescription - An async function that takes a code description and returns generated code.
 * - GenerateCodeFromDescriptionInput - The input type for the generateCodeFromDescription function.
 * - GenerateCodeFromDescriptionOutput - The return type for the generateCodeFromDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeFromDescriptionInputSchema = z.object({
  description: z
    .string()
    .describe('A detailed description of the code to be generated.'),
  language: z.string().describe('The programming language for the code.'),
});

export type GenerateCodeFromDescriptionInput = z.infer<
  typeof GenerateCodeFromDescriptionInputSchema
>;

const GenerateCodeFromDescriptionOutputSchema = z.object({
  code: z.string().describe('The generated code based on the description.'),
});

export type GenerateCodeFromDescriptionOutput = z.infer<
  typeof GenerateCodeFromDescriptionOutputSchema
>;

export async function generateCodeFromDescription(
  input: GenerateCodeFromDescriptionInput
): Promise<GenerateCodeFromDescriptionOutput> {
  return generateCodeFromDescriptionFlow(input);
}

const generateCodePrompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: {schema: GenerateCodeFromDescriptionInputSchema},
  output: {schema: GenerateCodeFromDescriptionOutputSchema},
  prompt: `You are an expert software engineer who can generate code based on a description.

  Generate code in the language: {{{language}}}.

  Description: {{{description}}}

  Here is the code:
  `,
});

const generateCodeFromDescriptionFlow = ai.defineFlow(
  {
    name: 'generateCodeFromDescriptionFlow',
    inputSchema: GenerateCodeFromDescriptionInputSchema,
    outputSchema: GenerateCodeFromDescriptionOutputSchema,
  },
  async input => {
    const {output} = await generateCodePrompt(input);
    return output!;
  }
);
