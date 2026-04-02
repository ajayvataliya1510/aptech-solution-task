import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/response';
import { redis } from '../config/redis';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError(400, 'USER_EXISTS', 'A user with this email already exists.');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, email, password_hash },
    });

    res.status(201).json(successResponse({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    }));
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password.');
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Store refresh token in Redis for valid invalidation tracking
    await redis.set(`refresh_token:${user.id}:${refreshToken}`, 'active', 'EX', 7 * 24 * 60 * 60);

    res.status(200).json(successResponse({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    }));
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
    } catch (e) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token.');
    }

    const userId = payload.id;
    const tokenExists = await redis.get(`refresh_token:${userId}:${refreshToken}`);
    if (!tokenExists) {
       throw new AppError(401, 'UNAUTHORIZED', 'Refresh token has been invalidated.');
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(userId);

    // Invalidate old refresh token and store the new one
    await redis.del(`refresh_token:${userId}:${refreshToken}`);
    await redis.set(`refresh_token:${userId}:${newRefreshToken}`, 'active', 'EX', 7 * 24 * 60 * 60);

    res.status(200).json(successResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }));
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
      await redis.del(`refresh_token:${payload.id}:${refreshToken}`);
    } catch (e) {
       // Token invalid or expired, just ignore because we want it dropped anyway
    }

    res.status(200).json(successResponse({ message: 'Logged out successfully' }));
  } catch (error) {
    next(error);
  }
};
