import { UpdateStepDto } from '@/dtos/step.dto';
import { UnauthorizedError } from '@/errors';
import { StepService } from '@/services';
import { successResponse } from '@/utils/response';
import { Injectable } from '@ntrg/simple-di';
import { Request, Response } from 'express';

@Injectable()
export class StepController {
  constructor(private readonly stepService: StepService) {}
  async getStepById(req: Request, res: Response) {
    const { id: stepId } = req.params;
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('InstructorId is missing');
    const role = req?.user?.role;
    const result = await this.stepService.getStepById(stepId, userId, role);
    successResponse({ res, data: result });
  }

  async updateStep(req: Request, res: Response) {
    const { id: stepId } = req.params;
    const payload = req.body as UpdateStepDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await this.stepService.updateStep(stepId, instructorId, payload);
    successResponse({ res, message: 'Update step successfully', data: result });
  }

  async deleteStep(req: Request, res: Response) {
    const { id: stepId } = req.params;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    await this.stepService.deleteStep(instructorId, stepId);
    successResponse({ res, message: 'Delete step successfully' });
  }
}
