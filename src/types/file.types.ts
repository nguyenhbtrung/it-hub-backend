export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  thumbnails?: string[];
  originalName?: string;
  [key: string]: any;
}

export interface UploadFileDto {
  file: Express.Multer.File;
  userId: string;
  isPermanent?: boolean;
}

export interface VideoStreamOptions {
  range?: string;
  fileId: string;
}
