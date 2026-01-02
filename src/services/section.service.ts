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
}
