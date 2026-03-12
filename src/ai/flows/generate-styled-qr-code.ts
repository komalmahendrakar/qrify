'use server';
/**
 * @fileOverview A Genkit flow that generates a styled QR code based on a URL and a textual style description.
 *
 * - generateStyledQrCode - A function that handles the styled QR code generation process.
 * - GenerateStyledQrCodeInput - The input type for the generateStyledQrCode function.
 * - GenerateStyledQrCodeOutput - The return type for the generateStyledQrCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai'; // Required to reference googleAI models

// Define the input schema for the styled QR code generation.
const GenerateStyledQrCodeInputSchema = z.object({
  url:
    z.string().url('Please provide a valid URL.').describe('The URL to be encoded in the QR code.'),
  stylePrompt:
    z.string().min(1, 'Style prompt cannot be empty.').describe(
      "A text prompt describing the desired visual style or theme for the QR code (e.g., 'futuristic blue glow', 'minimalist with integrated logo')."
    ),
});
export type GenerateStyledQrCodeInput = z.infer<
  typeof GenerateStyledQrCodeInputSchema
>;

// Define the output schema for the styled QR code generation.
const GenerateStyledQrCodeOutputSchema = z.object({
  qrCodeDataUri:
    z.string().describe(
      "The generated QR code as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateStyledQrCodeOutput = z.infer<
  typeof GenerateStyledQrCodeOutputSchema
>;

/**
 * Generates a visually unique and branded QR code based on a URL and a style prompt.
 * The QR code will incorporate the described style while remaining scannable.
 * @param input - An object containing the URL and the style prompt.
 * @returns A Promise that resolves to an object containing the generated QR code as a data URI.
 */
export async function generateStyledQrCode(
  input: GenerateStyledQrCodeInput
): Promise<GenerateStyledQrCodeOutput> {
  return generateStyledQrCodeFlow(input);
}

// Define the Genkit flow for styled QR code generation.
const generateStyledQrCodeFlow = ai.defineFlow(
  {
    name: 'generateStyledQrCodeFlow',
    inputSchema: GenerateStyledQrCodeInputSchema,
    outputSchema: GenerateStyledQrCodeOutputSchema,
  },
  async (input) => {
    const {url, stylePrompt} = input;

    // Call the Gemini 2.5 Flash Image model to generate the styled QR code.
    // The prompt instructs the model to create a scannable QR code incorporating the given style.
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-image'),
      prompt: [
        {
          text: `Generate a high-quality, perfectly scannable QR code for the following URL: ${url}.\n          \n          Integrate the QR code with the following visual style and theme: "${stylePrompt}".\n          \n          Ensure the generated image is a unique and branded QR code that aesthetically incorporates the style, maintaining absolute scannability. The style elements should not interfere with the QR code's pattern or readability. Output only the QR code image.`,
        },
      ],
      config: {
        // As per documentation, for gemini-2.5-flash-image, MUST provide both TEXT and IMAGE.
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Check if the response contains media (the generated image).
    if (!response.media || response.media.length === 0 || !response.media[0].url) {
      throw new Error('Failed to generate a valid QR code image from the AI model.');
    }

    // Extract the data URI of the generated QR code image.
    const qrCodeDataUri = response.media[0].url;

    return {qrCodeDataUri};
  }
);
