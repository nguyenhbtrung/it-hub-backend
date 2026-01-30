import { FileType } from '@/types/file.types';

const FILE_PROVIDER = process.env.FILE_PROVIDER || 'local';

function isAbsoluteURL(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function toAbsoluteURL(path: string): string {
  if (FILE_PROVIDER !== 'local') {
    return path;
  }

  if (isAbsoluteURL(path)) {
    return path;
  }

  const ASSET_BASE_URL = process.env.ASSET_BASE_URL || 'http://localhost:8080';

  return new URL(path, ASSET_BASE_URL).toString();
}

/**
 * Xác định loại file dựa trên MIME type
 */
export function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return FileType.IMAGE;
  if (mimeType.startsWith('video/')) return FileType.VIDEO;
  if (mimeType.startsWith('application/pdf') || mimeType.includes('document') || mimeType.includes('text'))
    return FileType.DOCUMENT;
  return FileType.OTHER;
}

export function getCloudinaryResourceType(fileType: FileType) {
  return fileType === FileType.VIDEO ? 'video' : fileType === FileType.IMAGE ? 'image' : 'raw';
}
