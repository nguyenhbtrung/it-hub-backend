import { AddStepDto, UpdateUnitDto } from '@/dtos/unit.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { UnitRepository } from '@/repositories/unit.repository';

export class UnitService {
  constructor(private unitRepository: UnitRepository) {}

  async addStep(unitId: string, instructorId: string, payload: AddStepDto) {
    const { title } = payload;
    const course = await this.unitRepository.getCourseByUnitId(unitId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }
    const maxOrder = await this.unitRepository.getMaxStepOrder(unitId);
    const nextOrder = (maxOrder._max.order ?? 0) + 1;

    const newStep = await this.unitRepository.addStep({
      lesson: { connect: { id: unitId } },
      content: {},
      title,
      order: nextOrder,
    });
    return {
      id: newStep.id,
      content: newStep.content,
      title: newStep.title,
      order: newStep.order,
    };
  }

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
