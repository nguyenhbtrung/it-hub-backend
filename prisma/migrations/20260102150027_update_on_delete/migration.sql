-- DropForeignKey
ALTER TABLE "excercises" DROP CONSTRAINT "excercises_unitId_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_fileId_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_unitId_fkey";

-- DropForeignKey
ALTER TABLE "sections" DROP CONSTRAINT "sections_courseId_fkey";

-- DropForeignKey
ALTER TABLE "steps" DROP CONSTRAINT "steps_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "units" DROP CONSTRAINT "units_sectionId_fkey";

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "steps" ADD CONSTRAINT "steps_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excercises" ADD CONSTRAINT "excercises_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
