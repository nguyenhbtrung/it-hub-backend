import { SALT_ROUNDS } from '@/constants/auth';
import { toFileResponseDto } from '@/dtos/file.dto';
import { CreateUserDto, GetUsersQueryDto, toUserResponseDTO, UpdateMyProfileDto, UpdateUserDto } from '@/dtos/user.dto';
import { NotFoundError } from '@/errors';
import { UnitOfWork } from '@/repositories/unitOfWork';
import { UserRepository } from '@/repositories/user.repository';
import { VerificationTokenRepository } from '@/repositories/verificationToken.repository';
import { generateRandomToken } from '@/utils/auth';
import { toAbsoluteURL } from '@/utils/file';
import bcrypt from 'bcrypt';

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private verificationTokenRepository: VerificationTokenRepository,
    private uow: UnitOfWork
  ) {}
  async getUsers(query: GetUsersQueryDto) {
    const { page = 1, limit = 10, q, sortBy, sortOrder = 'asc' } = query;
    const take = Number(limit);
    const skip = (page - 1) * limit;
    const { users, total } = await this.userRepository.getUsers(take, skip, q, sortBy, sortOrder);

    const data = users.map((user: any) => {
      const avatarUrl = user?.avatar?.url ? toAbsoluteURL(user.avatar.url) : null;
      delete user.avatar;
      return { ...user, avatarUrl };
    });
    return { data, meta: { total, page: Number(page), limit: Number(limit) } };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.getUserProfile(id);
    if (!user) throw new NotFoundError('User not found');
    return { ...user, avatar: user?.avatar ? toFileResponseDto(user.avatar) : null };
  }

  async getMyProfile(userId: string) {
    const profile = await this.userRepository.getUserProfile(userId);
    if (!profile) return null;

    return { ...profile, avatar: profile?.avatar ? toFileResponseDto(profile.avatar) : null };
  }

  async createUser(payload: CreateUserDto) {
    const { email, fullname, password, role, scope } = payload;

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.userRepository.create({
      email,
      passwordHash: hashedPassword,
      fullname,
      role,
      scope,
    });

    const verificationToken = generateRandomToken();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.verificationTokenRepository.create({
      token: verificationToken,
      user: { connect: { id: user.id } },
      expiresAt: verificationExpiresAt,
    });

    // Send verification email
    // await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return toUserResponseDTO(user);
  }

  async updateUser(userId: any, payload: UpdateUserDto) {
    const { email, fullname, role, scope, status, school, specialized, bio, githubUrl, linkedinUrl, websiteUrl } =
      payload;
    return this.uow.execute(async (tx) => {
      const user = await this.userRepository.update(
        userId,
        {
          email,
          fullname,
          role,
          scope,
          status,
        },
        tx
      );
      const profile = await this.userRepository.updateProfile(
        userId,
        {
          school,
          specialized,
          bio,
          githubUrl,
          linkedinUrl,
          websiteUrl,
        },
        tx
      );
      return { ...toUserResponseDTO(user), profile: profile };
    });
  }

  async updateMyProfile(userId: string, payload: UpdateMyProfileDto) {
    const { avatarId, fullname, school, specialized, bio, githubUrl, linkedinUrl, websiteUrl } = payload;
    return this.uow.execute(async (tx) => {
      const user = await this.userRepository.update(
        userId,
        {
          fullname,
          avatar: avatarId ? { connect: { id: avatarId } } : undefined,
        },
        tx
      );
      const profile = await this.userRepository.updateProfile(
        userId,
        {
          school,
          specialized,
          bio,
          githubUrl,
          linkedinUrl,
          websiteUrl,
        },
        tx
      );
      return { ...toUserResponseDTO(user), profile: profile };
    });
  }
}
