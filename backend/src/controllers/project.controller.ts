import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/response';
import { redis } from '../config/redis';

// Query validation parameters
const listProjectsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
});

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { page, limit } = listProjectsQuerySchema.parse(req.query);
    
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);

    const cacheKey = `projects:user:${userId}`;
    const cachedData = await redis.get(cacheKey);

    // Normally we should also cache page queries implicitly, but spec says "User's project list: projects:user:{userId}"
    // Assuming caching handles the first page, or caching stores all and then slices. 
    // To be precise with paginated cache, we could cache the exact page, but adhering simply:
    const specificCacheKey = `${cacheKey}:page:${pageNum}:limit:${limitNum}`;
    const cachedPageData = await redis.get(specificCacheKey);

    if (cachedPageData) {
       return res.status(200).json(JSON.parse(cachedPageData));
    }

    const whereClause = {
      OR: [
        { owner_id: userId },
        { members: { some: { user_id: userId } } }
      ]
    };

    const total = await prisma.project.count({ where: whereClause });
    const projects = await prisma.project.findMany({
      where: whereClause,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        _count: {
          select: { members: true, tasks: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const totalPages = Math.ceil(total / limitNum);

    const response = successResponse(projects, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    });

    // Cache list for 5 minutes
    await redis.set(specificCacheKey, JSON.stringify(response), 'EX', 5 * 60);
    // Also store a set of cache keys for invalidation tracking
    await redis.sadd(`${cacheKey}:keys`, specificCacheKey);
    await redis.expire(`${cacheKey}:keys`, 5 * 60);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, description } = createProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name,
        description,
        owner_id: userId,
      }
    });

    // Invalidate project list cache for the owner
    const keys = await redis.smembers(`projects:user:${userId}:keys`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.status(201).json(successResponse(project));
  } catch (error) {
    next(error);
  }
};

export const getProjectDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const projectId = req.params.id;

    const cacheKey = `project:${projectId}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const data = JSON.parse(cachedData);
      // Validate RBAC briefly before returning cache
      const isAllowed = data.owner_id === userId || data.members.some((m: any) => m.user_id === userId);
      if (!isAllowed) {
        throw new AppError(403, 'FORBIDDEN', 'You do not have access to this project');
      }
      return res.status(200).json(successResponse(data));
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: true,
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    if (!project) {
        throw new AppError(404, 'NOT_FOUND', 'Project not found');
    }

    const isAllowed = project.owner_id === userId || project.members.some((m: any) => m.user_id === userId);
    if (!isAllowed) {
        throw new AppError(403, 'FORBIDDEN', 'You do not have access to this project');
    }

    // Cache Project data for 2 minutes
    await redis.set(cacheKey, JSON.stringify(project), 'EX', 2 * 60);

    res.status(200).json(successResponse(project));
  } catch (error) {
    next(error);
  }
};

export const addProjectMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const projectId = req.params.id;
    const { email } = addMemberSchema.parse(req.body);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');

    if (project.owner_id !== userId) {
       throw new AppError(403, 'FORBIDDEN', 'Only the owner can add members');
    }

    const memberUser = await prisma.user.findUnique({ where: { email } });
    if (!memberUser) throw new AppError(404, 'NOT_FOUND', 'User with email not found');

    if (memberUser.id === userId) {
        throw new AppError(400, 'BAD_REQUEST', 'Cannot add owner as a member');
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: projectId, user_id: memberUser.id } }
    });

    if (existingMember) {
      throw new AppError(400, 'BAD_REQUEST', 'User is already a member');
    }

    await prisma.projectMember.create({
      data: {
        project_id: projectId,
        user_id: memberUser.id,
        role: 'member'
      }
    });

    // Cache Invalidation
    await redis.del(`project:${projectId}`);
    const keys = await redis.smembers(`projects:user:${memberUser.id}:keys`);
    if (keys.length > 0) await redis.del(...keys);

    res.status(201).json(successResponse({ message: 'Member added successfully' }));
  } catch(error) {
    next(error);
  }
}

export const removeProjectMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const projectId = req.params.id;
    const memberIdToRemove = req.params.userId;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found');

    if (project.owner_id !== userId) {
       throw new AppError(403, 'FORBIDDEN', 'Only the owner can remove members');
    }

    const membership = await prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: projectId, user_id: memberIdToRemove } }
    });

    if (!membership) {
        throw new AppError(404, 'NOT_FOUND', 'Member not found in project');
    }

    await prisma.projectMember.delete({
      where: { id: membership.id }
    });

    // Cache Invalidation
    await redis.del(`project:${projectId}`);
    const keys = await redis.smembers(`projects:user:${memberIdToRemove}:keys`);
    if (keys.length > 0) await redis.del(...keys);

    res.status(200).json(successResponse({ message: 'Member removed successfully' }));
  } catch(error) {
    next(error);
  }
};
