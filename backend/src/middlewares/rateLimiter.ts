import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/response';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  handler: (req, res) => {
    res.status(429).json(errorResponse('RATE_LIMIT_EXCEEDED', 'Too many login attempts. Please try again later.'));
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  handler: (req, res) => {
    res.status(429).json(errorResponse('RATE_LIMIT_EXCEEDED', 'Too many registration attempts. Please try again later.'));
  },
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  handler: (req, res) => {
    res.status(429).json(errorResponse('RATE_LIMIT_EXCEEDED', 'Too many refresh attempts. Please try again later.'));
  },
});
