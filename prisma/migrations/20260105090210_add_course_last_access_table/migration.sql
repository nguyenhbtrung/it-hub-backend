-- CreateTable
CREATE TABLE "course_last_access" (
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stepId" TEXT,
    "unitId" TEXT,
    "sectionId" TEXT,
    "accessAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_last_access_pkey" PRIMARY KEY ("courseId","userId")
);

-- AddForeignKey
ALTER TABLE "course_last_access" ADD CONSTRAINT "course_last_access_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_last_access" ADD CONSTRAINT "course_last_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_last_access" ADD CONSTRAINT "course_last_access_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_last_access" ADD CONSTRAINT "course_last_access_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_last_access" ADD CONSTRAINT "course_last_access_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
