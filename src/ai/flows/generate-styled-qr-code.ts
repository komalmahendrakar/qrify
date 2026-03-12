'use server';
/**
 * @fileOverview Genkit AI Flow for Styled QR Generation.
 * Logic: Standard QR (toDataURL) -> Gemini 2.5 Flash Image -> Branded Styled QR.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import QRCode from 'qrcode';

const GenerateStyledQrCodeInputSchema = z.object({
  url: z.string().url().describe('The dynamic redirect URL.'),
  stylePrompt: z.string().describe('Visual theme description.'),
});

const GenerateStyledQrCodeOutputSchema = z.object({
  qrCodeDataUri: z.string().describe('Base64 image of the styled QR.'),
});

export async function generateStyledQrCode(input: z.infer<typeof GenerateStyledQrCodeInputSchema>) {
  return generateStyledQrCodeFlow(input);
}

const generateStyledQrCodeFlow = ai.defineFlow(
  {
    name: 'generateStyledQrCodeFlow',
    inputSchema: GenerateStyledQrCodeInputSchema,
    outputSchema: GenerateStyledQrCodeOutputSchema,
  },
  async (input) => {
    const {url, stylePrompt} = input;
    
    // Create base scannable QR
    const baseQrDataUri = await QRCode.toDataURL(url, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'H',
    });

    // Fallback if no AI key
    if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return {qrCodeDataUri: baseQrDataUri};
    }

    try {
      const response = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-image'),
        prompt: [
          { media: { url: baseQrDataUri, contentType: 'image/png' } },
          { text: `Enhance this QR code with style: "${stylePrompt}". Keep dots scannable. Output ONLY image.` }
        ],
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      });

      if (response.media?.[0]?.url) return {qrCodeDataUri: response.media[0].url};
    } catch (e) {
      console.error("AI Gen Error", e);
    }

    return {qrCodeDataUri: baseQrDataUri};
  }
);