import { Router } from 'express';
import { triggerExport, getExportStatus, listUserExports } from '../controllers/export.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.post('/projects/:id/export', triggerExport);
router.get('/exports/:id', getExportStatus);
router.get('/exports', listUserExports);

export default router;
