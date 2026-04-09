import { Router } from 'express';
import { authenticate, requireServiceKey } from '../../shared/auth';
import * as controller from './controller';

const router = Router();

// Internal endpoints (called by other services)
router.post('/api/notifications', requireServiceKey, controller.createNotification);
router.post('/api/notifications/broadcast/price', requireServiceKey, controller.broadcastPriceUpdate);
router.post('/api/notifications/broadcast/orderbook', requireServiceKey, controller.broadcastOrderBookUpdate);
router.post('/api/notifications/broadcast/trade', requireServiceKey, controller.broadcastTradeEvent);

// User-facing endpoints
router.get('/api/notifications', authenticate, controller.listNotifications);
router.patch('/api/notifications/read-all', authenticate, controller.markAllAsRead);
router.patch('/api/notifications/:id/read', authenticate, controller.markAsRead);

export default router;
