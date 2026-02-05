import { AskAiStepDto } from '@/dtos/ai.dto';
import { StepRepository } from '@/repositories/step.repository';
import { JsonContentToMarkdown, jsonContentToText } from '@/utils/content';
import { LlmService } from './llm.service';
import { GoogleGenAI } from '@google/genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { EmbeddingChunk } from '@/types/embedding.type';
import { UnitOfWork } from '@/repositories/unitOfWork';
import { NotFoundError } from '@/errors';
import { l2Normalize } from '@/utils/vector';
import { CohereClientV2 } from 'cohere-ai';

export class AiService {
  constructor(
    private stepRepository: StepRepository,
    private llmService: LlmService,
    private uow: UnitOfWork
  ) {}

  private normalizeText(text: string): string {
    return text
      .replace(/\n{3,}/g, '\n\n') // tối đa 2 dòng trống
      .trim();
  }

  private buildStepContextMarkdown(data: StepLevelInput): string {
    const { lesson, step } = data;

    const header = `
# Step Context

This context contains the current step and its position within the lesson.
`;

    const stepText = this.normalizeText(jsonContentToText(step.content));

    const body = `
# Step: ${step.title}
**Step ID:** ${step.id}

## Position in lesson
Lesson: ${lesson.title}
Step: ${step.position} / ${step.total}

---

## Step Content
${stepText}
`;

    return this.normalizeText([header, body].join('\n\n'));
  }

  private buildLessonContextMarkdown(data: LessonLevelInput): string {
    const { lesson, steps, currentStepId } = data;

    const contextHeader = `
# Lesson Context

The following steps belong to the same lesson.
They are presented in lesson order, with the current step highlighted.
`;

    const lessonHeader = `
# Lesson: ${lesson.title}

${lesson.description ?? ''}
`;

    const stepSections = steps.map((step, index) => {
      const isCurrent = step.id === currentStepId;

      const stepText = this.normalizeText(jsonContentToText(step.content));

      return this.normalizeText(`
---

## Step ${index + 1}: ${step.title}
**Step ID:** ${step.id}
${isCurrent ? '▶ **CURRENT STEP**\n' : ''}
${stepText}
`);
    });

    return this.normalizeText([contextHeader, lessonHeader, stepSections.join('\n\n')].join('\n\n'));
  }

  private buildSectionContextMarkdown(data: RagStepContextInput): string {
    const { steps, currentStepId } = data;

    const header = `
# Section Context (Relevant Steps Only)

The following steps were selected using semantic search and reranking.
They may come from different lessons within the same section.
`;

    const stepBlocks = steps.map((step, index) => {
      const isCurrent = step.id === currentStepId;
      const stepText = this.normalizeText(jsonContentToText(step.content));

      return this.normalizeText(`
---

## Evidence ${index + 1}: ${step.title}
**Step ID:** ${step.id}
${isCurrent ? '▶ **CURRENT STEP**\n' : ''}

**Lesson:** ${step.lesson.title}  
**Section:** ${step.lesson.section.title}

${stepText}
`);
    });

    return this.normalizeText([header, stepBlocks.join('\n\n')].join('\n\n'));
  }

  private buildCourseContextMarkdown(data: RagStepContextInput): string {
    const { steps, currentStepId } = data;

    const header = `
# Course Context (Relevant Steps Only)

The following steps were selected using semantic search and reranking
across the entire course. They are not sequential.
`;

    const stepBlocks = steps.map((step, index) => {
      const isCurrent = step.id === currentStepId;
      const stepText = this.normalizeText(jsonContentToText(step.content));

      return this.normalizeText(`
---

## Evidence ${index + 1}: ${step.title}
**Step ID:** ${step.id}
${isCurrent ? '▶ **CURRENT STEP**\n' : ''}

**Course:** ${step.lesson.section.course?.title ?? 'N/A'}  
**Section:** ${step.lesson.section.title}  
**Lesson:** ${step.lesson.title}

${stepText}
`);
    });

    return this.normalizeText([header, stepBlocks.join('\n\n')].join('\n\n'));
  }

