import { UpdateSectionDto } from '@/dtos/section.dto';
import { Prisma, Unit } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class SectionRepository {
  async getFirstUnitOfSection(sectionId: string) {
    const unit = await prisma.unit.findFirst({
      where: { sectionId },
      select: {
        id: true,
        type: true,
      },
      orderBy: { order: 'asc' },
    });
    return unit;
  }
  async getNextSection(courseId: string, order: number): Promise<any> {
    const nextSection = await prisma.section.findFirst({
      where: { courseId, order: { gt: order } },
      orderBy: { order: 'asc' },
    });
    return nextSection;
  }
  async getSectionById(id: string) {
    const section = await prisma.section.findUnique({
      where: { id },
    });
    return section;
  }
  async getCourseBySectionId(sectionId: string) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: {
        course: { select: { id: true, instructorId: true } },
      },
    });
    return section?.course;
  }

  async getMaxUnitOrder(sectionId: string) {
    const maxOrder = await prisma.unit.aggregate({ where: { sectionId }, _max: { order: true } });
    return maxOrder;
  }

  async addUnit(data: Prisma.UnitCreateInput): Promise<Unit> {
    const newUnit = await prisma.unit.create({ data });
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    };
    if (data.type === 'excercise') {
      const excercise = await prisma.excercise.create({
        data: {
          unit: { connect: { id: newUnit.id } },
          type: 'assignment',
          title: '',
          description: '',
          content,
        },
      });
    }
    return newUnit;
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
