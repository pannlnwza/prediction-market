import { Router } from 'express';
import { authenticate, requireServiceKey } from '../../shared/auth';
import * as controller from './controller';

const router = Router();

router.get('/api/wallet', authenticate, controller.getBalance);
router.post('/api/wallet/deposit', authenticate, controller.deposit);
router.post('/api/wallet/withdraw', authenticate, controller.withdraw);
router.get('/api/wallet/transactions', authenticate, controller.listTransactions);

router.post('/api/wallet/escrow/lock', requireServiceKey, controller.lockEscrow);
router.post('/api/wallet/escrow/release', requireServiceKey, controller.releaseEscrow);
router.post('/api/wallet/escrow/refund', requireServiceKey, controller.refundEscrow);
router.post('/api/wallet/payout', requireServiceKey, controller.payout);

export default router;
