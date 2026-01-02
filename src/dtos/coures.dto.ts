import { Course, CourseLevel, CourseStatus } from '@/generated/prisma/client';
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

export const updateCourseDetailSchema = z.object({
  title: z.string().min(1, 'Title is required').max(60, 'Title must not exceed 60 characters'),
  categoryId: z.string().min(1, 'CategoryId is required'),
  subCategoryId: z.string().min(1, 'SubCategoryId is required'),
  description: z.any(),
  shortDescription: z
    .string()
    .min(1, 'shortDescription is required')
    .max(120, 'shortDescription must not exceed 120 characters'),
  level: z.enum([CourseLevel.beginner, CourseLevel.intermediate, CourseLevel.advanced, CourseLevel.expert]),
  requirements: z.array(z.string()).default([]),
  keyTakeaway: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export type UpdateCourseDetailDTO = z.infer<typeof updateCourseDetailSchema>;

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

export const getCourseDetailParamsScheme = z.object({
  id: z.string(),
});

export type GetCourseDetailParamsDTO = z.infer<typeof getCourseDetailParamsScheme>;

export const getCourseDetailQueryScheme = z.object({
  view: z.enum(['instructor', 'student']).optional(),
});

export type GetCourseDetailQueryDTO = z.infer<typeof getCourseDetailQueryScheme>;

export interface GetCourseDetailInstructorViewResponseDTO {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: unknown;
  category: { id: string; name: string };
  subCategory: { id: string; name: string } | undefined;
  level: CourseLevel;
  keyTakeaway: unknown;
  requirements: unknown;
  tags: string[];
  img: { id: string; url: string } | null;
  promoVideo: { id: string; url: string } | null;
}

export const updateCourseImageScheme = z.object({
  imageId: z.string().min(1, 'imageId is required'),
});

export type UpdateCourseImageDto = z.infer<typeof updateCourseImageScheme>;

export const updateCoursePromoVideoScheme = z.object({
  promoVideoId: z.string().min(1, 'promoVideoId is required'),
});

export type UpdateCoursePromoVideoDto = z.infer<typeof updateCoursePromoVideoScheme>;
