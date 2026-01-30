import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const FILE_PROVIDER = process.env.FILE_PROVIDER || 'local';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');
const PERMANENT_DIR = path.join(UPLOAD_DIR, 'permanent');
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails');

// Tạo thư mục nếu chưa tồn tại
if (FILE_PROVIDER === 'local') {
  [UPLOAD_DIR, TEMP_DIR, PERMANENT_DIR, THUMBNAIL_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const createMulter = () => {
  // Cloud
  if (FILE_PROVIDER !== 'local') {
    return multer({
      storage: multer.memoryStorage(),
      // fileFilter,
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
      },
    });
  }

  // Local
  return multer({
    storage: diskStorage,
    // fileFilter,
    limits: {
      fileSize: 500 * 1024 * 1024,
    },
  });
};

export const upload = createMulter();

export const uploadConfig = {
  UPLOAD_DIR,
  TEMP_DIR,
  PERMANENT_DIR,
  THUMBNAIL_DIR,
};
