import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../shared/prisma';
import { AppError } from '../../shared/errors';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '24h';

function signToken(user: { id: string; email: string; role: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: TOKEN_EXPIRY });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      throw new AppError(400, 'Email, password, and displayName are required', 'VALIDATION_ERROR');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'Email already registered', 'DUPLICATE_EMAIL');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email, passwordHash, displayName },
      });
      await tx.wallet.create({
        data: { userId: created.id },
      });
      return created;
    });

    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required', 'VALIDATION_ERROR');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, displayName: true, role: true, createdAt: true },
    });

    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}
