export const householdRoom = (householdId: number) =>
  `household:${householdId}`;
export const userRoom = (userId: number) => `user:${userId}`;

export const RealtimeEvents = {
  CONNECTION_READY: 'connection:ready',
  NEED_ITEM_ADDED: 'needs:itemAdded',
  NEED_ITEM_UPDATED: 'needs:itemUpdated',
  NEED_ITEM_PURCHASED: 'needs:itemPurchased',
  NEED_EXPENSE_CREATED: 'needs:expenseCreated',
  CHORE_CREATED: 'chores:created',
  CHORE_UPDATED: 'chores:updated',
  CHORE_COMPLETED: 'chores:completed',
  CHORE_ASSIGNED: 'chores:assigned',
  CHORE_DELETED: 'chores:deleted',
  EXPENSE_CREATED: 'expenses:created',
  EXPENSE_BALANCE_UPDATED: 'expenses:balanceUpdated',
  PAYMENT_RECORDED: 'payments:recorded',
  NOTIFICATION_CREATED: 'notifications:created',
  NOTIFICATION_READ: 'notifications:read',
  NOTIFICATION_DELETED: 'notifications:deleted',
  HOUSEHOLD_MEMBER_JOINED: 'household:memberJoined',
  HOUSEHOLD_MEMBER_LEFT: 'household:memberLeft',
  HOUSEHOLD_DELETED: 'household:deleted',
} as const;

export type RealtimeEvent =
  (typeof RealtimeEvents)[keyof typeof RealtimeEvents];
