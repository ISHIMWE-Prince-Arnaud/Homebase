import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for all users
  const password = await bcrypt.hash('password123', 10);

  // Clean existing data (truncate for development convenience)
  console.log('🧹 Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.householdNeed.deleteMany();
  await prisma.expenseParticipant.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.chore.deleteMany();
  await prisma.user.deleteMany();
  await prisma.household.deleteMany();

  // Create household
  console.log('🏠 Creating household...');
  const household = await prisma.household.create({
    data: {
      name: 'The Cool Roommates',
      inviteCode: 'COOLROOM',
    },
  });

  // Create users
  console.log('👤 Creating users...');
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      password,
      name: 'Alice',
      householdId: household.id,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      password,
      name: 'Bob',
      householdId: household.id,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      password,
      name: 'Charlie',
      householdId: household.id,
    },
  });

  // Create chores
  console.log('🧹 Creating chores...');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await prisma.chore.createMany({
    data: [
      {
        title: 'Clean the kitchen',
        description: 'Wash dishes and wipe counters',
        dueDate: tomorrow,
        isComplete: false,
        householdId: household.id,
        assignedToId: alice.id,
      },
      {
        title: 'Take out trash',
        description: 'Empty all trash bins',
        dueDate: yesterday,
        isComplete: true,
        householdId: household.id,
        assignedToId: bob.id,
      },
      {
        title: 'Buy groceries',
        description: 'Weekly grocery shopping',
        dueDate: inTwoDays,
        isComplete: false,
        householdId: household.id,
        assignedToId: null,
      },
      {
        title: 'Vacuum living room',
        description: 'Vacuum carpets and rugs',
        dueDate: inThreeDays,
        isComplete: false,
        householdId: household.id,
        assignedToId: charlie.id,
      },
      {
        title: 'Water plants',
        description: 'Water all indoor plants',
        dueDate: inOneDay,
        isComplete: false,
        householdId: household.id,
        assignedToId: alice.id,
      },
      {
        title: 'Do laundry',
        description: 'Wash and fold clothes',
        dueDate: null,
        isComplete: false,
        householdId: household.id,
        assignedToId: null,
      },
      {
        title: 'Clean bathroom',
        description: 'Scrub toilet, sink, and shower',
        dueDate: null,
        isComplete: true,
        householdId: household.id,
        assignedToId: bob.id,
      },
      {
        title: 'Organize garage',
        description: 'Sort and organize tools and storage',
        dueDate: null,
        isComplete: false,
        householdId: household.id,
        assignedToId: null,
      },
    ],
  });

  // Create expenses
  console.log('💰 Creating expenses...');
  const groceryExpense = await prisma.expense.create({
    data: {
      description: 'Weekly grocery run',
      totalAmount: 120,
      date: now,
      paidById: alice.id,
      householdId: household.id,
      participants: {
        create: [
          { userId: alice.id, shareAmount: 40 },
          { userId: bob.id, shareAmount: 40 },
          { userId: charlie.id, shareAmount: 40 },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      description: 'Electric bill',
      totalAmount: 200,
      date: now,
      paidById: bob.id,
      householdId: household.id,
      participants: {
        create: [
          { userId: alice.id, shareAmount: 66.67 },
          { userId: bob.id, shareAmount: 66.66 },
          { userId: charlie.id, shareAmount: 66.67 },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      description: 'Pizza night',
      totalAmount: 45,
      date: now,
      paidById: charlie.id,
      householdId: household.id,
      participants: {
        create: [
          { userId: alice.id, shareAmount: 15 },
          { userId: bob.id, shareAmount: 15 },
          { userId: charlie.id, shareAmount: 15 },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      description: 'Internet',
      totalAmount: 80,
      date: now,
      paidById: alice.id,
      householdId: household.id,
      participants: {
        create: [
          { userId: alice.id, shareAmount: 26.67 },
          { userId: bob.id, shareAmount: 26.66 },
          { userId: charlie.id, shareAmount: 26.67 },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      description: 'Cleaning supplies',
      totalAmount: 35,
      date: now,
      paidById: bob.id,
      householdId: household.id,
      participants: {
        create: [
          { userId: alice.id, shareAmount: 11.67 },
          { userId: bob.id, shareAmount: 11.66 },
          { userId: charlie.id, shareAmount: 11.67 },
        ],
      },
    },
  });

  // Create household needs
  console.log('🛒 Creating household needs...');
  await prisma.householdNeed.createMany({
    data: [
      {
        name: 'Milk',
        quantity: '2 liters',
        category: 'Dairy',
        isPurchased: false,
        householdId: household.id,
        addedById: alice.id,
      },
      {
        name: 'Bread',
        quantity: '1 loaf',
        category: 'Bakery',
        isPurchased: true,
        purchasedAt: now,
        householdId: household.id,
        addedById: bob.id,
        purchasedById: alice.id,
      },
      {
        name: 'Dish soap',
        quantity: '1 bottle',
        category: 'Household',
        isPurchased: false,
        householdId: household.id,
        addedById: charlie.id,
      },
      {
        name: 'Toilet paper',
        quantity: '12 rolls',
        category: 'Household',
        isPurchased: true,
        purchasedAt: now,
        householdId: household.id,
        addedById: alice.id,
        purchasedById: bob.id,
      },
      {
        name: 'Eggs',
        quantity: '1 dozen',
        category: 'Dairy',
        isPurchased: false,
        householdId: household.id,
        addedById: bob.id,
      },
      {
        name: 'Coffee',
        quantity: '500g',
        category: 'Beverages',
        isPurchased: true,
        purchasedAt: now,
        householdId: household.id,
        addedById: charlie.id,
        purchasedById: charlie.id,
      },
    ],
  });

  // Create payments
  console.log('💸 Creating payments...');
  await prisma.payment.createMany({
    data: [
      {
        fromUserId: bob.id,
        toUserId: alice.id,
        amount: 30,
        householdId: household.id,
      },
      {
        fromUserId: charlie.id,
        toUserId: bob.id,
        amount: 25,
        householdId: household.id,
      },
    ],
  });

  // Create notifications
  console.log('🔔 Creating notifications...');
  await prisma.notification.createMany({
    data: [
      // chore_assigned notifications
      {
        message: 'Alice assigned you chore: Clean the kitchen',
        type: 'chore_assigned',
        isRead: false,
        householdId: household.id,
        userId: alice.id,
      },
      {
        message: 'Alice assigned you chore: Water plants',
        type: 'chore_assigned',
        isRead: true,
        householdId: household.id,
        userId: alice.id,
      },
      {
        message: 'Bob assigned you chore: Take out trash',
        type: 'chore_assigned',
        isRead: false,
        householdId: household.id,
        userId: bob.id,
      },
      // expense_added notifications
      {
        message: 'Alice created expense Weekly grocery run',
        type: 'expense_added',
        isRead: false,
        householdId: household.id,
        userId: null, // household-wide
      },
      {
        message: 'Bob created expense Electric bill',
        type: 'expense_added',
        isRead: true,
        householdId: household.id,
        userId: null, // household-wide
      },
      {
        message: 'Charlie created expense Pizza night',
        type: 'expense_added',
        isRead: false,
        householdId: household.id,
        userId: null, // household-wide
      },
      // payment_received notifications
      {
        message: 'Bob paid Alice 30',
        type: 'payment_received',
        isRead: false,
        householdId: household.id,
        userId: alice.id,
      },
      {
        message: 'Charlie paid Bob 25',
        type: 'payment_received',
        isRead: true,
        householdId: household.id,
        userId: bob.id,
      },
      // household_invite notifications
      {
        message: 'Alice joined the household',
        type: 'household_invite',
        isRead: true,
        householdId: household.id,
        userId: null, // household-wide
      },
      {
        message: 'Bob joined the household',
        type: 'household_invite',
        isRead: true,
        householdId: household.id,
        userId: null, // household-wide
      },
      {
        message: 'Charlie joined the household',
        type: 'household_invite',
        isRead: false,
        householdId: household.id,
        userId: null, // household-wide
      },
      // need_added notifications
      {
        message: 'Alice added Milk',
        type: 'need_added',
        isRead: false,
        householdId: household.id,
        userId: null, // household-wide
      },
      {
        message: 'Bob added Bread',
        type: 'need_added',
        isRead: true,
        householdId: household.id,
        userId: null, // household-wide
      },
      {
        message: 'Charlie added Dish soap',
        type: 'need_added',
        isRead: false,
        householdId: household.id,
        userId: null, // household-wide
      },
      // need_purchased notifications
      {
        message: 'Alice purchased Bread',
        type: 'need_purchased',
        isRead: false,
        householdId: household.id,
        userId: null, // household-wide
      },
      {
        message: 'Bob purchased Toilet paper',
        type: 'need_purchased',
        isRead: true,
        householdId: household.id,
        userId: null, // household-wide
      },
      {
        message: 'Charlie purchased Coffee',
        type: 'need_purchased',
        isRead: false,
        householdId: household.id,
        userId: null, // household-wide
      },
      // system notifications
      {
        message: 'System maintenance scheduled for tonight',
        type: 'system',
        isRead: false,
        householdId: household.id,
        userId: null, // household-wide
      },
      {
        message: 'Welcome to Homebase!',
        type: 'system',
        isRead: true,
        householdId: household.id,
        userId: alice.id,
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('  - 3 users (alice@example.com, bob@example.com, charlie@example.com)');
  console.log('  - 1 household (The Cool Roommates)');
  console.log('  - 8 chores');
  console.log('  - 5 expenses');
  console.log('  - 6 household needs');
  console.log('  - 2 payments');
  console.log('  - 19 notifications (all types: chore_assigned, expense_added, payment_received, household_invite, need_added, need_purchased, system)');
  console.log('');
  console.log('🔑 All users have password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
