import { Router } from 'express';
import { authenticate, requireRole } from '../../shared/auth';
import * as controller from './controller';

const router = Router();

router.get('/api/markets', controller.listMarkets);
router.get('/api/markets/:id', controller.getMarket);
router.post('/api/markets', authenticate, requireRole('ADMIN'), controller.createMarket);
router.patch('/api/markets/:id', authenticate, requireRole('ADMIN'), controller.updateMarket);
router.delete('/api/markets/:id', authenticate, requireRole('ADMIN'), controller.deleteMarket);

router.get('/api/users', authenticate, requireRole('ADMIN'), controller.listUsers);
router.patch('/api/users/:id/role', authenticate, requireRole('ADMIN'), controller.updateUserRole);

export default router;
