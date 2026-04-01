import { Router } from 'express';
import { getProjects, createProject, getProjectDetails, addProjectMember, removeProjectMember } from '../controllers/project.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectDetails);
router.post('/:id/members', addProjectMember);
router.delete('/:id/members/:userId', removeProjectMember);

export default router;
