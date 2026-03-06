import { CourseRepository } from '@/repositories/course.repository';
import { EnrollmentRepository } from '@/repositories/enrollment.repository';

export class DashboardService {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private courseRepository: CourseRepository
  ) {}
  async getInstructorDashboardSummary(userId: string) {
    const [newStudents, activeCourses, activeStudents, averageRating] = await Promise.all([
      this.enrollmentRepository.countNewStudentsThisMonthByInstructorId(userId),
      this.courseRepository.countCoursesByInstructorId(userId, 'published'),
      this.enrollmentRepository.countActiveStudentbyInstructorId(userId),
      this.courseRepository.getCoursesAverageRatingByInstructorId(userId),
    ]);
    return {
      newStudents,
      activeCourses,
      activeStudents,
      averageRating,
    };
  }
}
