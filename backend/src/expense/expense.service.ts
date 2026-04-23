import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { RealtimeService } from 'src/realtime/realtime.service';
import { RealtimeEvents } from 'src/realtime/realtime.events';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private realtime: RealtimeService,
  ) {}

  async createExpense(
    householdId: number,
    userId: number,
    dto: CreateExpenseDto,
  ) {
    if (!householdId) {
      throw new BadRequestException('User is not associated with a household.');
    }

    if (userId !== dto.paidById) {
      throw new ForbiddenException('You can only create expenses you paid for');
    }

    // Validate paidBy user is in the same household
    const payer = await this.prisma.user.findUnique({
      where: { id: dto.paidById },
      select: { id: true, householdId: true },
    });
    if (!payer || payer.householdId !== householdId) {
      throw new BadRequestException(
        'paidById must belong to the same household.',
      );
    }

    // Validate participants are all in the same household
    const participantIds = dto.participants;
    if (!participantIds || participantIds.length === 0) {
      throw new BadRequestException('participants must be a non-empty array.');
    }

    // Ensure payer is among participants
    if (!participantIds.includes(dto.paidById)) {
      throw new BadRequestException(
        'paidById must also be included in participants.',
      );
    }

    const participants = await this.prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true, householdId: true },
    });

    const invalid = participants.find((p) => p.householdId !== householdId);
    if (invalid) {
      throw new BadRequestException(
        'All participants must belong to the same household.',
      );
    }

    const share = dto.totalAmount / participantIds.length;

    const data: Prisma.ExpenseUncheckedCreateInput = {
      description: dto.description,
      totalAmount: dto.totalAmount,
      date: dto.date ? new Date(dto.date) : undefined,
      paidById: dto.paidById,
      householdId,
      participants: {
        create: participantIds.map((userId) => ({
          userId,
          shareAmount: share,
        })),
      },
    };

    const created = await this.prisma.expense.create({
      data,
      include: { participants: true },
    });
    // Notification (fire-and-forget)
    await this.notifications.create(
      householdId,
      'created expense',
      'expense_added',
      undefined,
      userId,
      'expense',
      created.id,
      'created',
    );
    this.realtime.emitToHousehold(householdId, RealtimeEvents.EXPENSE_CREATED, {
      expense: created,
    });
    this.realtime.emitToHousehold(
      householdId,
      RealtimeEvents.EXPENSE_BALANCE_UPDATED,
      { reason: 'expenseCreated', expenseId: created.id },
    );
    return created;
  }

  async getExpenses(householdId: number) {
    if (!householdId) {
      throw new BadRequestException('householdId missing in context.');
    }
    return this.prisma.expense.findMany({
      where: { householdId },
      orderBy: { id: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, profileImage: true },
            },
          },
        },
        paidBy: {
          select: { id: true, name: true, email: true, profileImage: true },
        },
      },
    });
  }

  async getBalance(householdId: number) {
    if (!householdId) {
      throw new BadRequestException('householdId missing in context.');
    }

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

    // Get all payments for this household
    const payments = await this.prisma.payment.findMany({
      where: { householdId },
      select: { fromUserId: true, toUserId: true, amount: true },
    });

    const map = new Map<number, { paid: number; owes: number }>();
    for (const p of paid) {
      const cur = map.get(p.paidById) || { paid: 0, owes: 0 };
      cur.paid += p._sum.totalAmount || 0;
      map.set(p.paidById, cur);
    }
    for (const o of owes) {
      const cur = map.get(o.userId) || { paid: 0, owes: 0 };
      cur.owes += o._sum.shareAmount || 0;
      map.set(o.userId, cur);
    }

    // Apply payments: subtract from payer's net, add to receiver's net
    // This effectively reduces what the payer owes and reduces what the receiver is owed
    for (const payment of payments) {
      // Payer: subtract payment amount (reduces their debt, increases their net)
      const payerCur = map.get(payment.fromUserId) || { paid: 0, owes: 0 };
      payerCur.owes -= payment.amount; // Reduce what they owe
      map.set(payment.fromUserId, payerCur);

      // Receiver: subtract payment amount (reduces what they're owed, decreases their net)
      const receiverCur = map.get(payment.toUserId) || { paid: 0, owes: 0 };
      receiverCur.paid -= payment.amount; // Reduce what they're owed
      map.set(payment.toUserId, receiverCur);
    }

    const userIds = Array.from(map.keys());
    if (userIds.length === 0) {
      return [];
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u] as const));

    const result = userIds.map((id) => {
      const v = map.get(id)!;
      const u = userMap.get(id);
      return {
        userId: id,
        name: u?.name ?? null,
        email: u?.email ?? null,
        net: Number((v.paid - v.owes).toFixed(2)),
      };
    });
    return result;
  }

  /**
   * Compute minimal pairwise settlements for a household without changing the DB.
   * Uses integer units to avoid floating point errors (amounts are scaled and rounded).
   */
  async getSettlements(householdId: number) {
    if (!householdId) {
      throw new BadRequestException('householdId missing in context.');
    }

    // Reuse paid and owes aggregations
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

    // Get all payments for this household
    const payments = await this.prisma.payment.findMany({
      where: { householdId },
      select: { fromUserId: true, toUserId: true, amount: true },
    });

    // Build net per user in integer units
    const SCALE = 1; // amount subunit (e.g., cents). Adjust as needed for currency.
    const netMap = new Map<number, number>(); // userId -> net (int units)
    for (const p of paid) {
      const prev = netMap.get(p.paidById) || 0;
      const amt = Math.round((p._sum.totalAmount || 0) * SCALE);
      netMap.set(p.paidById, prev + amt);
    }
    for (const o of owes) {
      const prev = netMap.get(o.userId) || 0;
      const amt = Math.round((o._sum.shareAmount || 0) * SCALE);
      netMap.set(o.userId, prev - amt);
    }

    // Apply payments to net calculation
    // Net = paid - owes
    // When User A pays User B:
    //   - User A's "owes" decreases → net increases (add payment amount)
    //   - User B's "paid" decreases → net decreases (subtract payment amount)
    for (const payment of payments) {
      // Payer: reduce their "owes" → increase net
      const payerPrev = netMap.get(payment.fromUserId) || 0;
      netMap.set(
        payment.fromUserId,
        payerPrev + Math.round(payment.amount * SCALE),
      );

      // Receiver: reduce their "paid" → decrease net
      const receiverPrev = netMap.get(payment.toUserId) || 0;
      netMap.set(
        payment.toUserId,
        receiverPrev - Math.round(payment.amount * SCALE),
      );
    }

    // Split into creditors and debtors
    type Node = { userId: number; amount: number };
    const creditors: Node[] = [];
    const debtors: Node[] = [];
    for (const [uid, net] of netMap.entries()) {
      if (net > 0) creditors.push({ userId: uid, amount: net });
      else if (net < 0) debtors.push({ userId: uid, amount: -net });
    }

    // Sort smallest first as requested
    creditors.sort((a, b) => a.amount - b.amount);
    debtors.sort((a, b) => a.amount - b.amount);

    // Fetch user info for clarity
    const userIds = Array.from(
      new Set([
        ...creditors.map((c) => c.userId),
        ...debtors.map((d) => d.userId),
      ]),
    );
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u] as const));

    // Greedy pairing to produce minimal set of transfers
    const settlements: Array<{
      fromUserId: number;
      toUserId: number;
      amount: number; // integer units (scaled)
      fromName: string | null;
      toName: string | null;
      fromEmail: string | null;
      toEmail: string | null;
    }> = [];

    let i = 0; // debtor index
    let j = 0; // creditor index
    while (i < debtors.length && j < creditors.length) {
      const d = debtors[i];
      const c = creditors[j];
      const pay = Math.min(d.amount, c.amount);
      settlements.push({
        fromUserId: d.userId,
        toUserId: c.userId,
        amount: pay,
        fromName: userMap.get(d.userId)?.name ?? null,
        toName: userMap.get(c.userId)?.name ?? null,
        fromEmail: userMap.get(d.userId)?.email ?? null,
        toEmail: userMap.get(c.userId)?.email ?? null,
      });
      d.amount -= pay;
      c.amount -= pay;
      if (d.amount === 0) i++;
      if (c.amount === 0) j++;
    }

    // Payments are already accounted for in the net calculation above,
    // so settlements already reflect the correct remaining amounts
    return {
      scale: SCALE,
      currencyUnitNote:
        'Amounts are integers in scaled units (e.g., cents). Divide by scale to get display units.',
      settlements,
    };
  }

  async getMySettlements(householdId: number, userId: number) {
    const all = await this.getSettlements(householdId);
    const mine = all.settlements.filter(
      (s) => s.fromUserId === userId || s.toUserId === userId,
    );
    return { scale: all.scale, settlements: mine };
  }
}
