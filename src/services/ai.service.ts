import { AskAiStepDto } from '@/dtos/ai.dto';
import { StepRepository } from '@/repositories/step.repository';
import { jsonContentToText } from '@/utils/content';
import { LlmService } from './llm.service';

export class AiService {
  constructor(
    private stepRepository: StepRepository,
    private llmService: LlmService
  ) {}

  private normalizeText(text: string): string {
    return text
      .replace(/\n{3,}/g, '\n\n') // tối đa 2 dòng trống
      .trim();
  }

  private buildStepContextMarkdown(data: StepLevelInput): string {
    const { lesson, step } = data;

    const stepText = this.normalizeText(jsonContentToText(step.content));

    return this.normalizeText(`
# Step: ${step.title}

## Position in lesson
Lesson: ${lesson.title}
Step: ${step.position} / ${step.total}

---

## Step Content
${stepText}
`);
  }

  private buildLessonContextMarkdown(data: LessonLevelInput): string {
    const { lesson, steps, currentStepId } = data;

    const header = `
# Lesson: ${lesson.title}

${lesson.description ?? ''}
`;

    const stepSections = steps.map((step, index) => {
      const isCurrent = step.id === currentStepId;

      const stepText = this.normalizeText(jsonContentToText(step.content));

      return this.normalizeText(`
---

## Step ${index + 1}: ${step.title}
${isCurrent ? '▶ **CURRENT STEP**\n' : ''}
${stepText}
`);
    });

    return this.normalizeText([header, stepSections.join('\n\n')].join('\n\n'));
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
    mode?: string;
  }) {
    const { context, question, focus, flexibility, mode } = params;

    return `
Flexibility level: ${flexibility}

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

  async AskAiStep(userId: string, payload: AskAiStepDto) {
    const { stepId, scope, question, selectedText, conversationId, mode, flexibility = 'GUIDED' } = payload;
    const contextData = await this.stepRepository.getStepContextData(stepId, scope);
    const context =
      scope === 'step'
        ? this.buildStepContextMarkdown(contextData as StepLevelInput)
        : this.buildLessonContextMarkdown(contextData as LessonLevelInput);
    const focus = this.buildFocus(question, selectedText);
    const systemInstruction = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt({ context, question, focus, mode, flexibility });
    return this.llmService.ask({ systemInstruction, userPrompt });
  }
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
