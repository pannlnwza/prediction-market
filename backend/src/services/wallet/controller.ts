import { Request, Response, NextFunction } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../shared/prisma';
import { AppError } from '../../shared/errors';

export async function getBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
    }

    res.json({ balance: wallet.balance });
  } catch (error) {
    next(error);
  }
}

export async function deposit(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError(400, 'Amount must be greater than 0', 'VALIDATION_ERROR');
    }

    const wallet = await prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { userId: req.user!.id },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: updated.id,
          type: 'DEPOSIT',
          amount,
          description: `Deposit of $${amount}`,
        },
      });

      return updated;
    });

    res.json({ balance: wallet.balance });
  } catch (error) {
    next(error);
  }
}

export async function withdraw(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError(400, 'Amount must be greater than 0', 'VALIDATION_ERROR');
    }

    const wallet = await prisma.$transaction(async (tx) => {
      const current = await tx.wallet.findUnique({ where: { userId: req.user!.id } });
      if (!current) {
        throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
      }

      if (new Decimal(current.balance).lessThan(amount)) {
        throw new AppError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');
      }

      const updated = await tx.wallet.update({
        where: { userId: req.user!.id },
        data: { balance: { decrement: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: updated.id,
          type: 'WITHDRAWAL',
          amount,
          description: `Withdrawal of $${amount}`,
        },
      });

      return updated;
    });

    res.json({ balance: wallet.balance });
  } catch (error) {
    next(error);
  }
}

export async function listTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) {
      throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
}

export async function lockEscrow(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, orderId, amount } = req.body;

    if (!userId || !orderId || !amount) {
      throw new AppError(400, 'userId, orderId, and amount are required', 'VALIDATION_ERROR');
    }

    const escrow = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        throw new AppError(404, 'Wallet not found', 'NOT_FOUND');
      }

      if (new Decimal(wallet.balance).lessThan(amount)) {
        throw new AppError(400, 'Insufficient balance for escrow', 'INSUFFICIENT_BALANCE');
      }

      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      const created = await tx.escrow.create({
        data: { walletId: wallet.id, orderId, amount },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'ESCROW_LOCK',
          amount,
          referenceId: orderId,
          description: `Escrow lock for order ${orderId}`,
        },
      });

      return created;
    });

    res.status(201).json(escrow);
  } catch (error) {
    next(error);
  }
}

export async function releaseEscrow(req: Request, res: Response, next: NextFunction) {
  try {
    const { escrowId, winnerUserId, amount } = req.body;

    if (!escrowId || !winnerUserId || !amount) {
      throw new AppError(400, 'escrowId, winnerUserId, and amount are required', 'VALIDATION_ERROR');
    }

    await prisma.$transaction(async (tx) => {
      const escrow = await tx.escrow.findUnique({ where: { id: escrowId } });
      if (!escrow || escrow.status !== 'LOCKED') {
        throw new AppError(400, 'Escrow not found or not locked', 'INVALID_ESCROW');
      }

      await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'RELEASED' },
      });

      const winnerWallet = await tx.wallet.findUnique({ where: { userId: winnerUserId } });
      if (!winnerWallet) {
        throw new AppError(404, 'Winner wallet not found', 'NOT_FOUND');
      }

      await tx.wallet.update({
        where: { userId: winnerUserId },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: winnerWallet.id,
          type: 'ESCROW_RELEASE',
          amount,
          referenceId: escrowId,
          description: `Escrow release from ${escrowId}`,
        },
      });
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function refundEscrow(req: Request, res: Response, next: NextFunction) {
  try {
    const { marketId } = req.body;

    if (!marketId) {
      throw new AppError(400, 'marketId is required', 'VALIDATION_ERROR');
    }

    await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({ where: { marketId } });
      const orderIds = orders.map((o) => o.id);

      const escrows = await tx.escrow.findMany({
        where: { orderId: { in: orderIds }, status: 'LOCKED' },
        include: { wallet: true },
      });

      for (const escrow of escrows) {
        await tx.wallet.update({
          where: { id: escrow.walletId },
          data: { balance: { increment: escrow.amount } },
        });

        await tx.escrow.update({
          where: { id: escrow.id },
          data: { status: 'REFUNDED' },
        });

        await tx.transaction.create({
          data: {
            walletId: escrow.walletId,
            type: 'REFUND',
            amount: escrow.amount,
            referenceId: escrow.id,
            description: `Escrow refund for voided market ${marketId}`,
          },
        });
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function payout(req: Request, res: Response, next: NextFunction) {
  try {
    const { marketId, winningOptionId } = req.body;

    if (!marketId || !winningOptionId) {
      throw new AppError(400, 'marketId and winningOptionId are required', 'VALIDATION_ERROR');
    }

    await prisma.$transaction(async (tx) => {
      const winningPositions = await tx.position.findMany({
        where: { marketId, optionId: winningOptionId, quantity: { gt: 0 } },
        include: { user: { include: { wallet: true } } },
      });

      for (const position of winningPositions) {
        const payoutAmount = new Decimal(1).times(position.quantity);
        const wallet = position.user.wallet;
        if (!wallet) continue;

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: payoutAmount } },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'PAYOUT',
            amount: payoutAmount,
            referenceId: marketId,
            description: `Payout for market ${marketId}: ${position.quantity} shares at $1.00`,
          },
        });
      }

      const orders = await tx.order.findMany({ where: { marketId } });
      const orderIds = orders.map((o) => o.id);
      await tx.escrow.updateMany({
        where: { orderId: { in: orderIds }, status: 'LOCKED' },
        data: { status: 'RELEASED' },
      });
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
