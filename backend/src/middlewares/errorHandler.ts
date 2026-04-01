import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { errorResponse } from '../utils/response';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(errorResponse(err.code, err.message));
  }

  if (err instanceof ZodError) {
    const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json(errorResponse('VALIDATION_ERROR', message));
  }

  console.error('[Unhandled Error]:', err);
  return res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'));
};
