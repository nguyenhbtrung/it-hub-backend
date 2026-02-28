import {
  AddSubmissionDto,
  GetExerciseSubmissionsQueryDto,
  GetStudentSubmissionsQueryDto,
  GetSubmissionsByStudentIdQueryDto,
  UpdateExerciseDto,
  UpdateSubmissionDto,
} from '@/dtos/exercise.dto';
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

  async getMyExerciseSubmissionsByExerciseId(req: Request, res: Response) {
    const { exerciseId } = req.params;
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');

    const query = req.query as unknown as GetExerciseSubmissionsQueryDto;

    const result = await exerciseService.getExerciseSubmissions(userId, exerciseId, query);
    successResponse({ res, data: result.data, meta: result.meta });
  }

  async getSubmissionOverviewByUnitId(req: Request, res: Response) {
    const { unitId } = req.params;
    const result = await exerciseService.getSubmissionOverviewByUnitId(unitId);
    successResponse({ res, data: result });
  }

  async getStudentSubmissions(req: Request, res: Response) {
    const { unitId } = req.params;
    const query = req.query as unknown as GetStudentSubmissionsQueryDto;
    const result = await exerciseService.getStudentSubmissions(unitId, query);
    successResponse({ res, data: result.data, meta: result.meta });
  }

  async getSubmissionById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await exerciseService.getSubmissionById(id);
    successResponse({ res, data: result });
  }

  async getSubmissionsByUnitAndStudent(req: Request, res: Response) {
    const { unitId, studentId } = req.params;
    const query = req.query as unknown as GetSubmissionsByStudentIdQueryDto;
    const result = await exerciseService.getSubmissionsByUnitAndStudent(studentId, unitId, query);
    successResponse({ res, data: result.data, meta: result.meta });
  }

  async updateExercise(req: Request, res: Response) {
    const { unitId } = req.params;
    const payload = req.body as UpdateExerciseDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await exerciseService.updateExercise(unitId, instructorId, payload);
    successResponse({ res, message: 'Update exercise successfully', data: result });
  }

  async updateSubmission(req: Request, res: Response) {
    const { id } = req.params;
    const payload = req.body as UpdateSubmissionDto;
    const result = await exerciseService.updateSubmission(id, payload);
    successResponse({ res, data: result });
  }

  async addSubmission(req: Request, res: Response) {
    const { exerciseId } = req.params;
    const payload = req.body as AddSubmissionDto;
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const result = await exerciseService.addSubmission(userId, exerciseId, payload);
    successResponse({ res, status: 201, message: 'Add submission successfully', data: result });
  }

  async deleteSubmission(req: Request, res: Response) {
    const { id: submissionId } = req.params;
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    await exerciseService.deleteSubmission(userId, submissionId);
    successResponse({ res, status: 200, message: 'Delete submission successfully' });
  }
}
