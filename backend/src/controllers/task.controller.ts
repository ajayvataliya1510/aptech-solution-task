import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/response';
import { redis } from '../config/redis';

const listTasksQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});

const createTaskSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  assigned_to: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

// Helper for RBAC on a task's project
const verifyProjectAccess = async (projectId: string, userId: string, requireOwner = false) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true }
  });

  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');

  const isOwner = project.owner_id === userId;
  const isMember = project.members.some((m: any) => m.user_id === userId);

  if (requireOwner && !isOwner) {
    throw new AppError(403, 'FORBIDDEN', 'Only the project owner can perform this action');
  }

  if (!isOwner && !isMember) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this project');
  }

  return project;
};

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { project_id, status, priority, page, limit } = listTasksQuerySchema.parse(req.query);

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);

    const where: any = {};
    if (project_id) {
       await verifyProjectAccess(project_id, userId);
       where.project_id = project_id;
    } else {
       // If no project_id provided, filter tasks to those the user has access to
       where.project = {
         OR: [
           { owner_id: userId },
           { members: { some: { user_id: userId } } }
         ]
       };
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const total = await prisma.task.count({ where });
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } }
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { created_at: 'desc' }
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json(successResponse(tasks, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    }));
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const body = createTaskSchema.parse(req.body);

    await verifyProjectAccess(body.project_id, userId);

    const task = await prisma.task.create({
      data: {
        project_id: body.project_id,
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        assigned_to: body.assigned_to,
        due_date: body.due_date ? new Date(body.due_date) : null,
      }
    });

    await redis.del(`project:${body.project_id}`);

    res.status(201).json(successResponse(task));
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id;
    const body = updateTaskSchema.parse(req.body);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found');

    await verifyProjectAccess(task.project_id, userId);

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        assigned_to: body.assigned_to,
        due_date: body.due_date ? new Date(body.due_date) : body.due_date === null ? null : undefined,
      }
    });

    await redis.del(`project:${task.project_id}`);

    res.status(200).json(successResponse(updatedTask));
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found');

    await verifyProjectAccess(task.project_id, userId, true);

    await prisma.task.delete({ where: { id: taskId } });

    await redis.del(`project:${task.project_id}`);

    res.status(200).json(successResponse({ message: 'Task deleted successfully' }));
  } catch (error) {
    next(error);
  }
};
