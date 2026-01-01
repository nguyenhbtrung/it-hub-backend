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

  return result as T;
};

export interface UploadFileDto {
  file: Express.Multer.File;
  userId: string;
  isPermanent?: boolean;
}
