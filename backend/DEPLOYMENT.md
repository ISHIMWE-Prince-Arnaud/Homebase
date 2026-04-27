# Backend Deployment Guide - Render.com

This guide explains how to deploy the Homebase backend API to Render.com.

## Prerequisites

1. A [Render.com](https://render.com) account
2. This repository pushed to GitHub
3. Your frontend deployed (we'll need the URL for CORS)

## Quick Deploy (Render Blueprint)

The easiest way to deploy is using the `render.yaml` blueprint:

1. Push this code to GitHub
2. In Render dashboard, click **"New +"** → **"Blueprint"**
3. Connect your GitHub repo
4. Render will automatically:
   - Create a PostgreSQL database
   - Create a Web Service for the API
   - Run migrations on each deploy
   - Set up environment variables

## Manual Deploy (Step by Step)

### 1. Create PostgreSQL Database

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Name: `homebase-db`
3. Plan: **Starter** ($7/month) or higher
4. Keep other defaults
5. Click **"Create Database"**
6. Copy the **Internal Database URL** (you'll need it later)

### 2. Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `homebase-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your deployment branch)
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm install && npm run build && npx prisma migrate deploy
     ```
   - **Start Command**: 
     ```bash
     npm run start:prod
     ```
   - **Plan**: Starter ($7/month) minimum

### 3. Configure Environment Variables

Add these environment variables in Render dashboard:

| Key | Value | Required |
|-----|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `10000` | Yes |
| `DATABASE_URL` | Copy from your PostgreSQL database | Yes |
| `JWT_SECRET` | Run `node scripts/jwt-secret.js` locally | Yes |
| `JWT_EXPIRATION` | `604800` | Yes |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Yes |
| `THROTTLE_TTL_SHORT` | `60000` | No |
| `THROTTLE_LIMIT_SHORT` | `5` | No |
| `THROTTLE_TTL_MEDIUM` | `900000` | No |
| `THROTTLE_LIMIT_MEDIUM` | `60` | No |
| `THROTTLE_TTL_LONG` | `3600000` | No |
| `THROTTLE_LIMIT_LONG` | `200` | No |

### 4. Generate JWT Secret

Locally run:
```bash
node scripts/jwt-secret.js
```

Copy the output and set it as `JWT_SECRET` in Render.

### 5. Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. First deploy will run migrations and create database tables
4. Health check endpoint: `https://your-api-url.onrender.com/health`

## Post-Deployment

### Verify Deployment

Check these endpoints:
- `GET /health` - Overall health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### Connect Frontend

Update your frontend `.env`:
```
VITE_API_URL=https://your-api-url.onrender.com
```

### Database Migrations

Migrations run automatically on each deploy via the build command. To run manually:
```bash
npx prisma migrate deploy
```

### Database Seeding (Optional)

To seed initial data:
1. Go to Render dashboard → Shell for your service
2. Run:
   ```bash
   npx prisma db seed
   ```

## Troubleshooting

### Migration Failures

If migrations fail:
1. Check Render logs
2. Ensure `DATABASE_URL` is correct
3. Run locally to debug:
   ```bash
   npx prisma migrate status
   ```

### CORS Errors

Ensure `FRONTEND_URL` matches your actual frontend URL exactly (including `https://`).

### WebSocket Issues

WebSockets work on Render, but note:
- Render free tier has 15-minute idle timeout
- WebSocket connections may drop after inactivity

## Production Checklist

- [ ] Database created and migrations successful
- [ ] JWT_SECRET generated and set
- [ ] FRONTEND_URL set to production frontend
- [ ] Health check endpoint responding 200
- [ ] Frontend API URL updated
- [ ] CORS working (test login from frontend)
- [ ] WebSocket connections working (if applicable)

## Cost Estimate

- **PostgreSQL (Starter)**: ~$7/month
- **Web Service (Starter)**: ~$7/month
- **Total**: ~$14/month minimum

For hobby projects, Render offers a free tier with:
- 1 free PostgreSQL (expires after 90 days)
- 1 free Web Service (sleeps after 15 min idle)
