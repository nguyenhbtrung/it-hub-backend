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

  async countEmbeddingToken(contents: string): Promise<number> {
    const countTokensResponse = await this.ai.models.countTokens({
      model: 'gemini-embedding-001',
      contents,
    });
    return countTokensResponse?.totalTokens || 0;
  }

  async embedContent(contents: string | string[], taskType: string = 'RETRIEVAL_DOCUMENT') {
    return await this.ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents,
      config: {
        taskType,
        outputDimensionality: 768,
      },
    });
  }
}
