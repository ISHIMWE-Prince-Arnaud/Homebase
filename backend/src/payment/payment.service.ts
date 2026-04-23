import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RealtimeService } from 'src/realtime/realtime.service';
import { RealtimeEvents } from 'src/realtime/realtime.events';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private realtime: RealtimeService,
  ) {}

  private async getDirectDebtAmount(
    householdId: number,
    fromUserId: number,
    toUserId: number,
  ): Promise<number> {
    // Compute minimal settlements (integer units) similar to ExpenseService.getSettlements
    const paid = await this.prisma.expense.groupBy({
      by: ['paidById'],
      where: { householdId },
      _sum: { totalAmount: true },
    });
    const expenseIds = await this.prisma.expense.findMany({
      where: { householdId },
      select: { id: true },
    });
    const ids = expenseIds.map((e) => e.id);
    const owes = ids.length
      ? await this.prisma.expenseParticipant.groupBy({
          by: ['userId'],
          where: { expenseId: { in: ids } },
          _sum: { shareAmount: true },
        })
      : ([] as Array<{ userId: number; _sum: { shareAmount: number | null } }>);

    // SCALE = 1 (integer currency units)
    const netMap = new Map<number, number>();
    for (const p of paid) {
      const prev = netMap.get(p.paidById) || 0;
      const amt = Math.round((p._sum.totalAmount || 0) * 1);
      netMap.set(p.paidById, prev + amt);
    }
    for (const o of owes) {
      const prev = netMap.get(o.userId) || 0;
      const amt = Math.round((o._sum.shareAmount || 0) * 1);
      netMap.set(o.userId, prev - amt);
    }

    // Apply existing payments already recorded
    // Payments reduce what the payer owes (increase their net) and reduce what the receiver is owed (decrease their net)
    const payments = await this.prisma.payment.findMany({
      where: { householdId },
      select: { fromUserId: true, toUserId: true, amount: true },
    });
    for (const p of payments) {
      // Payer: reduce their "owes" (increase net)
      const payerPrev = netMap.get(p.fromUserId) || 0;
      netMap.set(p.fromUserId, payerPrev + p.amount);
      
      // Receiver: reduce their "paid" (decrease net)
      const receiverPrev = netMap.get(p.toUserId) || 0;
      netMap.set(p.toUserId, receiverPrev - p.amount);
    }

    type Node = { userId: number; amount: number };
    const creditors: Node[] = [];
    const debtors: Node[] = [];
    for (const [uid, net] of netMap.entries()) {
      if (net > 0) creditors.push({ userId: uid, amount: net });
      else if (net < 0) debtors.push({ userId: uid, amount: -net });
    }
    creditors.sort((a, b) => a.amount - b.amount);
    debtors.sort((a, b) => a.amount - b.amount);

    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const d = debtors[i];
      const c = creditors[j];
      const pay = Math.min(d.amount, c.amount);
      if (d.userId === fromUserId && c.userId === toUserId) {
        return pay;
      }
      d.amount -= pay;
      c.amount -= pay;
      if (d.amount === 0) i++;
      if (c.amount === 0) j++;
    }
    return 0;
  }

  async createPayment(
    householdId: number,
    fromUserId: number,
    dto: CreatePaymentDto,
  ) {
    if (!householdId) throw new BadRequestException('householdId missing');
    const toUserId = dto.toUserId;
    const amount = dto.amount;

    if (fromUserId === toUserId) {
      throw new BadRequestException(
        'fromUserId and toUserId must be different',
      );
    }
    if (amount <= 0) throw new BadRequestException('amount must be > 0');

    // Validate both users exist and belong to same household
    const [fromUser, toUser] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: fromUserId },
        select: { id: true, householdId: true, name: true },
      }),
      this.prisma.user.findUnique({
        where: { id: toUserId },
        select: { id: true, householdId: true, name: true },
      }),
    ]);
    if (!fromUser) throw new NotFoundException('Payer user not found');
    if (!toUser) throw new NotFoundException('Receiver user not found');
    if (
      fromUser.householdId !== householdId ||
      toUser.householdId !== householdId
    ) {
      throw new ForbiddenException(
        'Both users must belong to the same household',
      );
    }

    // Optional safety: ensure amount does not exceed current direct debt
    const maxDirect = await this.getDirectDebtAmount(
      householdId,
      fromUserId,
      toUserId,
    );
    if (maxDirect <= 0) {
      throw new BadRequestException(
        'No direct debt to settle between these users',
      );
    }
    if (amount > maxDirect) {
      throw new BadRequestException('Payment exceeds the direct debt owed');
    }

    const payment = await this.prisma.payment.create({
      data: { fromUserId, toUserId, amount, householdId },
    });

    // Personal notification to receiver
    await this.notifications.create(
      householdId,
      `${fromUser.name ?? 'A member'} paid ${toUser.name ?? 'A member'} ${amount}`,
      'payment_received',
      toUserId,
    );

    // realtime events: payment recorded and balance updated
    this.realtime.emitToHousehold(
      householdId,
      RealtimeEvents.PAYMENT_RECORDED,
      { payment },
    );

    // Compute remaining direct debt between the pair after this payment
    const remainingDirectDebt = await this.getDirectDebtAmount(
      householdId,
      fromUserId,
      toUserId,
    );
    this.realtime.emitToHousehold(
      householdId,
      RealtimeEvents.EXPENSE_BALANCE_UPDATED,
      { reason: 'paymentRecorded', fromUserId, toUserId },
    );
    return { payment, remainingDirectDebt };
  }

  async getPayments(householdId: number) {
    if (!householdId) throw new BadRequestException('householdId missing');
    return this.prisma.payment.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
