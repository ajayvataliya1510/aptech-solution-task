import { Request, Response, NextFunction } from 'express';
import { Queue } from 'bullmq';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/response';
import { env } from '../config/env';

const exportQueue = new Queue('ExportQueue', { connection: { url: env.REDIS_URL } });

export const triggerExport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const projectId = req.params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');

    if (project.owner_id !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'Only the project owner can trigger exports');
    }

    const exportRecord = await prisma.export.create({
      data: {
        project_id: projectId,
        user_id: userId,
        status: 'pending',
      }
    });

    await exportQueue.add('export-project', {
      exportId: exportRecord.id,
      projectId,
      userId
    }, {
      attempts: 3, // Initial + 2 automatic retries
      backoff: { type: 'exponential', delay: 1000 }
    });

    res.status(202).json(successResponse({ exportId: exportRecord.id }));
  } catch (error) {
    next(error);
  }
};

export const getExportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const exportId = req.params.id;

    const exportRecord = await prisma.export.findUnique({ where: { id: exportId } });

    if (!exportRecord) throw new AppError(404, 'NOT_FOUND', 'Export record not found');

    // Make sure owner who created it or someone from the project can check it.
    // The spec says "Check export status, return download link if ready". Assuming owner/member.
    // Usually only the user who triggered it, let's keep it safe.
    if (exportRecord.user_id !== userId) {
       throw new AppError(403, 'FORBIDDEN', 'You do not have permission to view this export');
    }

    res.status(200).json(successResponse({
      id: exportRecord.id,
      status: exportRecord.status,
      file_path: exportRecord.file_path,
    }));
  } catch (error) {
    next(error);
  }
};

export const listUserExports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const exports = await prisma.export.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json(successResponse(exports));
  } catch (error) {
    next(error);
  }
};
