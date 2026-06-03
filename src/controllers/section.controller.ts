import { AddUnitDto, UpdateSectionDto } from '@/dtos/section.dto';
import { UnauthorizedError } from '@/errors';
import { SectionService } from '@/services';
import { successResponse } from '@/utils/response';
import { Injectable } from '@ntrg/simple-di';
import { Request, Response } from 'express';

@Injectable()
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  async getSectionById(req: Request, res: Response) {
    const { id: sectionId } = req.params;
    const userId = req?.user?.id;
    if (!userId) throw new UnauthorizedError('InstructorId is missing');
    const role = req?.user?.role;
    const result = await this.sectionService.getSectionById(sectionId, userId, role);
    successResponse({ res, data: result });
  }

  async updateSection(req: Request, res: Response) {
    const { id: sectionId } = req.params;
    const payload = req.body as UpdateSectionDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await this.sectionService.updateSection(sectionId, instructorId, payload);
    successResponse({ res, message: 'Update section successfully', data: result });
  }

  async addUnit(req: Request, res: Response) {
    const { id: sectionId } = req.params;
    const payload = req.body as AddUnitDto;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    const result = await this.sectionService.addUnit(sectionId, instructorId, payload);
    successResponse({ res, status: 201, message: 'Add unit successfully', data: result });
  }

  async deleteSection(req: Request, res: Response) {
    const { id: sectionId } = req.params;
    const instructorId = req?.user?.id;
    if (!instructorId) throw new UnauthorizedError('InstructorId is missing');
    await this.sectionService.deleteSection(instructorId, sectionId);
    successResponse({ res, message: 'Delete section successfully' });
  }
}
