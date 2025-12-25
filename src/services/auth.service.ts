import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@/generated/prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { SignJWT } from 'jose';

const SALT_ROUNDS = 12;

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(
    email: string,
    password: string,
    name?: string
  ): Promise<{ user: Omit<User, 'password'>; token: string }> {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    // Generate token
    const token = await this.generateToken(user.id, user.email);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async login(email: string, password: string): Promise<{ user: Omit<User, 'password'>; token: string }> {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = await this.generateToken(user.id, user.email);

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  private async generateToken(userId: string, email: string): Promise<string> {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new SignJWT({ id: userId, email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
      .sign(secret);
    return token;
  }

  async verifyToken(token: string): Promise<{ id: string; email: string }> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string };
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
