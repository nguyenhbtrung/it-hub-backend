import { GoogleGenAI } from '@google/genai';
import { container } from './container';
import { TOKENS } from './token';
import { CloudinaryFileService, LocalFileService } from '@/services';

const API_KEY = process.env.GEMINI_API_KEY || '';
const FILE_PROVIDER = process.env.FILE_PROVIDER || 'local';

container.register({
  provide: GoogleGenAI,
  useFactory: () => new GoogleGenAI({ apiKey: API_KEY }),
});

container.register({
  provide: TOKENS.FileService,
  useClass: FILE_PROVIDER === 'local' ? LocalFileService : CloudinaryFileService,
});
