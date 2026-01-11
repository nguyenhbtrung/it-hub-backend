import { Course, CourseLevel, CourseStatus, Unit } from '@/generated/prisma/client';
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
    .min(0, 'shortDescription is required')
    .max(120, 'shortDescription must not exceed 120 characters'),
  level: z.enum([CourseLevel.beginner, CourseLevel.intermediate, CourseLevel.advanced, CourseLevel.expert]),
  requirements: z.array(z.string()).default([]),
  keyTakeaway: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export type UpdateCourseDetailDTO = z.infer<typeof updateCourseDetailSchema>;

export const updateCourseStatusSchema = z.object({
  status: z.enum([
    CourseStatus.draft,
    CourseStatus.pending,
    CourseStatus.published,
    CourseStatus.hidden,
    CourseStatus.suspended,
  ]),
});

export type UpdateCourseStatusDTO = z.infer<typeof updateCourseStatusSchema>;

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
  status: string;
}

export const getCourseContentQueryScheme = z.object({
  view: z.enum(['instructor', 'student']).optional(),
});

export type GetCourseContentQueryDTO = z.infer<typeof getCourseContentQueryScheme>;

export const updateCourseImageScheme = z.object({
  imageId: z.string().min(1, 'imageId is required'),
});

export type UpdateCourseImageDto = z.infer<typeof updateCourseImageScheme>;

export const updateCoursePromoVideoScheme = z.object({
  promoVideoId: z.string().min(1, 'promoVideoId is required'),
});

export type UpdateCoursePromoVideoDto = z.infer<typeof updateCoursePromoVideoScheme>;

export const addSectionScheme = z.object({
  title: z.string().min(1, 'Title is required').max(60, 'Title must not exceed 60 characters'),
  description: z.string().min(0, 'Description is required').max(120, 'Description must not exceed 120 characters'),
  objectives: z.array(z.string()).default([]),
});

export type AddSectionDto = z.infer<typeof addSectionScheme>;

export const getCourseContentBreadcrumbQueryScheme = z.object({
  type: z.enum(['section', 'unit', 'step']),
});

export type GetCourseContentBreadcrumbQueryDTO = z.infer<typeof getCourseContentBreadcrumbQueryScheme>;

export const getFeaturedCoursesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
});

export type GetFeaturedCoursesQueryDTO = z.infer<typeof getFeaturedCoursesQuerySchema>;

export const getRecommendedCoursesQuerySchema = z.object({
  categoryId: z.string().min(1, 'CategoryId is required'),
  // page: z.string().regex(/^\d+$/).optional().transform(Number),
  // limit: z.string().regex(/^\d+$/).optional().transform(Number),
});

export type GetRecommendedCoursesQueryDto = z.infer<typeof getRecommendedCoursesQuerySchema>;

export const getCoursesQuerySchema = z.object({
  view: z.enum(['instructor', 'student', 'admin']).optional(),
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  q: z.string().optional(),
  level: z
    .union([z.enum(CourseLevel), z.array(z.enum(CourseLevel))])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  duration: z
    .union([
      z.enum(['extraShort', 'short', 'medium', 'long', 'extraLong']),
      z.array(z.enum(['extraShort', 'short', 'medium', 'long', 'extraLong'])),
    ])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  avgRating: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .optional()
    .transform(Number),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.enum(CourseStatus).optional(),
});

export type GetCoursesQueryDTO = z.infer<typeof getCoursesQuerySchema>;

export const getStudentsByCourseIdQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
});

export type GetStudentsByCourseIdQueryDto = z.infer<typeof getStudentsByCourseIdQuerySchema>;

export const getRegistrationsByCourseIdQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
});

export type GetRegistrationsByCourseIdQueryDto = z.infer<typeof getRegistrationsByCourseIdQuerySchema>;

export const getNavigationByContentIdQuerySchema = z.object({
  contentType: z.enum(['section', 'unit', 'step']),
});

export type GetNavigationByContentIdQueryDto = z.infer<typeof getNavigationByContentIdQuerySchema>;

export const getCourseReviewsQueryScheme = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type GetCourseReviewsQueryDto = z.infer<typeof getCourseReviewsQueryScheme>;

export const createOrUpdateReviewSchema = z.object({
  rating: z.number().int().min(0).max(10),
  comment: z.string().nullable().optional(),
});

export type CreateOrUpdateReviewDto = z.infer<typeof createOrUpdateReviewSchema>;
