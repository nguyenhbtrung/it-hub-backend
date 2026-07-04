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

    try {
      const response = await this.aiService.askAiStep(userId, payload);

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      for await (const chunk of response) {
        res.write(chunk.text);
      }
      res.end();
    } catch (error: any) {
      console.error('AI Stream Error:', error);

      const isUnavailable =
        error?.message?.includes('UNAVAILABLE') || error?.status === 'UNAVAILABLE' || error?.code === 503;

      if (isUnavailable) {
        if (!res.headersSent) {
          return res.status(503).json({
            success: false,
            code: 'AI_MODEL_BUSY',
            message: 'Hệ thống AI đang bận do số lượng yêu cầu tăng cao. Vui lòng thử lại sau ít phút.',
          });
        }
      }

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã có lỗi xảy ra trong quá trình xử lý.',
        });
      } else {
        res.write('\n[STREAM_ERROR:AI_BUSY]');
        res.end();
      }
    }
  }

  async embedStepContent(req: Request, res: Response) {
    await this.aiService.embedStepContent('cmkt58ix0000kbgvmky70vufw');
    successResponse({
      res,
      // data: result,
    });
  }
}
