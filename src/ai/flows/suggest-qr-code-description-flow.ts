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
  url: z.string().trim().url().max(2000).describe('The URL embedded in the QR code.'),
});
export type SuggestQrCodeDescriptionInput = z.infer<typeof SuggestQrCodeDescriptionInputSchema>;

const SuggestQrCodeDescriptionOutputSchema = z.object({
  summary: z
    .string()
    .max(100)
    .describe('A concise, descriptive title or summary for the URL.'),
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
  prompt: `Generate a concise, user-friendly title (max 6 words) for this URL. 
Focus on identifying the brand or the content of the destination page.
Keep it descriptive enough for a user to recognize it in a list.

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
