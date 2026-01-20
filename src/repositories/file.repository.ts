import { FileStatus, FileUsage, Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class FileRepository {
  async createOrUpdateFileUsage(fileIds: string[], data: { stepId?: string }, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;

    // Kết quả trả về: danh sách FileUsage đã được tạo/cập nhật
    const usages: FileUsage[] = [];

    for (const fileId of fileIds) {
      const usage = await client.fileUsage.upsert({
        where: {
          fileId,
        },
        update: data,
        create: { ...data, fileId },
      });

      usages.push(usage);
    }

    return usages;
  }

  async markFilesStatus(fileId: string[], status: FileStatus, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    await client.file.updateMany({
      where: { id: { in: fileId } },
      data: { status },
    });
  }
}
