/*
  Warnings:

  - Added the required column `deletedAt` to the `files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `extension` to the `files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metaData` to the `files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `files` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('unused', 'temporary', 'active');

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "extension" TEXT NOT NULL,
ADD COLUMN     "metaData" JSONB NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "status" "FileStatus" NOT NULL,
ALTER COLUMN "size" SET DATA TYPE BIGINT;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
