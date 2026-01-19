import { FileService } from '../interfaces/file.service';
import { LocalFileService } from '../local-file.service';

export function getFileService(): FileService {
  const provider = process.env.FILE_PROVIDER || 'local';

  switch (provider) {
    // case 'cloudinary':
    //   return new CloudinaryFileService();
    case 'local':
    default:
      return new LocalFileService();
  }
}
