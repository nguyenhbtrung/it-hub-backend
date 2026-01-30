import {
  ConfirmUploadDto,
  GenerateSignedUploadOptionsDto,
  SignedUploadResponseDto,
  UploadFileDto,
} from '@/dtos/file.dto';

export interface FileService {
  generateSignedUpload(options?: GenerateSignedUploadOptionsDto): SignedUploadResponseDto;
  confirmUpload(data: ConfirmUploadDto, userId: string): Promise<any>;
  uploadFile(data: UploadFileDto): any;
  getFile(fileId: string): Promise<any>;
  markAsPermanent(fileId: string, userId: string): Promise<any>;
  deleteFile(fileId: string, userId: string): Promise<any>;
  getFilePath(fileId: string): Promise<string>;
  getFileAsoluteUrl(fileId: string): Promise<string>;
  cleanupTemporaryFiles(olderThanHours: number): Promise<any>;
}
