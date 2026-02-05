import { AskAiStepDto } from '@/dtos/ai.dto';
import { StepRepository } from '@/repositories/step.repository';
import { UnitOfWork } from '@/repositories/unitOfWork';
import { AiService } from '@/services/ai.service';
import { LlmService } from '@/services/llm.service';
import { successResponse } from '@/utils/response';
import { GoogleGenAI } from '@google/genai';
import { Request, Response } from 'express';

const API_KEY = process.env.GEMINI_API_KEY || '';

const aiService = new AiService(
  new StepRepository(),
  new LlmService(new GoogleGenAI({ apiKey: API_KEY })),
  new UnitOfWork()
);

export class AiController {
  async askAiStep(req: Request, res: Response) {
    const userId = req.user!.id;
    const payload = req?.body as AskAiStepDto;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const response = await aiService.askAiStep(userId, payload);
    // successResponse({
    //   res,
    //   data: response,
    // });
    for await (const chunk of response) {
      res.write(chunk.text);
    }
    res.end();
  }

  async embedStepContent(req: Request, res: Response) {
    await aiService.embedStepContent('cmkt58ix0000kbgvmky70vufw');
    successResponse({
      res,
      // data: result,
    });
  }
}
