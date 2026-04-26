import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: jest.Mocked<NotificationService>;

  const mockNotification = {
    id: 1,
    message: 'Test notification',
    type: 'info',
    isRead: false,
    householdId: 10,
    userId: 1,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    notificationService = {
      listByHousehold: jest.fn().mockResolvedValue([mockNotification]),
      markRead: jest.fn().mockResolvedValue(mockNotification),
      markAllRead: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: notificationService },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  describe('list()', () => {
    it('passes householdId and userId to service', async () => {
      const result = await controller.list(10, 1);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(notificationService.listByHousehold).toHaveBeenCalledWith(10, 1);
      expect(result).toEqual([mockNotification]);
    });
  });

  describe('markRead()', () => {
    it('calls markRead with householdId, parsed id, and userId', async () => {
      const result = await controller.markRead(10, '1', 1);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(notificationService.markRead).toHaveBeenCalledWith(10, 1, 1);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('markAll()', () => {
    it('calls markAllRead with householdId and userId', async () => {
      await controller.markAll(10, 1);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(notificationService.markAllRead).toHaveBeenCalledWith(10, 1);
    });
  });
});
