import { GoogleGenAI } from '@google/genai';

export class LlmService {
  constructor(private ai: GoogleGenAI) {}

  async ask(params: { systemInstruction: string; userPrompt: string }) {
    const { systemInstruction, userPrompt } = params;

    return await this.ai.models.generateContentStream({
      model: 'gemini-2.5-flash-lite',
      contents: userPrompt,
      config: {
        systemInstruction,
      },
    });
  }
}
