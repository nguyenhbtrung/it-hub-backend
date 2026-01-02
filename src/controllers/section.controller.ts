import { AddUnitDto, UpdateSectionDto } from '@/dtos/section.dto';
import { UnauthorizedError } from '@/errors';
import { SectionRepository } from '@/repositories/section.repository';
import { SectionService } from '@/services/section.service';
import { successResponse } from '@/utils/response';
import { Request, Response } from 'express';

const sectionService = new SectionService(new SectionRepository());

export class SectionController {
  async updateSection(req: Request, res: Response) {
    const { id: sectionId } = req.params;
    const payload = req.body as UpdateSectionDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await sectionService.updateSection(sectionId, instructorId, payload);
    successResponse({ res, message: 'Update section successfully', data: result });
  }

  async addUnit(req: Request, res: Response) {
    const { id: sectionId } = req.params;
    const payload = req.body as AddUnitDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await sectionService.addUnit(sectionId, instructorId, payload);
    successResponse({ res, status: 201, message: 'Add unit successfully', data: result });
  }

  async deleteSection(req: Request, res: Response) {
    const { id: sectionId } = req.params;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    await sectionService.deleteSection(instructorId, sectionId);
    successResponse({ res, message: 'Delete section successfully' });
  }
}
