import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChoreService } from './chore.service';
import { CreateChoreDto } from './dto/create-chore.dto';
import { UpdateChoreDto } from './dto/update-chore.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { HouseholdId } from 'src/common/decorators/household-id.decorator';
import { UserId } from 'src/common/decorators/user-id.decorator';

@UseGuards(JwtGuard)
@Controller('chores')
export class ChoreController {
  constructor(private choreService: ChoreService) {}

  @Get()
  getAll(@HouseholdId() householdId: number) {
    return this.choreService.getChoresByHousehold(householdId);
  }

  @Post()
  /**
   * WebSocket: emits 'chores:created' to household room after creation.
   */
  create(
    @HouseholdId() householdId: number,
    @UserId() userId: number,
    @Body() dto: CreateChoreDto,
  ) {
    return this.choreService.createChore(householdId, userId, dto);
  }

  @Patch(':id/complete')
  /**
   * WebSocket: emits 'chores:completed' to household room.
   */
  complete(@HouseholdId() householdId: number, @Param('id') id: string) {
    return this.choreService.markComplete(Number(id), householdId);
  }

  @Delete(':id')
  /**
   * WebSocket: emits 'chores:deleted' to household room.
   */
  remove(@HouseholdId() householdId: number, @Param('id') id: string) {
    return this.choreService.deleteChore(Number(id), householdId);
  }

  @Get(':id')
  getOne(@HouseholdId() householdId: number, @Param('id') id: string) {
    return this.choreService.getChoreById(Number(id), householdId);
  }

  @Patch(':id')
  /**
   * WebSocket: emits 'chores:updated' to household room.
   * May also emit 'chores:completed' (if isComplete true) and 'chores:assigned' when assignment changes.
   */
  update(
    @HouseholdId() householdId: number,
    @UserId() userId: number,
    @Param('id') id: string,
    @Body() dto: UpdateChoreDto,
  ) {
    return this.choreService.updateChore(Number(id), householdId, userId, dto);
  }
}
