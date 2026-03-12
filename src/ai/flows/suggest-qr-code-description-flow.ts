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

/**
 * Suggests a description for a QR code's embedded URL.
 * Includes a safety fallback to prevent Server Action crashes if AI fails.
 */
export async function suggestQrCodeDescription(
  input: SuggestQrCodeDescriptionInput
): Promise<SuggestQrCodeDescriptionOutput> {
  try {
    return await suggestQrCodeDescriptionFlow(input);
  } catch (error) {
    console.error("[AI_FLOW_ERROR] suggestQrCodeDescription failed:", error);
    // Fallback: Generate a simple title from the domain
    try {
      const domain = new URL(input.url).hostname.replace('www.', '');
      return { summary: `Link to ${domain}` };
    } catch {
      return { summary: "New QR Code" };
    }
  }
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
    if (!output) throw new Error("AI failed to produce output");
    return output;
  }
);
