# Database Seeding

## Quick Start

```bash
# Reset database and seed
npm run db:reset

# Or manually
npx prisma migrate reset
npx prisma db seed

# Seed only (without reset)
npm run prisma:seed
```

## Default Users

All seeded users have password: `password123`

| Email | Name | Household Role |
|-------|------|----------------|
| alice@example.com | Alice | Creator |
| bob@example.com | Bob | Member |
| charlie@example.com | Charlie | Member |

## What's Seeded

- 1 household with 3 members
- 8 chores (various completion states)
- 5 expenses with fair splits
- 6 shopping list items
- 2 payments between members
- 4 notifications

## Seeded Data Details

### Household
- Name: "The Cool Roommates"
- Invite Code: "COOLROOM"

### Chores
- Clean the kitchen (assigned to Alice, due tomorrow, incomplete)
- Take out trash (assigned to Bob, due yesterday, complete)
- Buy groceries (unassigned, due in 2 days, incomplete)
- Vacuum living room (assigned to Charlie, due in 3 days, incomplete)
- Water plants (assigned to Alice, due in 1 day, incomplete)
- Do laundry (unassigned, no due date, incomplete)
- Clean bathroom (assigned to Bob, complete)
- Organize garage (unassigned, incomplete)

### Expenses
- Weekly grocery run ($120, paid by Alice, split 3 ways)
- Electric bill ($200, paid by Bob, split 3 ways)
- Pizza night ($45, paid by Charlie, split 3 ways)
- Internet ($80, paid by Alice, split 3 ways)
- Cleaning supplies ($35, paid by Bob, split 3 ways)

### Household Needs
- Milk (2 liters, not purchased)
- Bread (1 loaf, purchased by Alice)
- Dish soap (1 bottle, not purchased)
- Toilet paper (12 rolls, purchased by Bob)
- Eggs (1 dozen, not purchased)
- Coffee (500g, purchased by Charlie)

### Payments
- Bob paid Alice $30
- Charlie paid Bob $25

### Notifications
- Welcome message for Alice
- Bob joined household
- Charlie joined household
- Chore assignment for Alice

## Notes

- The seed script truncates all existing data before seeding
- This is intended for development convenience
- Do not run in production without modifying the script
