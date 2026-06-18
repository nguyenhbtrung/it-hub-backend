import { tagController } from '@/bootstrap/container';
import { getTagsQuerySchema } from '@/dtos/tag.dto';
import { validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();

router.get('/', validateQuery(getTagsQuerySchema), tagController.getTags.bind(tagController));

export default router;