  private buildSystemPrompt(): string {
    return `
You are an AI learning assistant for an online course platform for IT students.
Rules:
- Use the context as the primary source of truth.
- The "Focus" represents what the student wants clarification on.
- If the focus is vague, use the context to infer intent, quote the relevant part of the context before explaining.
- Do not treat the focus as standalone knowledge.
- Explain clearly and simply.
- Prefer examples if helpful.
- Depending on the flexibility level:
  - STRICT: Use only the information provided in the context. Do not use external knowledge.
  - GUIDED: Primarily use the context. You may use general knowledge to clarify, without contradicting the lesson.
  - OPEN: Use the context as reference. You may add external insights, clearly marked as additional.

Citation rules:
- When referring to a step, always use the Vietnamese term "Bài giảng".
- If citing a step, include its title as a Markdown link.
- The link must open in a new tab and follow this format:
  ${process.env.FRONTEND_URL}/courses/{courseSlug}/learn/steps/{stepId}

Output requirements:
- Always reply in Vietnamese and using Markdown format.
- Refer to the step content when relevant.
`.trim();
  }

  private mapModeToInstruction(mode: 'explain' | 'summary' | 'quiz' | 'free' | undefined): string {
    switch (mode) {
      case 'summary':
        return 'Summarize the content clearly.';
      case 'quiz':
        return 'Create 3 short quiz questions with answers.';
      case 'explain':
        return 'Explain in simple terms for a student.';
      default:
        return 'Answer the student question.';
    }
  }

  private buildFocus(question: string, selectedText?: string) {
    return selectedText?.trim().length ? selectedText.trim() : question.trim();
  }

  private buildUserPrompt(params: {
    context: string;
    question: string;
    focus: string;
    flexibility: string;
    courseSlug?: string;
    mode?: string;
  }) {
    const { context, question, focus, flexibility, courseSlug, mode } = params;

    return `
Flexibility level: ${flexibility}

Course slug: ${courseSlug || 'none'}

Context:
${context}

Task:
${this.mapModeToInstruction(mode as any)}

Focus:
"""
${focus}
"""

Student question:
${question}
`.trim();
  }

  private async getContextData(
    stepId: string,
    scope: 'step' | 'lesson' | 'section' | 'course',
    question: string,
    selectedText: string | undefined
  ) {
    if (scope === 'step' || scope === 'lesson') return await this.stepRepository.getStepContextData(stepId, scope);
    const ids = await this.stepRepository.getRelatedIdsByStepId(stepId);

    const retrievalQuery = selectedText
      ? `User question:\n${question}\n\nUser selected text:\n${selectedText}`
      : question;
    const result = await this.llmService.embedContent(retrievalQuery, 'RETRIEVAL_QUERY');
    const vector = result.embeddings?.[0]?.values;
    if (!vector) throw new Error('vector is undefined');

    const courseId = scope === 'course' ? ids.courseId : undefined;
    const sectionId = scope === 'section' ? ids.sectionId : undefined;

    const chunks = (await this.stepRepository.getTopKStepChunk(stepId, courseId, sectionId, vector)) as any;

    const documents = chunks.map((c: any) => c.content);

    const cohere = new CohereClientV2({
      token: process.env.COHERE_API_KEY!,
    });

    const rerank = await cohere.rerank({
      model: 'rerank-v4.0-fast',
      query: retrievalQuery,
      documents,
      topN: Math.min(5, documents.length),
    });

    const rerankedChunks = rerank.results.map((r) => {
      const chunk = chunks[r.index];
      return {
        ...chunk,
        relevanceScore: r.relevanceScore,
      };
    });

    const stepIds = Array.from(new Set(rerankedChunks.map((chunk) => chunk.stepId)));
    const steps = await this.stepRepository.getStepWithRelationByIds(stepIds);
    return steps;
  }

