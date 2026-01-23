/*
  Warnings:

  - The `explaination` column on the `quizzes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "quizzes" DROP COLUMN "explaination",
ADD COLUMN     "explaination" JSONB;
