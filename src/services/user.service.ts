import { toFileResponseDto } from '@/dtos/file.dto';
import { UserRepository } from '@/repositories/user.repository';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getMyProfile(userId: string) {
    const profile = await this.userRepository.getUserProfile(userId);
    if (!profile) return null;

    return { ...profile, avatar: profile?.avatar ? toFileResponseDto(profile.avatar) : null };
  }
}
