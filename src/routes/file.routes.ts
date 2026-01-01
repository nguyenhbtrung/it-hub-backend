import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { upload } from '../config/upload.config';
import { authorize, requireAuth } from '@/middleware/auth.middleware';
import { UserRole } from '@/generated/prisma/enums';
import { serializeBigIntMiddleware } from '@/middleware/serializeBigInt.middleware';

const router = Router();
const fileController = new FileController();

router.use(serializeBigIntMiddleware);

// Upload endpoints
router.post('/upload', requireAuth, upload.single('file'), fileController.uploadFile.bind(fileController));

router.post(
  '/upload-multiple',
  requireAuth,
  upload.array('files', 10), // Max 10 files
  fileController.uploadMultipleFiles.bind(fileController)
);

// File management
router.get('/:fileId', requireAuth, fileController.getFile.bind(fileController));

router.patch('/:fileId/permanent', requireAuth, fileController.markAsPermanent.bind(fileController));

router.delete('/:fileId', requireAuth, fileController.deleteFile.bind(fileController));

// Streaming & serving
router.get('/stream/:fileId', fileController.streamVideo.bind(fileController));

router.get('/serve/:fileId', fileController.serveFile.bind(fileController));
router.get('/url/:fileId', fileController.getFileUrl.bind(fileController));

// Thumbnails
router.get('/thumbnails/:filename', fileController.getThumbnail.bind(fileController));

// Admin endpoints
router.post(
  '/admin/cleanup',
  requireAuth,
  authorize([UserRole.admin]),
  fileController.cleanupTemporaryFiles.bind(fileController)
);

export default router;
