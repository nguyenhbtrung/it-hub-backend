import { toFileResponseDto } from '@/dtos/file.dto';
import { GetUsersQueryDto, toUserResponseDTO, UpdateMyProfileDto } from '@/dtos/user.dto';
import { UserRepository } from '@/repositories/user.repository';
import { toAbsoluteURL } from '@/utils/file';

export class UserService {
  constructor(private userRepository: UserRepository) {}
  async getUser(query: GetUsersQueryDto) {
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

  async getMyProfile(userId: string) {
    const profile = await this.userRepository.getUserProfile(userId);
    if (!profile) return null;

    return { ...profile, avatar: profile?.avatar ? toFileResponseDto(profile.avatar) : null };
  }

  async updateMyProfile(userId: string, payload: UpdateMyProfileDto) {
    const { avatarId, fullname, school, specialized, bio, githubUrl, linkedinUrl, websiteUrl } = payload;
    const user = await this.userRepository.update(userId, {
      fullname,
      avatar: avatarId ? { connect: { id: avatarId } } : undefined,
    });
    const profile = await this.userRepository.updateProfile(userId, {
      school,
      specialized,
      bio,
      githubUrl,
      linkedinUrl,
      websiteUrl,
    });
    return { ...toUserResponseDTO(user), profile: profile };
  }
}
