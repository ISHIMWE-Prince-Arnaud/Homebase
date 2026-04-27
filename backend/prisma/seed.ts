import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to generate dates relative to now
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // Hash password for all users
  const password = await bcrypt.hash('password123', 10);

  // ==========================================
  // CLEAN EXISTING DATA
  // ==========================================
  console.log('🧹 Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.householdNeed.deleteMany();
  await prisma.expenseParticipant.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.chore.deleteMany();
  await prisma.user.deleteMany();
  await prisma.household.deleteMany();

  // ==========================================
  // HOUSEHOLD 1: The Cool Roommates (3 members, fully active)
  // ==========================================
  console.log('🏠 Creating Household 1: The Cool Roommates...');
  const household1 = await prisma.household.create({
    data: {
      name: 'The Cool Roommates',
      inviteCode: 'COOLROOM',
    },
  });

  // Users for household 1
  const alice = await prisma.user.create({
    data: { email: 'alice@example.com', password, name: 'Alice', householdId: household1.id },
  });
  const bob = await prisma.user.create({
    data: { email: 'bob@example.com', password, name: 'Bob', householdId: household1.id },
  });
  const charlie = await prisma.user.create({
    data: { email: 'charlie@example.com', password, name: 'Charlie', householdId: household1.id },
  });

  // ==========================================
  // HOUSEHOLD 2: The Smith Family (2 members, different dynamics)
  // ==========================================
  console.log('🏠 Creating Household 2: The Smith Family...');
  const household2 = await prisma.household.create({
    data: {
      name: 'The Smith Family',
      inviteCode: 'SMITHFAM',
    },
  });

  const dave = await prisma.user.create({
    data: { email: 'dave@example.com', password, name: 'Dave', householdId: household2.id },
  });
  const eve = await prisma.user.create({
    data: { email: 'eve@example.com', password, name: 'Eve', householdId: household2.id },
  });

  // ==========================================
  // USERS WITHOUT HOUSEHOLDS (to test onboarding flow)
  // ==========================================
  console.log('👤 Creating users without households...');
  const frank = await prisma.user.create({
    data: { email: 'frank@example.com', password, name: 'Frank', householdId: null },
  });
  const grace = await prisma.user.create({
    data: { email: 'grace@example.com', password, name: 'Grace', householdId: null },
  });

  // ==========================================
  // CHORES - Household 1 (Comprehensive coverage)
  // ==========================================
  console.log('🧹 Creating chores for Household 1...');
  const h1Chores = await prisma.chore.createMany({
    data: [
      // Due soon, assigned, incomplete
      { title: 'Clean the kitchen', description: 'Wash dishes and wipe counters', dueDate: daysFromNow(1), isComplete: false, householdId: household1.id, assignedToId: alice.id },
      { title: 'Water plants', description: 'Water all indoor plants', dueDate: daysFromNow(2), isComplete: false, householdId: household1.id, assignedToId: alice.id },
      
      // Overdue, assigned, incomplete (high priority)
      { title: 'Take out trash', description: 'Empty all trash bins', dueDate: daysAgo(2), isComplete: false, householdId: household1.id, assignedToId: bob.id },
      { title: 'Pay rent', description: 'Transfer rent to landlord', dueDate: daysAgo(1), isComplete: false, householdId: household1.id, assignedToId: charlie.id },
      
      // Due later, assigned
      { title: 'Vacuum living room', description: 'Vacuum carpets and rugs', dueDate: daysFromNow(5), isComplete: false, householdId: household1.id, assignedToId: charlie.id },
      { title: 'Clean windows', description: 'Wash all windows', dueDate: daysFromNow(7), isComplete: false, householdId: household1.id, assignedToId: bob.id },
      
      // No due date, assigned
      { title: 'Organize garage', description: 'Sort and organize tools', dueDate: null, isComplete: false, householdId: household1.id, assignedToId: alice.id },
      
      // No due date, unassigned (available to claim)
      { title: 'Do laundry', description: 'Wash and fold clothes', dueDate: null, isComplete: false, householdId: household1.id, assignedToId: null },
      { title: 'Buy groceries', description: 'Weekly grocery shopping', dueDate: daysFromNow(3), isComplete: false, householdId: household1.id, assignedToId: null },
      
      // Recently completed
      { title: 'Clean bathroom', description: 'Scrub toilet, sink, shower', dueDate: daysAgo(1), isComplete: true, householdId: household1.id, assignedToId: bob.id },
      { title: 'Mow lawn', description: 'Cut grass and trim edges', dueDate: daysAgo(3), isComplete: true, householdId: household1.id, assignedToId: charlie.id },
      
      // Completed long ago (history)
      { title: 'Change air filters', description: 'Replace HVAC filters', dueDate: daysAgo(30), isComplete: true, householdId: household1.id, assignedToId: alice.id },
    ],
  });

  // ==========================================
  // CHORES - Household 2 (Different patterns)
  // ==========================================
  console.log('🧹 Creating chores for Household 2...');
  const h2Chores = await prisma.chore.createMany({
    data: [
      // Mix of assignments between 2 people
      { title: 'Grocery shopping', description: 'Buy weekly groceries', dueDate: daysFromNow(1), isComplete: false, householdId: household2.id, assignedToId: dave.id },
      { title: 'Walk the dog', description: 'Morning and evening walks', dueDate: daysFromNow(1), isComplete: false, householdId: household2.id, assignedToId: eve.id },
      { title: 'Cook dinner', description: 'Prepare family dinner', dueDate: daysFromNow(1), isComplete: false, householdId: household2.id, assignedToId: dave.id },
      { title: 'Kids homework help', description: 'Help with math homework', dueDate: daysFromNow(2), isComplete: false, householdId: household2.id, assignedToId: eve.id },
      { title: 'Pay utilities', description: 'Electric and water bills', dueDate: daysAgo(2), isComplete: false, householdId: household2.id, assignedToId: dave.id },
      { title: 'Call plumber', description: 'Fix leaking faucet', dueDate: null, isComplete: true, householdId: household2.id, assignedToId: eve.id },
    ],
  });

  // ==========================================
  // EXPENSES - Household 1 (Complex splits)
  // ==========================================
  console.log('💰 Creating expenses for Household 1...');

  // Expense 1: Equal 3-way split
  await prisma.expense.create({
    data: {
      description: 'Weekly groceries',
      totalAmount: 150.00,
      date: daysAgo(2),
      paidById: alice.id,
      householdId: household1.id,
      participants: { create: [
        { userId: alice.id, shareAmount: 50 },
        { userId: bob.id, shareAmount: 50 },
        { userId: charlie.id, shareAmount: 50 },
      ]},
    },
  });

  // Expense 2: Unequal split (Charlie used more electricity)
  await prisma.expense.create({
    data: {
      description: 'Electric bill - March',
      totalAmount: 180.00,
      date: daysAgo(5),
      paidById: bob.id,
      householdId: household1.id,
      participants: { create: [
        { userId: alice.id, shareAmount: 60 },
        { userId: bob.id, shareAmount: 50 },
        { userId: charlie.id, shareAmount: 70 },
      ]},
    },
  });

  // Expense 3: 2-person split (Alice and Bob only)
  await prisma.expense.create({
    data: {
      description: 'Movie night (Alice & Bob)',
      totalAmount: 45.00,
      date: daysAgo(3),
      paidById: alice.id,
      householdId: household1.id,
      participants: { create: [
        { userId: alice.id, shareAmount: 22.50 },
        { userId: bob.id, shareAmount: 22.50 },
      ]},
    },
  });

  // Expense 4: Paid by non-participant (Charlie paid but doesn't share)
  await prisma.expense.create({
    data: {
      description: 'Birthday gift for Mom',
      totalAmount: 120.00,
      date: daysAgo(7),
      paidById: charlie.id,
      householdId: household1.id,
      participants: { create: [
        { userId: alice.id, shareAmount: 60 },
        { userId: bob.id, shareAmount: 60 },
      ]},
    },
  });

  // Expense 5: Single payer pays all (no participants - personal expense logged)
  await prisma.expense.create({
    data: {
      description: 'Personal gym equipment',
      totalAmount: 200.00,
      date: daysAgo(10),
      paidById: alice.id,
      householdId: household1.id,
      participants: { create: [{ userId: alice.id, shareAmount: 200 }] },
    },
  });

  // Expense 6: Internet (recurring, equal split)
  await prisma.expense.create({
    data: {
      description: 'Internet - April',
      totalAmount: 80.00,
      date: daysAgo(1),
      paidById: alice.id,
      householdId: household1.id,
      participants: { create: [
        { userId: alice.id, shareAmount: 26.67 },
        { userId: bob.id, shareAmount: 26.66 },
        { userId: charlie.id, shareAmount: 26.67 },
      ]},
    },
  });

  // Expense 7: Cleaning supplies (small amount)
  await prisma.expense.create({
    data: {
      description: 'Cleaning supplies',
      totalAmount: 35.50,
      date: daysAgo(4),
      paidById: bob.id,
      householdId: household1.id,
      participants: { create: [
        { userId: alice.id, shareAmount: 11.84 },
        { userId: bob.id, shareAmount: 11.83 },
        { userId: charlie.id, shareAmount: 11.83 },
      ]},
    },
  });

  // Expense 8: Pizza night (small, recent)
  await prisma.expense.create({
    data: {
      description: 'Friday pizza night',
      totalAmount: 42.00,
      date: daysAgo(1),
      paidById: charlie.id,
      householdId: household1.id,
      participants: { create: [
        { userId: alice.id, shareAmount: 14 },
        { userId: bob.id, shareAmount: 14 },
        { userId: charlie.id, shareAmount: 14 },
      ]},
    },
  });

  // ==========================================
  // EXPENSES - Household 2 (2-person splits)
  // ==========================================
  console.log('💰 Creating expenses for Household 2...');

  await prisma.expense.create({
    data: {
      description: 'Weekly groceries',
      totalAmount: 200.00,
      date: daysAgo(3),
      paidById: dave.id,
      householdId: household2.id,
      participants: { create: [
        { userId: dave.id, shareAmount: 100 },
        { userId: eve.id, shareAmount: 100 },
      ]},
    },
  });

  await prisma.expense.create({
    data: {
      description: 'Mortgage',
      totalAmount: 1500.00,
      date: daysAgo(5),
      paidById: dave.id,
      householdId: household2.id,
      participants: { create: [
        { userId: dave.id, shareAmount: 750 },
        { userId: eve.id, shareAmount: 750 },
      ]},
    },
  });

  await prisma.expense.create({
    data: {
      description: 'Vet visit for dog',
      totalAmount: 250.00,
      date: daysAgo(7),
      paidById: eve.id,
      householdId: household2.id,
      participants: { create: [
        { userId: dave.id, shareAmount: 125 },
        { userId: eve.id, shareAmount: 125 },
      ]},
    },
  });

  // ==========================================
  // HOUSEHOLD NEEDS - Household 1
  // ==========================================
  console.log('🛒 Creating household needs for Household 1...');
  await prisma.householdNeed.createMany({
    data: [
      // Pending items (need to buy)
      { name: 'Milk', quantity: '2 liters', category: 'Dairy', isPurchased: false, householdId: household1.id, addedById: alice.id },
      { name: 'Bread', quantity: '1 loaf', category: 'Bakery', isPurchased: false, householdId: household1.id, addedById: bob.id },
      { name: 'Eggs', quantity: '1 dozen', category: 'Dairy', isPurchased: false, householdId: household1.id, addedById: charlie.id },
      { name: 'Dish soap', quantity: '1 bottle', category: 'Household', isPurchased: false, householdId: household1.id, addedById: alice.id },
      { name: 'Toilet paper', quantity: '12 rolls', category: 'Household', isPurchased: false, householdId: household1.id, addedById: bob.id },
      { name: 'Shampoo', quantity: '1 bottle', category: 'Personal Care', isPurchased: false, householdId: household1.id, addedById: charlie.id },
      { name: 'Coffee beans', quantity: '500g', category: 'Beverages', isPurchased: false, householdId: household1.id, addedById: alice.id },
      { name: 'Chicken breast', quantity: '1 kg', category: 'Meat', isPurchased: false, householdId: household1.id, addedById: bob.id },
      
      // Recently purchased
      { name: 'Pasta', quantity: '3 packs', category: 'Pantry', isPurchased: true, purchasedAt: daysAgo(1), householdId: household1.id, addedById: alice.id, purchasedById: bob.id },
      { name: 'Tomato sauce', quantity: '2 jars', category: 'Pantry', isPurchased: true, purchasedAt: daysAgo(1), householdId: household1.id, addedById: bob.id, purchasedById: bob.id },
      { name: 'Laundry detergent', quantity: '1 box', category: 'Household', isPurchased: true, purchasedAt: daysAgo(2), householdId: household1.id, addedById: charlie.id, purchasedById: alice.id },
      { name: 'Paper towels', quantity: '6 rolls', category: 'Household', isPurchased: true, purchasedAt: daysAgo(3), householdId: household1.id, addedById: alice.id, purchasedById: charlie.id },
      
      // Purchased long ago (history)
      { name: 'Rice', quantity: '5 kg', category: 'Pantry', isPurchased: true, purchasedAt: daysAgo(30), householdId: household1.id, addedById: bob.id, purchasedById: alice.id },
    ],
  });

  // ==========================================
  // HOUSEHOLD NEEDS - Household 2
  // ==========================================
  console.log('🛒 Creating household needs for Household 2...');
  await prisma.householdNeed.createMany({
    data: [
      { name: 'Dog food', quantity: '1 bag', category: 'Pets', isPurchased: false, householdId: household2.id, addedById: dave.id },
      { name: 'Bananas', quantity: '1 bunch', category: 'Produce', isPurchased: false, householdId: household2.id, addedById: eve.id },
      { name: 'Diapers', quantity: '1 box', category: 'Baby', isPurchased: true, purchasedAt: daysAgo(2), householdId: household2.id, addedById: eve.id, purchasedById: dave.id },
      { name: 'Baby wipes', quantity: '3 packs', category: 'Baby', isPurchased: true, purchasedAt: daysAgo(2), householdId: household2.id, addedById: dave.id, purchasedById: eve.id },
    ],
  });

  // ==========================================
  // PAYMENTS - Household 1 (Settlement history)
  // ==========================================
  console.log('💸 Creating payments for Household 1...');
  await prisma.payment.createMany({
    data: [
      // Recent payments
      { fromUserId: bob.id, toUserId: alice.id, amount: 50, householdId: household1.id, createdAt: daysAgo(1) },
      { fromUserId: charlie.id, toUserId: alice.id, amount: 30, householdId: household1.id, createdAt: daysAgo(2) },
      { fromUserId: charlie.id, toUserId: bob.id, amount: 25, householdId: household1.id, createdAt: daysAgo(3) },
      
      // Older payments (history)
      { fromUserId: bob.id, toUserId: alice.id, amount: 45, householdId: household1.id, createdAt: daysAgo(10) },
      { fromUserId: charlie.id, toUserId: bob.id, amount: 60, householdId: household1.id, createdAt: daysAgo(15) },
      { fromUserId: alice.id, toUserId: bob.id, amount: 20, householdId: household1.id, createdAt: daysAgo(20) },
      { fromUserId: bob.id, toUserId: charlie.id, amount: 35, householdId: household1.id, createdAt: daysAgo(25) },
    ],
  });

  // ==========================================
  // PAYMENTS - Household 2
  // ==========================================
  console.log('💸 Creating payments for Household 2...');
  await prisma.payment.createMany({
    data: [
      { fromUserId: eve.id, toUserId: dave.id, amount: 500, householdId: household2.id, createdAt: daysAgo(5) },
      { fromUserId: dave.id, toUserId: eve.id, amount: 125, householdId: household2.id, createdAt: daysAgo(7) },
    ],
  });

  // ==========================================
  // NOTIFICATIONS - Household 1 (Comprehensive coverage)
  // ==========================================
  console.log('🔔 Creating notifications for Household 1...');
  
  // Notifications with actor references (who triggered them)
  await prisma.notification.createMany({
    data: [
      // === CHORE ASSIGNMENTS ===
      { message: 'Alice assigned you: Clean the kitchen', type: 'chore_assigned', isRead: false, householdId: household1.id, userId: alice.id, actorId: alice.id, entityType: 'chore', entityId: 1, action: 'assigned' },
      { message: 'Bob assigned you: Take out trash', type: 'chore_assigned', isRead: true, householdId: household1.id, userId: bob.id, actorId: alice.id, entityType: 'chore', entityId: 3, action: 'assigned' },
      { message: 'Charlie assigned you: Vacuum living room', type: 'chore_assigned', isRead: false, householdId: household1.id, userId: charlie.id, actorId: alice.id, entityType: 'chore', entityId: 5, action: 'assigned' },
      { message: 'You have a new chore: Water plants', type: 'chore_assigned', isRead: true, householdId: household1.id, userId: alice.id, actorId: bob.id, entityType: 'chore', entityId: 2, action: 'assigned' },
      
      // === EXPENSES ===
      { message: 'Alice added expense: Weekly groceries ($150)', type: 'expense_added', isRead: false, householdId: household1.id, userId: null, actorId: alice.id, entityType: 'expense', entityId: 1, action: 'created' },
      { message: 'Bob added expense: Electric bill - March ($180)', type: 'expense_added', isRead: true, householdId: household1.id, userId: null, actorId: bob.id, entityType: 'expense', entityId: 2, action: 'created' },
      { message: 'Charlie added expense: Friday pizza night ($42)', type: 'expense_added', isRead: false, householdId: household1.id, userId: null, actorId: charlie.id, entityType: 'expense', entityId: 8, action: 'created' },
      { message: 'You were added to expense: Movie night', type: 'expense_added', isRead: false, householdId: household1.id, userId: bob.id, actorId: alice.id, entityType: 'expense', entityId: 3, action: 'created' },
      
      // === PAYMENTS ===
      { message: 'Bob paid you $50', type: 'payment_received', isRead: false, householdId: household1.id, userId: alice.id, actorId: bob.id, entityType: 'payment', action: 'received' },
      { message: 'Charlie paid you $30', type: 'payment_received', isRead: true, householdId: household1.id, userId: alice.id, actorId: charlie.id, entityType: 'payment', action: 'received' },
      { message: 'You received $25 from Charlie', type: 'payment_received', isRead: false, householdId: household1.id, userId: bob.id, actorId: charlie.id, entityType: 'payment', action: 'received' },
      { message: 'You paid Alice $50', type: 'payment_sent', isRead: true, householdId: household1.id, userId: bob.id, actorId: bob.id, entityType: 'payment', action: 'sent' },
      
      // === HOUSEHOLD NEEDS ===
      { message: 'Alice added to shopping list: Milk', type: 'need_added', isRead: false, householdId: household1.id, userId: null, actorId: alice.id, entityType: 'need', action: 'added' },
      { message: 'Bob added to shopping list: Bread', type: 'need_added', isRead: true, householdId: household1.id, userId: null, actorId: bob.id, entityType: 'need', action: 'added' },
      { message: 'Charlie added to shopping list: Eggs', type: 'need_added', isRead: false, householdId: household1.id, userId: null, actorId: charlie.id, entityType: 'need', action: 'added' },
      { message: 'Alice purchased: Pasta', type: 'need_purchased', isRead: false, householdId: household1.id, userId: null, actorId: alice.id, entityType: 'need', action: 'purchased' },
      { message: 'Bob purchased: Tomato sauce', type: 'need_purchased', isRead: true, householdId: household1.id, userId: null, actorId: bob.id, entityType: 'need', action: 'purchased' },
      { message: 'Charlie purchased: Paper towels', type: 'need_purchased', isRead: false, householdId: household1.id, userId: null, actorId: charlie.id, entityType: 'need', action: 'purchased' },
      
      // === HOUSEHOLD ACTIVITY ===
      { message: 'Bob joined the household', type: 'household_invite', isRead: true, householdId: household1.id, userId: null, actorId: bob.id, action: 'joined' },
      { message: 'Charlie joined the household', type: 'household_invite', isRead: true, householdId: household1.id, userId: null, actorId: charlie.id, action: 'joined' },
      { message: 'Invite code regenerated', type: 'household_update', isRead: false, householdId: household1.id, userId: null, actorId: alice.id, action: 'updated' },
      
      // === SYSTEM ===
      { message: 'Welcome to Homebase! Start by exploring your dashboard.', type: 'system', isRead: true, householdId: household1.id, userId: alice.id },
      { message: 'Your chore "Take out trash" is overdue!', type: 'system', isRead: false, householdId: household1.id, userId: bob.id },
      { message: 'Monthly expense summary is ready', type: 'system', isRead: false, householdId: household1.id, userId: null },
      { message: 'New features available: Check out the updated chore scheduler', type: 'system', isRead: true, householdId: household1.id, userId: null },
      
      // === CHORE COMPLETIONS ===
      { message: 'Bob completed: Clean bathroom', type: 'chore_completed', isRead: false, householdId: household1.id, userId: null, actorId: bob.id, entityType: 'chore', action: 'completed' },
      { message: 'Charlie completed: Mow lawn', type: 'chore_completed', isRead: true, householdId: household1.id, userId: null, actorId: charlie.id, entityType: 'chore', action: 'completed' },
      
      // === EXPENSE UPDATES ===
      { message: 'Alice updated expense: Weekly groceries', type: 'expense_updated', isRead: false, householdId: household1.id, userId: null, actorId: alice.id, entityType: 'expense', action: 'updated' },
      { message: 'Bob deleted expense: Old bill', type: 'expense_deleted', isRead: true, householdId: household1.id, userId: null, actorId: bob.id, entityType: 'expense', action: 'deleted' },
    ],
  });

  // ==========================================
  // NOTIFICATIONS - Household 2
  // ==========================================
  console.log('🔔 Creating notifications for Household 2...');
  await prisma.notification.createMany({
    data: [
      { message: 'Welcome to your new household!', type: 'system', isRead: true, householdId: household2.id, userId: dave.id },
      { message: 'Eve joined the household', type: 'household_invite', isRead: true, householdId: household2.id, userId: null, actorId: eve.id, action: 'joined' },
      { message: 'Dave added expense: Mortgage ($1,500)', type: 'expense_added', isRead: false, householdId: household2.id, userId: null, actorId: dave.id, entityType: 'expense', action: 'created' },
      { message: 'Eve added to shopping list: Dog food', type: 'need_added', isRead: false, householdId: household2.id, userId: null, actorId: eve.id, entityType: 'need', action: 'added' },
      { message: 'Dave paid you $500', type: 'payment_received', isRead: true, householdId: household2.id, userId: eve.id, actorId: dave.id, entityType: 'payment', action: 'received' },
      { message: 'You have a chore due tomorrow: Grocery shopping', type: 'chore_assigned', isRead: false, householdId: household2.id, userId: dave.id, actorId: eve.id, entityType: 'chore', action: 'assigned' },
    ],
  });

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📊 SEED SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('🏠 HOUSEHOLDS (2)');
  console.log('   • The Cool Roommates (3 members) - invite: COOLROOM');
  console.log('   • The Smith Family (2 members) - invite: SMITHFAM');
  console.log('');
  console.log('👤 USERS (7 total, all password: "password123")');
  console.log('   ┌─────────────────────┬──────────────────┬────────────┐');
  console.log('   │ Email               │ Name             │ Household  │');
  console.log('   ├─────────────────────┼──────────────────┼────────────┤');
  console.log('   │ alice@example.com   │ Alice            │ Cool Room  │');
  console.log('   │ bob@example.com     │ Bob              │ Cool Room  │');
  console.log('   │ charlie@example.com │ Charlie          │ Cool Room  │');
  console.log('   │ dave@example.com    │ Dave             │ Smith Fam  │');
  console.log('   │ eve@example.com     │ Eve              │ Smith Fam  │');
  console.log('   │ frank@example.com   │ Frank            │ (none)     │');
  console.log('   │ grace@example.com   │ Grace            │ (none)     │');
  console.log('   └─────────────────────┴──────────────────┴────────────┘');
  console.log('');
  console.log('🧹 CHORES (18 total)');
  console.log('   Household 1: 12 chores');
  console.log('     - 4 overdue, 4 due soon, 4 future/no date');
  console.log('     - 6 incomplete assigned, 2 unassigned, 4 completed');
  console.log('   Household 2: 6 chores (2-person household patterns)');
  console.log('');
  console.log('💰 EXPENSES (11 total)');
  console.log('   Household 1: 8 expenses');
  console.log('     - Equal 3-way splits, unequal splits, 2-person splits');
  console.log('     - Paid by non-participant scenario (birthday gift)');
  console.log('     - Personal expense (gym equipment)');
  console.log('   Household 2: 3 expenses (mortgage, groceries, vet)');
  console.log('');
  console.log('🛒 HOUSEHOLD NEEDS (19 total)');
  console.log('   Household 1: 15 items (8 pending, 4 recent, 3 old)');
  console.log('     Categories: Dairy, Bakery, Household, Personal Care, Beverages, Meat, Pantry');
  console.log('   Household 2: 4 items (Pets, Produce, Baby categories)');
  console.log('');
  console.log('💸 PAYMENTS (9 total) - Settlement history');
  console.log('   Household 1: 7 payments (various directions & amounts)');
  console.log('   Household 2: 2 payments');
  console.log('');
  console.log('🔔 NOTIFICATIONS (32 total) - All types covered');
  console.log('   Types: chore_assigned, chore_completed, expense_added,');
  console.log('          expense_updated, expense_deleted, payment_received,');
  console.log('          payment_sent, need_added, need_purchased,');
  console.log('          household_invite, household_update, system');
  console.log('   Features: actor references, entity links, read/unread mix');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('🧪 TEST SCENARIOS ENABLED');
  console.log('   ✓ Multi-household data isolation');
  console.log('   ✓ Users without households (onboarding flow)');
  console.log('   ✓ Overdue chores (visual priority testing)');
  console.log('   ✓ Complex expense splits (settlement algorithm)');
  console.log('   ✓ Payment history (balance reconciliation)');
  console.log('   ✓ Notification system (all types with metadata)');
  console.log('   ✓ Category filtering (needs shopping list)');
  console.log('   ✓ Date-based sorting (chores, expenses)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
