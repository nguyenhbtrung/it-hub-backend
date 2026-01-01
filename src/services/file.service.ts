import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { uploadConfig } from '../config/upload.config';
import { FileType, FileMetadata } from '../types/file.types';
import { prisma } from '@/lib/prisma';
import { FileStatus } from '@/generated/prisma/enums';
import { NotFoundError } from '@/errors';
import { toAbsoluteURL } from '@/utils/file';
import { toFileResponseDto, UploadFileDto } from '@/dtos/file.dto';

export class FileService {
  /**
   * Xác định loại file dựa trên MIME type
   */
  private getFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('application/pdf') || mimeType.includes('document') || mimeType.includes('text'))
      return FileType.DOCUMENT;
    return FileType.OTHER;
  }

  /**
   * Tạo thumbnail cho image
   */
  private async generateImageThumbnail(filePath: string): Promise<{ width: number; height: number }> {
    const metadata = await sharp(filePath).metadata();
    // const thumbnailPath = path.join(uploadConfig.THUMBNAIL_DIR, `thumb_${path.basename(filePath)}`);

    // await sharp(filePath).resize(400, 400, { fit: 'inside' }).toFile(thumbnailPath);

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  }

  /**
   * Tạo thumbnails cho video (multiple frames)
   */
  private async generateVideoThumbnails(filePath: string): Promise<string[]> {
    return new Promise((resolve) => {
      const thumbnails: string[] = [];
      const baseFilename = path.basename(filePath, path.extname(filePath));

      // Tạo 3 thumbnails ở các thời điểm khác nhau
      const timestamps = ['10%', '50%', '90%'];
      let completed = 0;

      timestamps.forEach((timestamp, index) => {
        const thumbnailFilename = `thumb_${baseFilename}_${index}.jpg`;
        const thumbnailPath = path.join(uploadConfig.THUMBNAIL_DIR, thumbnailFilename);

        ffmpeg(filePath)
          .screenshots({
            timestamps: [timestamp],
            filename: thumbnailFilename,
            folder: uploadConfig.THUMBNAIL_DIR,
            size: '400x?',
          })
          .on('end', () => {
            thumbnails.push(`/thumbnails/${thumbnailFilename}`);
            completed++;
            if (completed === timestamps.length) {
              resolve(thumbnails);
            }
          })
          .on('error', (err) => {
            console.error('Error generating thumbnail:', err);
            completed++;
            if (completed === timestamps.length) {
              resolve(thumbnails);
            }
          });
      });
    });
  }

  /**
   * Lấy metadata của video
   */
  private async getVideoMetadata(filePath: string): Promise<{ duration: number; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
        });
      });
    });
  }

  /**
   * Upload file
   */
  async uploadFile(data: UploadFileDto) {
    const { file, userId, isPermanent = false } = data;
    const fileType = this.getFileType(file.mimetype);

    let metadata: FileMetadata = {
      originalName: file.originalname,
    };

    // Xử lý metadata theo loại file
    if (fileType === FileType.IMAGE) {
      const imageInfo = await this.generateImageThumbnail(file.path);
      metadata = { ...metadata, ...imageInfo };
    } else if (fileType === FileType.VIDEO) {
      const [videoInfo, thumbnails] = await Promise.all([
        this.getVideoMetadata(file.path),
        this.generateVideoThumbnails(file.path),
      ]);
      metadata = { ...metadata, ...videoInfo, thumbnails };
    }

    // Di chuyển file nếu là permanent
    let finalPath = file.path;
    let fileUrl = `/uploads/temp/${file.filename}`;

    if (isPermanent) {
      const permanentPath = path.join(uploadConfig.PERMANENT_DIR, file.filename);
      await fs.rename(file.path, permanentPath);
      finalPath = permanentPath;
      fileUrl = `/uploads/permanent/${file.filename}`;
    }

    // Lưu vào database
    const fileRecord = await prisma.file.create({
      data: {
        name: file.originalname,
        url: fileUrl,
        type: fileType,
        size: BigInt(file.size),
        mimeType: file.mimetype,
        extension: path.extname(file.originalname),
        status: isPermanent ? FileStatus.active : FileStatus.temporary,
        metadata: metadata as any,
        ownerId: userId,
      },
    });

    return toFileResponseDto(fileRecord);
  }

  /**
   * Chuyển file từ temporary sang permanent
   */
  async markAsPermanent(fileId: string, userId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, ownerId: userId, status: FileStatus.temporary },
    });

    if (!file) {
      throw new NotFoundError('File not found or already permanent');
    }

    const tempPath = path.join(uploadConfig.TEMP_DIR, path.basename(file.url));
    const permanentPath = path.join(uploadConfig.PERMANENT_DIR, path.basename(file.url));

    await fs.rename(tempPath, permanentPath);

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        status: FileStatus.active,
        url: `/uploads/permanent/${path.basename(file.url)}`,
      },
    });

    return toFileResponseDto(updatedFile);
  }

  /**
   * Lấy thông tin file
   */
  async getFile(fileId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        owner: {
          select: { id: true, fullname: true, email: true },
        },
      },
    });
    if (!file) throw new NotFoundError('File not found');
    return toFileResponseDto(file);
  }

  /**
   * Xóa file
   */
  async deleteFile(fileId: string, userId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, ownerId: userId },
    });

    if (!file) {
      throw new NotFoundError('File not found');
    }

    // Xóa file vật lý
    const filePath = path.join(
      uploadConfig.UPLOAD_DIR,
      file.status === FileStatus.active ? 'permanent' : 'temp',
      path.basename(file.url)
    );

    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error('Error deleting physical file:', err);
    }

    // Xóa thumbnails nếu có
    const metadata = file.metadata as FileMetadata;
    if (metadata?.thumbnails) {
      for (const thumb of metadata.thumbnails) {
        try {
          await fs.unlink(path.join(uploadConfig.UPLOAD_DIR, thumb));
        } catch (err) {
          console.error('Error deleting thumbnail:', err);
        }
      }
    }

    // Soft delete trong database
    return prisma.file.update({
      where: { id: fileId },
      data: {
        status: FileStatus.unused,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Lấy đường dẫn file cho streaming
   */
  async getFilePath(fileId: string): Promise<string> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.status === FileStatus.unused) {
      throw new NotFoundError('File not found');
    }

    const dir = file.status === FileStatus.active ? 'permanent' : 'temp';
    return path.join(uploadConfig.UPLOAD_DIR, dir, path.basename(file.url));
  }

  /**
   * Dọn dẹp file temporary đã hết hạn (chạy định kỳ)
   */
  async cleanupTemporaryFiles(olderThanHours: number = 24) {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const expiredFiles = await prisma.file.findMany({
      where: {
        status: FileStatus.temporary,
        createdAt: { lt: cutoffDate },
      },
    });

    for (const file of expiredFiles) {
      try {
        await this.deleteFile(file.id, file.ownerId);
      } catch (err) {
        console.error(`Failed to delete expired file ${file.id}:`, err);
      }
    }

    return { deletedCount: expiredFiles.length };
  }
}
