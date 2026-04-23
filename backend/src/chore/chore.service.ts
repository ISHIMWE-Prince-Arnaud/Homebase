import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateChoreDto } from './dto/create-chore.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateChoreDto } from './dto/update-chore.dto';
import { RealtimeService } from 'src/realtime/realtime.service';
import { RealtimeEvents } from 'src/realtime/realtime.events';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class ChoreService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
    private notifications: NotificationService,
  ) {}

  async getChoresByHousehold(householdId: number) {
    return this.prisma.chore.findMany({
      where: { householdId },
      include: { assignedTo: true },
    });
  }

  async createChore(householdId: number, userId: number, dto: CreateChoreDto) {
    if (dto.assignedToId !== undefined) {
      const assigned = await this.prisma.user.findUnique({
        where: { id: dto.assignedToId },
        select: { id: true, householdId: true },
      });
      if (!assigned || assigned.householdId !== householdId) {
        throw new BadRequestException(
          'Assigned user must belong to the same household.',
        );
      }
    }
    const data: Prisma.ChoreUncheckedCreateInput = {
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      householdId,
      assignedToId: dto.assignedToId,
    };
    const created = await this.prisma.chore.create({
      data,
      include: { assignedTo: true },
    });
    // Notification if assigned to a user
    if (dto.assignedToId) {
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      await this.notifications.create(
        householdId,
        `${actor?.name ?? 'A member'} assigned you chore: ${dto.title}`,
        'chore_assigned',
        dto.assignedToId,
      );
    }
    this.realtime.emitToHousehold(householdId, RealtimeEvents.CHORE_CREATED, {
      chore: created,
    });
    return created;
  }

  async markComplete(choreId: number, householdId: number) {
    const res = await this.prisma.chore.updateMany({
      where: { id: choreId, householdId },
      data: { isComplete: true },
    });
    if (res.count === 0) {
      throw new NotFoundException('Chore not found.');
    }
    this.realtime.emitToHousehold(householdId, RealtimeEvents.CHORE_COMPLETED, {
      choreId,
    });
    return res;
  }

  async deleteChore(choreId: number, householdId: number) {
    const res = await this.prisma.chore.deleteMany({
      where: { id: choreId, householdId },
    });
    if (res.count === 0) {
      throw new NotFoundException('Chore not found.');
    }
    this.realtime.emitToHousehold(householdId, RealtimeEvents.CHORE_DELETED, {
      choreId,
    });
    return res;
  }

  async getChoreById(choreId: number, householdId: number) {
    const chore = await this.prisma.chore.findFirst({
      where: { id: choreId, householdId },
      include: { assignedTo: true },
    });
    if (!chore) {
      throw new NotFoundException('Chore not found.');
    }
    return chore;
  }

  async updateChore(choreId: number, householdId: number, userId: number, dto: UpdateChoreDto) {
    const existing = await this.prisma.chore.findFirst({
      where: { id: choreId, householdId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Chore not found.');
    }

    const data: Prisma.ChoreUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.isComplete !== undefined) {
      data.isComplete = dto.isComplete;
    }
    if (dto.dueDate !== undefined) {
      const date = new Date(dto.dueDate);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        throw new BadRequestException('dueDate must be a future date-time');
      }
      data.dueDate = date;
    }
    if (dto.assignedToId !== undefined) {
      if (dto.assignedToId === null) {
        data.assignedTo = { disconnect: true };
      } else {
        const assigned = await this.prisma.user.findUnique({
          where: { id: dto.assignedToId },
          select: { id: true, householdId: true },
        });
        if (!assigned || assigned.householdId !== householdId) {
          throw new BadRequestException(
            'Assigned user must belong to the same household.',
          );
        }
        data.assignedTo = { connect: { id: dto.assignedToId } };
      }
    }

    const updated = await this.prisma.chore.update({
      where: { id: choreId },
      data,
      include: { assignedTo: true },
    });
    this.realtime.emitToHousehold(householdId, RealtimeEvents.CHORE_UPDATED, {
      chore: updated,
    });
    if (dto.isComplete === true) {
      this.realtime.emitToHousehold(
        householdId,
        RealtimeEvents.CHORE_COMPLETED,
        { choreId },
      );
    }
    if (dto.assignedToId !== undefined) {
      this.realtime.emitToHousehold(
        householdId,
        RealtimeEvents.CHORE_ASSIGNED,
        { choreId, assignedToId: dto.assignedToId },
      );
      // Notification if assigned to a user
      if (dto.assignedToId) {
        const actor = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });
        await this.notifications.create(
          householdId,
          `${actor?.name ?? 'A member'} assigned you chore: ${updated.title}`,
          'chore_assigned',
          dto.assignedToId,
        );
      }
    }
    return updated;
  }
}
