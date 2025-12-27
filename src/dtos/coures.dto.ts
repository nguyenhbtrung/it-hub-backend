import { z } from 'zod';

// 🔹 Schema validate cho course
export const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(60, 'Title must not exceed 60 characters'),
  categoryId: z.string().min(1, 'CategoryId is required'),
  subCategoryId: z.string().min(1, 'SubCategoryId is required'),
});

// 🔹 Tạo DTO từ schema
export type CreateCourseDTO = z.infer<typeof createCourseSchema>;
