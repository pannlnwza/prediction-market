import { Router } from 'express';
import { authenticate } from '../../shared/auth';
import * as controller from './controller';

const router = Router();

router.post('/api/orders', authenticate, controller.placeOrder);
router.get('/api/orders', authenticate, controller.listOrders);
router.get('/api/orders/:id', authenticate, controller.getOrder);
router.delete('/api/orders/:id', authenticate, controller.cancelOrder);

router.get('/api/markets/:id/orderbook', controller.getOrderBook);
router.get('/api/markets/:id/trades', controller.getTradeHistory);

router.get('/api/portfolio', authenticate, controller.getPortfolio);
router.get('/api/portfolio/:marketId', authenticate, controller.getMarketPosition);

export default router;
