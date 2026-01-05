import { AddStepDto, UpdateUnitDto } from '@/dtos/unit.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { UserRole } from '@/generated/prisma/enums';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { UnitRepository } from '@/repositories/unit.repository';

export class UnitService {
  constructor(
    private unitRepository: UnitRepository,
    private enrollmentRepository: EnrollmentRepository
  ) {}

  async getUnitById(unitId: string, userId: string, role?: UserRole) {
    const course = await this.unitRepository.getCourseByUnitId(unitId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== userId && role !== 'admin') {
      const enrollment = await this.enrollmentRepository.getEnrollment(course.id, userId);
      if (!enrollment || (enrollment.status !== 'active' && enrollment.status !== 'completed'))
        throw new ForbiddenError('Permission denied: You do not have permission to access this content.');
    }
    const section = await this.unitRepository.getUnitById(unitId);
    return section;
  }

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

    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    };
    const newStep = await this.unitRepository.addStep({
      lesson: { connect: { id: unitId } },
      content,
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
