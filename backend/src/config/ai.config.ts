import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  useAiOcr: process.env.USE_AI_OCR === 'true',
})); 