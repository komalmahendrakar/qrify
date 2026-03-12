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

// Define the input schema for the styled QR code generation with stricter validation.
const GenerateStyledQrCodeInputSchema = z.object({
  url: z.string()
    .trim()
    .url('Please provide a valid URL.')
    .startsWith('http', 'URL must start with http or https.')
    .max(2000, 'URL is too long.')
    .describe('The URL to be encoded in the QR code.'),
  stylePrompt: z.string()
    .trim()
    .min(1, 'Style prompt cannot be empty.')
    .max(500, 'Style prompt is too long.')
    .describe(
      "A text prompt describing the desired visual style or theme for the QR code."
    ),
});
export type GenerateStyledQrCodeInput = z.infer<
  typeof GenerateStyledQrCodeInputSchema
>;

// Define the output schema for the styled QR code generation.
const GenerateStyledQrCodeOutputSchema = z.object({
  qrCodeDataUri:
    z.string().describe(
      "The generated QR code as a data URI."
    ),
});
export type GenerateStyledQrCodeOutput = z.infer<
  typeof GenerateStyledQrCodeOutputSchema
>;

/**
 * Generates a visually unique and branded QR code based on a URL and a style prompt.
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
    
    // Production Logging
    console.info(`[QR_GEN] Starting generation for URL: ${url} with style: ${stylePrompt}`);

    // 1. Generate a high-quality standard QR code using the qrcode library.
    const baseQrDataUri = await QRCode.toDataURL(url, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // 2. Performance optimization: If the style is simple, bypass AI processing.
    const lowerStyle = stylePrompt.toLowerCase();
    const simpleStyles = ['classic', 'minimalist', 'standard', 'basic', 'default'];
    if (simpleStyles.some(s => lowerStyle.includes(s)) && lowerStyle.length < 20) {
      console.info(`[QR_GEN] Bypassing AI for simple style: ${stylePrompt}`);
      return {qrCodeDataUri: baseQrDataUri};
    }

    // 3. AI-Enhanced styling.
    try {
      const startTime = Date.now();
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
            text: `You are a professional graphic designer. Enhance the provided scannable QR code with this style: "${stylePrompt}".
            
            CRITICAL RULES:
            1. The output MUST be 100% scannable. Do not obscure finder patterns (the large corner squares).
            2. Integrate the style artistically into the dots and background.
            3. Output ONLY the resulting image.`,
          },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' }
          ]
        },
      });

      console.info(`[QR_GEN] AI Styling completed in ${Date.now() - startTime}ms`);

      if (response.media && response.media.length > 0 && response.media[0].url) {
        return {qrCodeDataUri: response.media[0].url};
      }
    } catch (e) {
      console.error("[QR_GEN] AI Generation Error:", e);
    }

    // Fallback to the scannable base QR if AI styling fails
    console.warn(`[QR_GEN] Falling back to base QR code for ${url}`);
    return {qrCodeDataUri: baseQrDataUri};
  }
);
