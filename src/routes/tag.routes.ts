import { TagController } from '@/controllers/tag.controller';
import { getTagsQuerySchema } from '@/dtos/tag.dto';
import { validateQuery } from '@/middleware/validate.middleware';
import { Router } from 'express';

const router = Router();
const tagController = new TagController();

router.get('/', validateQuery(getTagsQuerySchema), tagController.getTags.bind(tagController));

export default router;
