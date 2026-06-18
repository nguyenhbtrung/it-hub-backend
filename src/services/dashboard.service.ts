import { CourseRepository, EnrollmentRepository, UserRepository } from '@/repositories';
import { toAbsoluteURL } from '@/utils/file';
import { Injectable } from '@ntrg/simple-di';

@Injectable()
export class DashboardService {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private courseRepository: CourseRepository,
    private userRepository: UserRepository
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

  async getStudentGrowthOfInstructor(userId: string) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);

    const enrollments = await this.enrollmentRepository.getEnrollmentsOfInstructorFromDate(userId, startDate);

    const map = new Map<string, number>();

    for (const enrollment of enrollments) {
      const date = enrollment.createdAt;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

      map.set(key, (map.get(key) || 0) + 1);
    }

    const result = [];

    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate);
      d.setMonth(startDate.getMonth() + i);

      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      result.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        students: map.get(key) || 0,
      });
    }

    return result;
  }

  async getRecentActivitiesOfInstructor(userId: string, limit = 10) {
    const enrollments = await this.enrollmentRepository.getRecentEnrollmentsByInstructorId(userId, limit);

    return enrollments.map((enrollment) => ({
      studentName: enrollment.user.fullname || 'Học viên',
      avatar: enrollment.user.avatar ? toAbsoluteURL(enrollment.user.avatar.url) : null,
      courseTitle: enrollment.course.title,
      createdAt: enrollment.createdAt,
    }));
  }

  async getAdminDashboardSummary() {
    const now = new Date();

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalStudents,
      studentsLastMonth,
      totalCourses,
      pendingCourses,
      instructorSignupsThisMonth,
      activeInstructors,
      activeInstructorsLastMonth,
    ] = await Promise.all([
      this.enrollmentRepository.countTotalStudents(),

      this.enrollmentRepository.countStudentsFromDate(startOfLastMonth),

      this.courseRepository.countAllCourses(),

      this.courseRepository.countCoursesByStatus('pending'),

      this.userRepository.countInstructorApplicationsFromDate(startOfThisMonth),

      this.userRepository.countActiveInstructors(),

      this.userRepository.countActiveInstructorsFromDate(startOfLastMonth),
    ]);

    const studentGrowth = studentsLastMonth === 0 ? 0 : ((totalStudents - studentsLastMonth) / studentsLastMonth) * 100;

    const instructorGrowth =
      activeInstructorsLastMonth === 0
        ? 0
        : ((activeInstructors - activeInstructorsLastMonth) / activeInstructorsLastMonth) * 100;

    return {
      totalStudents: {
        value: totalStudents,
        growth: Number(studentGrowth.toFixed(1)),
      },

      totalCourses: {
        value: totalCourses,
        pending: pendingCourses,
      },

      instructorSignupsThisMonth,

      activeInstructors: {
        value: activeInstructors,
        growth: Number(instructorGrowth.toFixed(1)),
      },
    };
  }

  async getCourseRegistrationGrowthOfAdmin() {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);

    const enrollments = await this.enrollmentRepository.getEnrollmentsFromDate(startDate);

    const map = new Map<string, number>();

    for (const enrollment of enrollments) {
      const date = enrollment.createdAt;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

      map.set(key, (map.get(key) || 0) + 1);
    }

    const result = [];

    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate);
      d.setMonth(startDate.getMonth() + i);

      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      result.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        enrollments: map.get(key) || 0,
      });
    }

    return result;
  }

  async getUserGrowthOfAdmin() {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);

    const users = await this.userRepository.getUsersFromDate(startDate);

    const map = new Map<string, number>();

    for (const user of users) {
      const date = user.createdAt;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

      map.set(key, (map.get(key) || 0) + 1);
    }

    const result = [];

    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate);
      d.setMonth(startDate.getMonth() + i);

      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      result.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        users: map.get(key) || 0,
      });
    }

    return result;
  }
}
