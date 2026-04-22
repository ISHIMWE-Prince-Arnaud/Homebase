import { NotificationService } from '../../notification/notification.service';

export interface MockNotificationService {
  listByHousehold: jest.Mock;
  markRead: jest.Mock;
  create: jest.Mock;
  markAllRead: jest.Mock;
}

export function createNotificationMock(): MockNotificationService {
  return {
    listByHousehold: jest.fn(),
    markRead: jest.fn(),
    create: jest.fn(),
    markAllRead: jest.fn(),
  };
}