  async askAiStep(userId: string, payload: AskAiStepDto) {
    const { stepId, scope, question, selectedText, conversationId, mode, flexibility = 'GUIDED' } = payload;

    const contextData = await this.getContextData(stepId, scope, question, selectedText);
    const context =
      scope === 'step'
        ? this.buildStepContextMarkdown(contextData as StepLevelInput)
        : scope === 'lesson'
          ? this.buildLessonContextMarkdown(contextData as LessonLevelInput)
          : scope === 'section'
            ? this.buildSectionContextMarkdown({
                steps: contextData as any[],
                currentStepId: stepId,
              })
            : this.buildCourseContextMarkdown({
                steps: contextData as any[],
                currentStepId: stepId,
              });

    const focus = this.buildFocus(question, selectedText);
    const systemInstruction = this.buildSystemPrompt();
    const courseSlug = await this.stepRepository.getCourseSlugByStepId(stepId);
    const userPrompt = this.buildUserPrompt({ context, question, focus, mode, flexibility, courseSlug });
    return this.llmService.ask({ systemInstruction, userPrompt });
  }

  private async chunkJsonContent(docJson: any) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 6500,
      chunkOverlap: 900,
      separators: ['\n\n', '\n', ' ', ''],
      // lengthFunction: async (text: string) => {
      //   return await this.llmService.countEmbeddingToken(text);
      // },
    });

    const fullText = JsonContentToMarkdown(docJson);
    // console.log('full text:', fullText);
    const chunks = await splitter.splitText(fullText);

    return chunks;
  }

  async embedStepContent(stepId: string) {
    await this.uow.execute(async (tx) => {
      await this.embedStepContentCore(stepId, tx);
    });
  }

  async embedStepContentCore(stepId: string, tx: any) {
    const step = await this.stepRepository.getStepById(stepId, tx);
    if (!step) throw new NotFoundError('Step not found');
    const chunks = await this.chunkJsonContent(step?.content || '');
    const result = await this.llmService.embedContent(chunks);
    const embeddings = result.embeddings;
    if (!embeddings) throw new Error('embeddings is undefined');

    const embeddingChunks: EmbeddingChunk[] = chunks.map((chunk, index) => {
      const values = embeddings[index]?.values;

      if (!values) throw new Error(`Embedding values undefined at index=${index}, stepId=${stepId}`);

      if (values.length !== 768)
        throw new Error(`Invalid embedding dimension ${values.length} at index=${index}, expected 768`);

      const normalized = l2Normalize(values);

      console.log('[Embedding normalized]', {
        index,
        chunkPreview: chunk.slice(0, 50),
        norm: Math.sqrt(normalized.reduce((s, v) => s + v * v, 0)),
        sample: normalized.slice(0, 5),
      });

      return {
        content: chunk,
        embedding: normalized,
        chunkIndex: index,
      };
    });

    await this.stepRepository.deleteStepEmbeddings(stepId, tx);
    const ids = await this.stepRepository.getRelatedIdsByStepId(stepId, tx);
    await this.stepRepository.createStepEmbeddings(
      {
        stepId,
        unitId: ids.unitId,
        sectionId: ids.sectionId,
        courseId: ids.courseId,
        embeddings: embeddingChunks,
      },
      tx
    );
  }

  // async embedStepContent(stepId: string, content: any) {
  //   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  //   const prompt =
  //     'The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.';
  //   const countTokensResponse = await this.llmService.countEmbeddingToken(prompt);
  //   return countTokensResponse;
  // }
}

interface StepLevelInput {
  lesson: {
    id: string;
    title: string;
    description?: string;
  };
  step: {
    id: string;
    title: string;
    content: any;
    position: number;
    total: number;
  };
}

interface LessonLevelInput {
  currentStepId: string;
  lesson: {
    id: string;
    title: string;
    description?: string;
  };
  steps: {
    id: string;
    title: string;
    content: any;
  }[];
}

type RagStepContextInput = {
  steps: Array<{
    id: string;
    title: string;
    content: any;
    lesson: {
      title: string;
      section: {
        title: string;
        course?: {
          title: string;
        };
      };
    };
  }>;
  currentStepId: string;
};
