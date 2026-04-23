import { Controller, Delete, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { HouseholdId } from 'src/common/decorators/household-id.decorator';
import { UserId } from 'src/common/decorators/user-id.decorator';

@UseGuards(JwtGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(@HouseholdId() householdId: number, @UserId() userId: number) {
    return this.notificationService.listByHousehold(householdId, userId);
  }

  @Patch(':id/read')
  /**
   * WebSocket: emits 'notifications:read' to household room for the given id.
   */
  markRead(
    @HouseholdId() householdId: number,
    @Param('id') id: string,
    @UserId() userId: number,
  ) {
    return this.notificationService.markRead(householdId, Number(id), userId);
  }

  @Patch('read-all')
  /**
   * WebSocket: emits 'notifications:read' to household room with { all: true }.
   */
  markAll(@HouseholdId() householdId: number, @UserId() userId: number) {
    return this.notificationService.markAllRead(householdId, userId);
  }

  @Delete(':id')
  /**
   * WebSocket: emits 'notifications:read' to household room with { deleted: true, id }.
   */
  delete(
    @HouseholdId() householdId: number,
    @Param('id') id: string,
    @UserId() userId: number,
  ) {
    return this.notificationService.delete(householdId, Number(id), userId);
  }
}
