'use server';
/**
 * @fileOverview A Genkit flow for suggesting a concise, descriptive title or summary for a given URL.
 *
 * - suggestQrCodeDescription - A function that suggests a description for a QR code's embedded URL.
 * - SuggestQrCodeDescriptionInput - The input type for the suggestQrCodeDescription function.
 * - SuggestQrCodeDescriptionOutput - The return type for the suggestQrCodeDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestQrCodeDescriptionInputSchema = z.object({
  url: z.string().url().describe('The URL embedded in the QR code.'),
});
export type SuggestQrCodeDescriptionInput = z.infer<typeof SuggestQrCodeDescriptionInputSchema>;

const SuggestQrCodeDescriptionOutputSchema = z.object({
  summary: z
    .string()
    .max(100)
    .describe('A concise, descriptive title or summary for the URL, suitable for organizing QR codes.'),
});
export type SuggestQrCodeDescriptionOutput = z.infer<typeof SuggestQrCodeDescriptionOutputSchema>;

export async function suggestQrCodeDescription(
  input: SuggestQrCodeDescriptionInput
): Promise<SuggestQrCodeDescriptionOutput> {
  return suggestQrCodeDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestQrCodeDescriptionPrompt',
  input: {schema: SuggestQrCodeDescriptionInputSchema},
  output: {schema: SuggestQrCodeDescriptionOutputSchema},
  prompt: `You are an AI assistant tasked with generating concise, descriptive titles or summaries for URLs.
The title/summary should be helpful for a user to organize and retrieve saved QR codes.
Focus on the primary purpose or content implied by the URL.
Keep the summary under 100 characters.

URL: {{{url}}}`,
});

const suggestQrCodeDescriptionFlow = ai.defineFlow(
  {
    name: 'suggestQrCodeDescriptionFlow',
    inputSchema: SuggestQrCodeDescriptionInputSchema,
    outputSchema: SuggestQrCodeDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
