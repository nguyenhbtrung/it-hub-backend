-- CreateTable
CREATE TABLE "FileUsage" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "stepId" TEXT,

    CONSTRAINT "FileUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileUsage_fileId_stepId_key" ON "FileUsage"("fileId", "stepId");

-- AddForeignKey
ALTER TABLE "FileUsage" ADD CONSTRAINT "FileUsage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileUsage" ADD CONSTRAINT "FileUsage_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
