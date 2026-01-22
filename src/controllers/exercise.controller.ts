import { AddSubmissionDto, UpdateExerciseDto } from '@/dtos/exercise.dto';
import { UnauthorizedError } from '@/errors';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { ExerciseRepository } from '@/repositories/exercise.repository';
import { FileRepository } from '@/repositories/file.repository';
import { UnitRepository } from '@/repositories/unit.repository';
import { UnitOfWork } from '@/repositories/unitOfWork';
import { ExerciseService } from '@/services/exercise.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const exerciseService = new ExerciseService(
  new ExerciseRepository(),
  new EnrollmentRepository(),
  new UnitRepository(),
  new FileRepository(),
  new UnitOfWork()
);

export class ExerciseController {
  async getExerciseByUnitId(req: Request, res: Response) {
    const { unitId } = req.params;
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('UserId is missing');
    const role = req?.user?.role;
    const result = await exerciseService.getExerciseByUnitId(unitId, userId, role);
    successResponse({ res, data: result });
  }

  async getMyExerciseSubmissionByExerciseId(req: Request, res: Response) {
    const { exerciseId } = req.params;
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const result = await exerciseService.getExerciseSubmission(userId, exerciseId);
    successResponse({ res, data: result });
  }

  async updateExercise(req: Request, res: Response) {
    const { unitId } = req.params;
    const payload = req.body as UpdateExerciseDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await exerciseService.updateExercise(unitId, instructorId, payload);
    successResponse({ res, message: 'Update exercise successfully', data: result });
  }
  async addSubmission(req: Request, res: Response) {
    const { exerciseId } = req.params;
    const payload = req.body as AddSubmissionDto;
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const result = await exerciseService.addSubmission(userId, exerciseId, payload);
    successResponse({ res, status: 201, message: 'Add submission successfully', data: result });
  }
}
