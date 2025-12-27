import { Course, Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class CourseRepository {
  async create(data: Prisma.CourseCreateInput): Promise<Course> {
    return prisma.course.create({ data });
  }
}
