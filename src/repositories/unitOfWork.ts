import { prisma } from '@/lib/prisma';

export class UnitOfWork {
  async execute<T>(work: (tx: any) => Promise<T>): Promise<T> {
    return await prisma.$transaction(async (tx) => {
      return await work(tx);
    });
  }
}
