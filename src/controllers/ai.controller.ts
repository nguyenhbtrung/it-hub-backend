import { AskAiStepDto } from '@/dtos/ai.dto';
import { AiService } from '@/services';
import { successResponse } from '@/utils/response';
import { Injectable } from '@ntrg/simple-di';
import { Request, Response } from 'express';

@Injectable()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  async askAiStep(req: Request, res: Response) {
    const userId = req.user!.id;
    const payload = req?.body as AskAiStepDto;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const response = await this.aiService.askAiStep(userId, payload);
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
    await this.aiService.embedStepContent('cmkt58ix0000kbgvmky70vufw');
    successResponse({
      res,
      // data: result,
    });
  }
}
