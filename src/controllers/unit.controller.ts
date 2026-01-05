import { AddStepDto, UpdateUnitDto } from '@/dtos/unit.dto';
import { UnauthorizedError } from '@/errors';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { UnitRepository } from '@/repositories/unit.repository';
import { UnitService } from '@/services/unit.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const unitService = new UnitService(new UnitRepository(), new EnrollmentRepository());

export class UnitController {
  async getUnitById(req: Request, res: Response) {
    const { id: unitId } = req.params;
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('InstructorId is missing');
    const role = req?.user?.role;
    const result = await unitService.getUnitById(unitId, userId, role);
    successResponse({ res, data: result });
  }

  async updateUnit(req: Request, res: Response) {
    const { id: unitId } = req.params;
    const payload = req.body as UpdateUnitDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await unitService.updateUnit(unitId, instructorId, payload);
    successResponse({ res, message: 'Update unit successfully', data: result });
  }

  async deleteUnit(req: Request, res: Response) {
    const { id: unitId } = req.params;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    await unitService.deleteUnit(instructorId, unitId);
    successResponse({ res, message: 'Delete unit successfully' });
  }

  async addStep(req: Request, res: Response) {
    const { id: unitId } = req.params;
    const payload = req.body as AddStepDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await unitService.addStep(unitId, instructorId, payload);
    successResponse({ res, status: 201, message: 'Add step successfully', data: result });
  }
}
