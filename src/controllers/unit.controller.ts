import { UpdateUnitDto } from '@/dtos/unit.dto';
import { UnauthorizedError } from '@/errors';
import { UnitRepository } from '@/repositories/unit.repository';
import { UnitService } from '@/services/unit.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const unitService = new UnitService(new UnitRepository());

export class UnitController {
  async updateUnit(req: Request, res: Response) {
    const { id: unitId } = req.params;
    const payload = req.body as UpdateUnitDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await unitService.updateUnit(unitId, instructorId, payload);
    successResponse({ res, message: 'Update unit successfully', data: result });
  }
}
