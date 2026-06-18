import 'dotenv/config';

import fs from 'fs/promises';
import path from 'path';

import cloudinary from '@/config/cloudinary.config';
import { prisma } from '@/lib/prisma';

import { FileType, FileMetadata } from '@/types/file.types';
import { getCloudinaryResourceType } from '@/utils/file';

const LOCAL_UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

function getResourceType(fileType: FileType) {
  return getCloudinaryResourceType(fileType);
}

async function uploadLocalFile(absolutePath: string, fileType: FileType) {
  return cloudinary.uploader.upload(absolutePath, {
    folder: 'uploads',
    resource_type: getResourceType(fileType),
  });
}

async function migrateFile(file: any) {
  try {
    const relativePath = file.url.replace(/^\/+/, '').replace(/^uploads\//, '');

    const absolutePath = path.join(LOCAL_UPLOAD_ROOT, relativePath);

    await fs.access(absolutePath);

    console.log(`Uploading ${absolutePath}`);

    const uploadResult = await uploadLocalFile(absolutePath, file.type);

    const metadata: FileMetadata = {
      ...(file.metadata as any),
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration,
    };

    await prisma.file.update({
      where: {
        id: file.id,
      },
      data: {
        url: uploadResult.secure_url,
        provider: 'cloudinary',
        providerPublicId: uploadResult.public_id,
        metadata: metadata as any,
      },
    });

    console.log(`✓ Migrated ${file.id}`);
  } catch (error) {
    console.error(`✗ Failed ${file.id}`, error);
  }
}

async function main() {
  const files = await prisma.file.findMany({
    where: {
      provider: 'local',
      status: 'active',
    },
  });

  console.log(`Found ${files.length} files`);

  for (const file of files) {
    await migrateFile(file);
  }

  console.log('Migration completed');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
