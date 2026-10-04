import type { NextFunction, Request, Response } from 'express';
import { Project } from '../features/project/project.model';
import { ApiError } from '../utils/ApiError';

export async function requireProjectMember(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const user = req.user;

  if (!user) {
    next(ApiError.unauthorized('Authentication required'));
    return;
  }

  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) {
      next(ApiError.notFound('Project not found'));
      return;
    }

    const isMember =
      user.permissions?.includes('projects:manage') ||
      project.createdBy?.toString() === user.id ||
      project.members?.some((m: any) => m.userId?.toString() === user.id);

    if (!isMember) {
      next(ApiError.forbidden('Only project members can manage members'));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}