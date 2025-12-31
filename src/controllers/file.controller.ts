// src/controllers/file.controller.ts
import { Request, Response } from 'express';
import { FileService } from '../services/file.service';
import fs from 'fs';
import path from 'path';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/errors';
import { successResponse } from '@/utils/response';

const fileService = new FileService();

export class FileController {
  /**
   * Upload single file
   */
  async uploadFile(req: Request, res: Response) {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const isPermanent = req.body.isPermanent === 'true';

    const file = await fileService.uploadFile({
      file: req.file,
      userId,
      isPermanent,
    });

    successResponse({
      res,
      status: 201,
      message: 'File uploaded successfully',
      data: file,
    });
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(req: Request, res: Response) {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new BadRequestError('No files uploaded');
    }

    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');
    const isPermanent = req.body.isPermanent === 'true';

    const uploadPromises = req.files.map((file) => fileService.uploadFile({ file, userId, isPermanent }));
    const files = await Promise.all(uploadPromises);

    successResponse({
      res,
      status: 201,
      message: 'Files uploaded successfully',
      data: files,
    });
  }

  /**
   * Get file info
   */
  async getFile(req: Request, res: Response) {
    const { fileId } = req.params;
    const file = await fileService.getFile(fileId);

    successResponse({ res, data: file });
  }

  /**
   * Mark file as permanent
   */
  async markAsPermanent(req: Request, res: Response) {
    const { fileId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');

    const file = await fileService.markAsPermanent(fileId, userId);

    successResponse({
      res,
      message: 'File marked as permanent',
      data: file,
    });
  }

  /**
   * Delete file
   */
  async deleteFile(req: Request, res: Response) {
    const { fileId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError('userId is missing');

    await fileService.deleteFile(fileId, userId);

    successResponse({ res, message: 'File deleted successfully' });
  }

  /**
   * Stream video với range request support
   */
  async streamVideo(req: Request, res: Response) {
    const { fileId } = req.params;
    const range = req.headers.range;

    const filePath = await fileService.getFilePath(fileId);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Create read stream
      const file = fs.createReadStream(filePath, { start, end });

      // Set headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      file.pipe(res);
    } else {
      // No range request, stream entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  }

  /**
   * Serve static file (image, document)
   */
  async serveFile(req: Request, res: Response) {
    const { fileId } = req.params;
    const filePath = await fileService.getFilePath(fileId);

    // Set appropriate headers
    // res.sendFile('D:\\repos\\ITHub\\it-hub-backend\\' + filePath);
    res.sendFile(filePath);
  }

  /**
   * Get thumbnail
   */
  async getThumbnail(req: Request, res: Response) {
    const { filename } = req.params;
    const thumbnailPath = path.join(process.cwd(), 'uploads', 'thumbnails', filename);

    if (!fs.existsSync(thumbnailPath)) {
      throw new NotFoundError('Thumbnail not found');
    }

    res.sendFile(thumbnailPath);
  }

  /**
   * Cleanup expired temporary files (admin endpoint)
   */
  async cleanupTemporaryFiles(req: Request, res: Response) {
    const hours = parseInt(req.query.hours as string) || 24;
    const result = await fileService.cleanupTemporaryFiles(hours);

    successResponse({ res, message: 'Cleanup completed', data: result });
  }
}
