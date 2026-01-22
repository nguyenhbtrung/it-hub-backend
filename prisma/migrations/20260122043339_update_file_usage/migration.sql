-- AlterTable
ALTER TABLE "file_usages" ADD COLUMN     "exerciseId" TEXT;

-- AddForeignKey
ALTER TABLE "file_usages" ADD CONSTRAINT "file_usages_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "excercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
