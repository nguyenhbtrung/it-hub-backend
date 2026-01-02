import { UpdateUnitDto } from '@/dtos/unit.dto';
import { prisma } from '@/lib/prisma';

export class UnitRepository {
  async getCourseByUnitId(unitId: string) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        section: {
          select: {
            course: {
              select: { id: true, instructorId: true },
            },
          },
        },
      },
    });
    return unit?.section?.course;
  }

  async updateUnit(unitId: string, data: UpdateUnitDto) {
    const unit = await prisma.unit.update({
      where: { id: unitId },
      data,
    });
    return unit;
  }
}
