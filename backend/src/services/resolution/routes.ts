import { Router } from 'express';
import { authenticate, requireRole } from '../../shared/auth';
import * as controller from './controller';

const router = Router();

router.post('/api/resolutions/:marketId', authenticate, requireRole('RESOLVER'), controller.resolveMarket);
router.get('/api/resolutions/:marketId', controller.getResolution);

export default router;
