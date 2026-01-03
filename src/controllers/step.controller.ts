import { UnauthorizedError } from '@/errors';
import { StepRepository } from '@/repositories/step.repository';
import { StepService } from '@/services/step.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const stepService = new StepService(new StepRepository());

export class StepController {
  async deleteStep(req: Request, res: Response) {
    const { id: stepId } = req.params;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    await stepService.deleteStep(instructorId, stepId);
    successResponse({ res, message: 'Delete step successfully' });
  }
}
