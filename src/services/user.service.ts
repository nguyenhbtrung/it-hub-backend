import { toFileResponseDto } from '@/dtos/file.dto';
import { toUserResponseDTO, UpdateMyProfileDto } from '@/dtos/user.dto';
import { UserRepository } from '@/repositories/user.repository';

export class UserService {
  constructor(private userRepository: UserRepository) {}

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
