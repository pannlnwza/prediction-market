import { Router } from 'express';
import { authenticate } from '../../shared/auth';
import * as controller from './controller';

const router = Router();

router.post('/api/auth/register', controller.register);
router.post('/api/auth/login', controller.login);
router.get('/api/auth/me', authenticate, controller.getMe);

export default router;
