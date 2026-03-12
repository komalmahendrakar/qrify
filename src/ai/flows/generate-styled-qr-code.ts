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
import {googleAI} from '@genkit-ai/google-genai';
import QRCode from 'qrcode';

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

    // 1. Generate a high-quality standard QR code using the qrcode library.
    // This ensures that the base pattern is technically perfect and scannable.
    const baseQrDataUri = await QRCode.toDataURL(url, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'H', // High error correction allows for more artistic styling
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // 2. If the user wants a simple classic QR code, return the library result immediately.
    const lowerStyle = stylePrompt.toLowerCase();
    if (lowerStyle.includes('classic') || lowerStyle.includes('minimalist') || lowerStyle === 'standard') {
      return {qrCodeDataUri: baseQrDataUri};
    }

    // 3. Use Gemini to style the base QR code according to the prompt.
    // We pass the perfectly scannable QR code as a reference.
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-image'),
      prompt: [
        {
          media: {
            url: baseQrDataUri,
            contentType: 'image/png'
          }
        },
        {
          text: `You are a professional graphic designer. Take the provided scannable QR code image and apply the following artistic style to it: "${stylePrompt}".
          
          CRITICAL RULES:
          1. The output must be a single, complete, high-quality image.
          2. The QR code pattern MUST remain 100% scannable. Do not obscure or significantly distort the core data modules or the three large corner squares (finders).
          3. Integrate the style into the modules (dots/squares) and the background.
          4. Output ONLY the resulting styled QR code image.`,
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Check if the response contains media.
    if (!response.media || response.media.length === 0 || !response.media[0].url) {
      // Fallback to the scannable base QR if AI styling fails
      return {qrCodeDataUri: baseQrDataUri};
    }

    return {qrCodeDataUri: response.media[0].url};
  }
);