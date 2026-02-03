CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "step_embeddings" (
  "stepId" TEXT PRIMARY KEY,
  "courseId" TEXT,
  "sectionId" TEXT,
  "unitId" TEXT,
  "embedding" vector(768)
);