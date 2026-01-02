import { UpdateUnitDto } from '@/dtos/unit.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { UnitRepository } from '@/repositories/unit.repository';

export class UnitService {
  constructor(private unitRepository: UnitRepository) {}

  async updateUnit(unitId: string, instructorId: string, payload: UpdateUnitDto) {
    const course = await this.unitRepository.getCourseByUnitId(unitId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }
    const unit = await this.unitRepository.updateUnit(unitId, payload);
    return unit;
  }

  async deleteUnit(instructorId: string, unitId: string) {
    const course = await this.unitRepository.getCourseByUnitId(unitId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }
    await this.unitRepository.deleteUnit(unitId);
  }
}
