import { AddUnitDto, UpdateSectionDto } from '@/dtos/section.dto';
import { ForbiddenError, NotFoundError } from '@/errors';
import { SectionRepository } from '@/repositories/section.repository';

export class SectionService {
  constructor(private sectionRepository: SectionRepository) {}

  async deleteSection(instructorId: string, sectionId: string) {
    const course = await this.sectionRepository.getCourseBySectionId(sectionId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }
    await this.sectionRepository.deleteSection(sectionId);
  }

  async updateSection(sectionId: string, instructorId: string, payload: UpdateSectionDto) {
    const course = await this.sectionRepository.getCourseBySectionId(sectionId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }
    const section = await this.sectionRepository.updateSection(sectionId, payload);
    return section;
  }

  async addUnit(sectionId: string, instructorId: string, payload: AddUnitDto) {
    const { title, description, type } = payload;
    const course = await this.sectionRepository.getCourseBySectionId(sectionId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }
    const maxOrder = await this.sectionRepository.getMaxUnitOrder(sectionId);
    const nextOrder = (maxOrder._max.order ?? 0) + 1;

    const newUnit = await this.sectionRepository.addUnit({
      section: { connect: { id: sectionId } },
      title,
      description,
      type,
      order: nextOrder,
    });
    return {
      id: newUnit.id,
      sectionId: newUnit.sectionId,
      title: newUnit.title,
      description: newUnit.description,
      type: newUnit.type,
      order: newUnit.order,
      steps: [],
    };
  }
}
