import { z } from 'zod';

export const askAiStepSchema = z.object({
  stepId: z.string().min(1),
  scope: z.enum(['step', 'lesson']),
  question: z.string().min(1).max(2000),
  selectedText: z.string().max(2000).optional(),
  conversationId: z.string().optional(),
  mode: z.enum(['explain', 'summary', 'quiz', 'free']).optional(),
  flexibility: z.enum(['STRICT', 'GUIDED', 'OPEN']).optional(),
});

export type AskAiStepDto = z.infer<typeof askAiStepSchema>;
