import { AddMaterialDto, AddStepDto, UpdateUnitDto } from '@/dtos/unit.dto';
import { UnauthorizedError } from '@/errors';
import { UnitService } from '@/services';
import { successResponse } from '@/utils/response';
import { Injectable } from '@ntrg/simple-di';
import { Request, Response } from 'express';

@Injectable()
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  async getUnitById(req: Request, res: Response) {
    const { id: unitId } = req.params;
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('InstructorId is missing');
    const role = req?.user?.role;
    const result = await this.unitService.getUnitById(unitId, userId, role);
    successResponse({ res, data: result });
  }

  async updateUnit(req: Request, res: Response) {
    const { id: unitId } = req.params;
    const payload = req.body as UpdateUnitDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await this.unitService.updateUnit(unitId, instructorId, payload);
    successResponse({ res, message: 'Update unit successfully', data: result });
  }

  async deleteUnit(req: Request, res: Response) {
    const { id: unitId } = req.params;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    await this.unitService.deleteUnit(instructorId, unitId);
    successResponse({ res, message: 'Delete unit successfully' });
  }

  async addStep(req: Request, res: Response) {
    const { id: unitId } = req.params;
    const payload = req.body as AddStepDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await this.unitService.addStep(unitId, instructorId, payload);
    successResponse({ res, status: 201, message: 'Add step successfully', data: result });
  }

  async addMaterial(req: Request, res: Response) {
    const { id: unitId } = req.params;
    const payload = req.body as AddMaterialDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await this.unitService.addMaterial(unitId, instructorId, payload);
    successResponse({ res, status: 201, message: 'Add material successfully', data: result });
  }
}
