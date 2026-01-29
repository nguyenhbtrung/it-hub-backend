-- AlterTable
ALTER TABLE "files" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN     "providerPublicId" TEXT;
