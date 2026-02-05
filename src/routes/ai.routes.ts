import { AiController } from '@/controllers/ai.controller';
import { askAiStepSchema } from '@/dtos/ai.dto';

import { requireAuth } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const aiController = new AiController();

router.post('/ask/step', requireAuth, validate(askAiStepSchema), aiController.askAiStep.bind(aiController));
router.post('/embed/step', aiController.embedStepContent.bind(aiController));

export default router;
