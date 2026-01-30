import cloudinary from '@/config/cloudinary.config';
import { prisma } from '@/lib/prisma';
import { FileService } from './interfaces/file.service';
import {
  ConfirmUploadDto,
  GenerateSignedUploadOptionsDto,
  SignedUploadResponseDto,
  UploadFileDto,
  toFileResponseDto,
} from '@/dtos/file.dto';
import { FileStatus } from '@/generated/prisma/enums';
import { FileType, FileMetadata } from '@/types/file.types';
import { BadRequestError, NotFoundError } from '@/errors';
import path from 'path';
import streamifier from 'streamifier';
import { getCloudinaryResourceType, getFileType } from '@/utils/file';
import { UploadApiOptions } from 'cloudinary';

const UPLOAD_DIR = 'uploads';

export class CloudinaryFileService implements FileService {
  /**
   * Upload buffer lên Cloudinary bằng upload_stream
   */
  private uploadBuffer(buffer: Buffer, options: UploadApiOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  private async fetchCloudinaryResource(publicId: string, resourceType: 'image' | 'video' | 'raw') {
    return cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });
  }

  async uploadFile(data: UploadFileDto) {
    const { file, userId, isPermanent = false } = data;
    const fileType = getFileType(file.mimetype);

    if (!file.buffer) {
      throw new Error('Memory storage is required for Cloudinary upload');
    }

    // const folder = isPermanent ? 'files/permanent' : 'files/temp';
    const folder = UPLOAD_DIR;

    const uploadResult = await this.uploadBuffer(file.buffer, {
      folder,
      resource_type: getCloudinaryResourceType(fileType),
    });

    const metadata: FileMetadata = {
      originalName: file.originalname,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration,
    };

    const fileRecord = await prisma.file.create({
      data: {
        name: file.originalname,
        url: uploadResult.secure_url,
        type: fileType,
        size: BigInt(file.size),
        mimeType: file.mimetype,
        extension: path.extname(file.originalname),
        status: isPermanent ? FileStatus.active : FileStatus.temporary,
        metadata: metadata as any,
        ownerId: userId,
        provider: 'cloudinary',
        providerPublicId: uploadResult.public_id,
      },
    });

    return toFileResponseDto(fileRecord);
  }

  generateSignedUpload(options?: GenerateSignedUploadOptionsDto): SignedUploadResponseDto {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = UPLOAD_DIR;
    const fileType = options?.mimeType ? getFileType(options?.mimeType) : null;
    const resourceType = fileType ? getCloudinaryResourceType(fileType) : 'auto';

    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET!);

    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      timestamp,
      signature,
      folder,
      resourceType,
    };
  }

  async confirmUpload(data: ConfirmUploadDto, userId: string) {
    const { providerPublicId, url, mimeType, size, originalName, isPermanent = false } = data;

    const fileType = getFileType(mimeType);
    const resourceType = getCloudinaryResourceType(fileType);

    const resource = await cloudinary.api.resource(providerPublicId, {
      resource_type: resourceType,
    });

    if (resource.bytes !== size) {
      throw new BadRequestError('File size mismatch');
    }

    if (resource.secure_url !== url) {
      throw new BadRequestError('File url mismatch');
    }

    const metadata = {
      originalName,
      width: resource.width,
      height: resource.height,
      duration: resource.duration,
    };

    const fileRecord = await prisma.file.create({
      data: {
        name: originalName,
        url: resource.secure_url,
        type: fileType,
        size: BigInt(resource.bytes),
        mimeType,
        extension: path.extname(originalName),
        status: isPermanent ? FileStatus.active : FileStatus.temporary,
        metadata: metadata as any,
        ownerId: userId,
        provider: 'cloudinary',
        providerPublicId,
      },
    });

    return toFileResponseDto(fileRecord);
  }

  async markAsPermanent(fileId: string, userId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, ownerId: userId, status: FileStatus.temporary },
    });

    if (!file) throw new NotFoundError('File not found or already permanent');

    // await cloudinary.uploader.rename(
    //   file.providerPublicId!,
    //   file.providerPublicId!.replace('files/temp', 'files/permanent')
    // );

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { status: FileStatus.active },
    });

    return toFileResponseDto(updated);
  }

  async getFile(fileId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File not found');
    return toFileResponseDto(file);
  }

  async deleteFile(fileId: string, userId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, ownerId: userId },
    });

    if (!file) throw new NotFoundError('File not found');

    if (file.providerPublicId) {
      await cloudinary.uploader.destroy(file.providerPublicId, {
        resource_type: getCloudinaryResourceType(file.type as FileType),
      });
    }

    return prisma.file.delete({ where: { id: fileId } });
  }

  async getFilePath(): Promise<string> {
    throw new BadRequestError('Cloudinary does not support local file path');
  }

  async getFileAsoluteUrl(fileId: string): Promise<string> {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundError('File not found');
    return file.url;
  }

  async cleanupTemporaryFiles(olderThanHours: number) {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const expired = await prisma.file.findMany({
      where: { status: FileStatus.temporary, createdAt: { lt: cutoff } },
    });

    for (const file of expired) {
      if (file.providerPublicId) {
        await cloudinary.uploader.destroy(file.providerPublicId);
      }
      await prisma.file.delete({ where: { id: file.id } });
    }

    return { deletedCount: expired.length };
  }
}
