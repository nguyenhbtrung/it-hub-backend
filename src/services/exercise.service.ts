import { AddSubmissionDto, UpdateExerciseDto } from '@/dtos/exercise.dto';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/errors';
import { UserRole } from '@/generated/prisma/enums';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';
import { ExerciseRepository } from '@/repositories/exercise.repository';
import { FileRepository } from '@/repositories/file.repository';
import { UnitRepository } from '@/repositories/unit.repository';
import { UnitOfWork } from '@/repositories/unitOfWork';
import { diffFileIds, extractFileIdsFromContent } from '@/utils/content';

export class ExerciseService {
  constructor(
    private exerciseRepository: ExerciseRepository,
    private enrollmentRepository: EnrollmentRepository,
    private unitRepository: UnitRepository,
    private fileRepository: FileRepository,
    private uow: UnitOfWork
  ) {}

  async getExerciseByUnitId(unitId: string, userId: string, role?: UserRole) {
    const course = await this.unitRepository.getCourseByUnitId(unitId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== userId && role !== 'admin') {
      const enrollment = await this.enrollmentRepository.getEnrollment(course.id, userId);
      if (!enrollment || (enrollment.status !== 'active' && enrollment.status !== 'completed'))
        throw new ForbiddenError('Permission denied: You do not have permission to access this content.');
    }
    const exercise = await this.exerciseRepository.getExerciseByUnitId(unitId);
    return exercise;
  }

  async getExerciseSubmission(userId: string, exerciseId: string) {
    const submission = await this.exerciseRepository.getExerciseSubmission(userId, exerciseId);
    return submission;
  }

  async addSubmission(userId: string, exerciseId: string, payload: AddSubmissionDto) {
    const { score, demoUrl, note, fileIds } = payload;
    const attemp = await this.uow.execute(async (tx) => {
      const attemp = await this.exerciseRepository.addExerciseAttemp(
        {
          excercise: { connect: { id: exerciseId } },
          student: { connect: { id: userId } },
          score,
          demoUrl,
          note,
        },
        tx
      );
      if (fileIds && fileIds.length > 0) {
        await this.fileRepository.markFilesStatus(fileIds, 'active', tx);
        const attachments = await this.exerciseRepository.addAttachments(fileIds, attemp.id, tx);
        return {
          ...attemp,
          attachments,
        };
      }
      return attemp;
    });
    return attemp;
  }

  async updateExercise(unitId: string, instructorId: string, payload: UpdateExerciseDto) {
    const course = await this.unitRepository.getCourseByUnitId(unitId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenError('Permission denied: You are not the owner of this course');
    }

    let parsedQuizzes: any[] | null = null;
    if (payload.quizzes !== undefined) {
      try {
        parsedQuizzes = typeof payload.quizzes === 'string' ? JSON.parse(payload.quizzes) : payload.quizzes;

        if (!Array.isArray(parsedQuizzes)) {
          throw new BadRequestError('Quizzes must be an array');
        }
      } catch (error) {
        throw new BadRequestError('Invalid quizzes format');
      }
    }

    const currentExercise = await this.exerciseRepository.getExerciseContentByUnitId(unitId);
    if (!currentExercise) {
      throw new NotFoundError('Exercise not found');
    }
    const exerciseId = currentExercise.id;

    if (payload.content || parsedQuizzes !== null) {
      return await this.uow.execute(async (tx) => {
        if (payload.content) {
          const oldContent = currentExercise.content;
          const newContent = payload.content;
          const { removed, added } = diffFileIds(oldContent, newContent);

          if (removed.length > 0) await this.fileRepository.markFilesStatus(removed, 'unused', tx);
          if (added.length > 0) await this.fileRepository.markFilesStatus(added, 'active', tx);

          const newFileIds = extractFileIdsFromContent(newContent);
          if (newFileIds.length > 0) {
            await this.fileRepository.createOrUpdateFileUsage(newFileIds, { exerciseId }, tx);
          }
        }

        // Xử lý quizzes nếu có
        if (parsedQuizzes !== null) {
          // Xóa tất cả quizzes cũ của exercise này
          await this.exerciseRepository.deleteExerciseQuizzes(exerciseId, tx);

          // Thêm quizzes mới
          for (const quizData of parsedQuizzes) {
            // Tạo quiz mới
            const quiz = await this.exerciseRepository.createQuiz(
              {
                question: quizData.question || { type: 'doc', content: [{ type: 'paragraph' }] },
                options: quizData.options || [],
                explaination: quizData.explanation || { type: 'doc', content: [{ type: 'paragraph' }] },
              },
              tx
            );

            // Liên kết quiz với exercise
            await this.exerciseRepository.createExerciseQuiz(
              {
                excercise: { connect: { id: exerciseId } },
                quiz: { connect: { id: quiz.id } },
              },
              tx
            );
          }
        }

        const updateData = { ...payload };
        delete updateData.quizzes;

        return await this.exerciseRepository.updateExercise(unitId, updateData, tx);
      });
    }
    const updateData = { ...payload };
    delete updateData.quizzes;

    return await this.exerciseRepository.updateExercise(unitId, updateData);
  }

  async deleteSubmission(userId: string, submissionId: string) {
    const submission = await this.exerciseRepository.getExerciseAttempStudentIdAndAttachments(submissionId);
    if (!submission) throw new NotFoundError('Submission not found');
    if (submission.studentId !== userId) throw new ForbiddenError();
    const fileIds = submission.attachments.map((att) => att.fileId);
    await this.uow.execute(async (tx) => {
      await this.fileRepository.markFilesStatus(fileIds, 'unused', tx);
      await this.exerciseRepository.deleteExerciseAttemp(submissionId, tx);
    });
  }
}
