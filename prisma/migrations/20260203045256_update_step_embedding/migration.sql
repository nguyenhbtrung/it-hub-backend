/*
  Warnings:

  - The primary key for the `step_embeddings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `chunkIndex` to the `step_embeddings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `step_embeddings` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `step_embeddings` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "step_embeddings" DROP CONSTRAINT "step_embeddings_pkey",
ADD COLUMN     "chunkIndex" INTEGER NOT NULL,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "step_embeddings_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "step_embeddings_courseId_idx" ON "step_embeddings"("courseId");

-- CreateIndex
CREATE INDEX "step_embeddings_sectionId_idx" ON "step_embeddings"("sectionId");

-- CreateIndex
CREATE INDEX "step_embeddings_unitId_idx" ON "step_embeddings"("unitId");

-- AddForeignKey
ALTER TABLE "step_embeddings" ADD CONSTRAINT "step_embeddings_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
