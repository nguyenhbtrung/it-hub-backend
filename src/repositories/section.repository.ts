import { UpdateSectionDto } from '@/dtos/section.dto';
import { prisma } from '@/lib/prisma';

export class SectionRepository {
  async getCourseBySectionId(sectionId: string) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: {
        course: { select: { id: true, instructorId: true } },
      },
    });
    return section?.course;
  }

  async updateSection(sectionId: string, data: UpdateSectionDto) {
    const section = await prisma.section.update({
      where: { id: sectionId },
      data,
    });
    return section;
  }

  async deleteSection(sectionId: string) {
    await prisma.section.delete({
      where: { id: sectionId },
    });
  }
}
