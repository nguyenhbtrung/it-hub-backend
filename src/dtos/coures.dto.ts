import { Course, CourseStatus } from '@/generated/prisma/client';
import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(60, 'Title must not exceed 60 characters'),
  categoryId: z.string().min(1, 'CategoryId is required'),
  subCategoryId: z.string().min(1, 'SubCategoryId is required'),
});

export type CreateCourseDTO = z.infer<typeof createCourseSchema>;

export interface CreateCourseResponseDTO {
  id: string;
  title: string;
  categoryId: string;
  subCategoryId: string | null;
}

export function toCreateCourseResponseDTO(course: Course): CreateCourseResponseDTO {
  return {
    id: course.id,
    title: course.title,
    categoryId: course.categoryId,
    subCategoryId: course.subCategoryId,
  };
}

export interface CreatedCourseResponseDTO {
  id: string;
  title: string;
  category: string;
  subCategory: string | undefined;
  imgUrl: string | null;
  students: number;
  status: CourseStatus;
}
export const getMyCreatedCoursesSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  status: z
    .enum([
      CourseStatus.draft,
      CourseStatus.pending,
      CourseStatus.published,
      CourseStatus.hidden,
      CourseStatus.suspended,
    ])
    .optional(),
});

export type GetMyCreatedCoursesDTO = z.infer<typeof getMyCreatedCoursesSchema>;
