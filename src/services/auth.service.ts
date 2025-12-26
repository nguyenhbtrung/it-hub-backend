import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '@/generated/prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';
import { VerificationTokenRepository } from '../repositories/verificationToken.repository';
import { PasswordResetTokenRepository } from '../repositories/passwordResetToken.repository';
import { EmailService } from './email.service';
import { ConflictError, UnauthorizedError, BadRequestError, NotFoundError } from '../errors';
import { toUserResponseDTO, UserResponseDTO } from '../dtos/user.dto';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private refreshTokenRepository: RefreshTokenRepository,
    private verificationTokenRepository: VerificationTokenRepository,
    private passwordResetTokenRepository: PasswordResetTokenRepository,
    private emailService: EmailService
  ) {}

  async register(
    email: string,
    password: string,
    name?: string
  ): Promise<{ user: UserResponseDTO; accessToken: string; refreshToken: string }> {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    // Generate verification token
    const verificationToken = this.generateRandomToken();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.verificationTokenRepository.create({
      token: verificationToken,
      user: { connect: { id: user.id } },
      expiresAt: verificationExpiresAt,
    });

    // Send verification email
    // await this.emailService.sendVerificationEmail(user.email, verificationToken);

    // Generate tokens
    const tokens = await this.generateTokenPair(user.id, user.email);

    return {
      user: toUserResponseDTO(user),
      ...tokens,
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: UserResponseDTO; accessToken: string; refreshToken: string }> {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const tokens = await this.generateTokenPair(user.id, user.email);

    return {
      user: toUserResponseDTO(user),
      ...tokens,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    // Find refresh token in database
    const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.deleteByToken(refreshToken);
      throw new UnauthorizedError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
    }

    // Verify JWT
    try {
      jwt.verify(refreshToken, process.env.JWT_SECRET!);
    } catch (error) {
      await this.refreshTokenRepository.deleteByToken(refreshToken);
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Generate new token pair
    const tokens = await this.generateTokenPair(storedToken.userId, storedToken.user.email);

    // Delete old refresh token
    await this.refreshTokenRepository.deleteByToken(refreshToken);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.deleteByToken(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepository.deleteAllByUserId(userId);
  }

  async verifyEmail(token: string): Promise<UserResponseDTO> {
    const verificationToken = await this.verificationTokenRepository.findByToken(token);

    if (!verificationToken) {
      throw new BadRequestError('Invalid verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      await this.verificationTokenRepository.deleteByUserId(verificationToken.userId);
      throw new BadRequestError('Verification token expired');
    }

    // Update user
    const user = await this.userRepository.verifyEmail(verificationToken.userId);

    // Delete verification token
    await this.verificationTokenRepository.deleteByUserId(verificationToken.userId);

    return toUserResponseDTO(user);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestError('Email already verified');
    }

    // Delete old verification token if exists
    try {
      await this.verificationTokenRepository.deleteByUserId(user.id);
    } catch (error) {
      // Token might not exist, continue
    }

    // Generate new verification token
    const verificationToken = this.generateRandomToken();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.verificationTokenRepository.create({
      token: verificationToken,
      user: { connect: { id: user.id } },
      expiresAt: verificationExpiresAt,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, verificationToken);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    // Don't reveal if user exists (security best practice)
    if (!user) {
      return;
    }

    // Delete old reset token if exists
    try {
      await this.passwordResetTokenRepository.deleteByUserId(user.id);
    } catch (error) {
      // Token might not exist, continue
    }

    // Generate reset token
    const resetToken = this.generateRandomToken();
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.passwordResetTokenRepository.create({
      token: resetToken,
      user: { connect: { id: user.id } },
      expiresAt: resetExpiresAt,
    });

    // Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.passwordResetTokenRepository.findByToken(token);

    if (!resetToken) {
      throw new BadRequestError('Invalid reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      await this.passwordResetTokenRepository.deleteByUserId(resetToken.userId);
      throw new BadRequestError('Reset token expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await this.userRepository.updatePassword(resetToken.userId, hashedPassword);

    // Delete reset token
    await this.passwordResetTokenRepository.deleteByUserId(resetToken.userId);

    // Invalidate all refresh tokens for security
    await this.refreshTokenRepository.deleteAllByUserId(resetToken.userId);
  }

  private async generateTokenPair(userId: string, email: string): Promise<TokenPair> {
    // Generate access token
    const accessToken = jwt.sign({ id: userId, email }, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });

    // Generate refresh token
    const refreshToken = jwt.sign({ id: userId, email, type: 'refresh' }, process.env.JWT_SECRET!, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    // Store refresh token in database
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.refreshTokenRepository.create({
      token: refreshToken,
      user: { connect: { id: userId } },
      expiresAt: refreshExpiresAt,
    });

    return { accessToken, refreshToken };
  }

  private generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
