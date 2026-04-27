# Setting Up Homebase Locally

This guide will walk you through setting up the Homebase application on your local machine for development.

## 1. Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)
- **PostgreSQL** (v14 or higher)

## 2. Clone the Repository

```bash
git clone <repository-url>
cd Homebase
```

## 3. Backend Configuration

Navigate to the `backend` directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Open `.env` and configure the following variables:
- `DATABASE_URL`: Your PostgreSQL connection string (e.g., `postgresql://user:password@localhost:5432/homebase`)
- `JWT_SECRET`: A secure random string for signing JWT tokens.
- `FRONTEND_URL`: `http://localhost:5173` (for local development)

Generate the Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

(Optional) Seed the database with initial data:

```bash
npx prisma db seed
```

Start the backend server:

```bash
npm run start:dev
```

## 4. Frontend Configuration

Navigate to the `frontend` directory and install dependencies:

```bash
cd ../frontend
npm install
```

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Open `.env` and set:
- `VITE_API_URL`: `http://localhost:3000` (or whichever port your backend is running on)

Start the frontend development server:

```bash
npm run dev
```

## 5. Verify Installation

Once both servers are running, open your browser and navigate to `http://localhost:5173`. You should see the Homebase landing page and be able to register or log in.
