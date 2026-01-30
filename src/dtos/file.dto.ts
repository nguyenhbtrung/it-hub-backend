import { toAbsoluteURL } from '@/utils/file';

export const toFileResponseDto = <T extends Record<string, any>>(obj: T) => {
  const result: Record<string, any> = { ...obj };

  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === 'string') {
      if (key.toLowerCase().includes('url')) {
        result[key] = toAbsoluteURL(value);
      }
    }
  }

  if (result?.metadata?.thumbnails && Array.isArray(result.metadata.thumbnails)) {
    result.metadata = {
      ...result.metadata,
      thumbnails: result.metadata.thumbnails.map((thumb: string) => toAbsoluteURL(thumb)),
    };
  }

  return result as T;
};

export interface UploadFileDto {
  file: Express.Multer.File;
  userId: string;
  isPermanent?: boolean;
}

export interface GenerateSignedUploadOptionsDto {
  mimeType?: string;
}

export interface SignedUploadResponseDto {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: 'image' | 'video' | 'raw' | 'auto';
}

export class ConfirmUploadDto {
  providerPublicId!: string;
  url!: string;
  mimeType!: string;
  size!: number;
  originalName!: string;
  isPermanent?: boolean;
}
