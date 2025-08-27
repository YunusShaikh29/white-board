# 🚀 Deployment Guide for Excalidraw Clone

## Overview

This guide covers deploying your collaborative whiteboard application to production using modern, cost-effective serverless and containerized services.

## Architecture

- **Frontend**: Next.js app deployed to Vercel
- **HTTP API**: Express.js server deployed to Vercel Serverless
- **WebSocket**: Node.js server deployed to Railway
- **Database**: PostgreSQL on Neon.tech (serverless)

## Prerequisites

1. **Accounts Required**:
   - [Vercel](https://vercel.com) (Frontend + API)
   - [Railway](https://railway.app) (WebSocket)
   - [Neon](https://neon.tech) (Database)
   - [GitHub](https://github.com) (Source code + CI/CD)

2. **Local Tools**:
   - Node.js 20+
   - pnpm
   - Docker (optional, for local testing)

## Step-by-Step Deployment

### 1. Database Setup (Neon.tech)

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy the connection string (format: `postgresql://user:pass@host/db`)
4. Save as `DATABASE_URL` environment variable

### 2. Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend: `cd apps/whiteboard`
3. Deploy: `vercel --prod`
4. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_HTTP_BACKEND`: Your API URL
   - `NEXT_PUBLIC_WS_URL`: Your WebSocket URL
   - `DATABASE_URL`: Your Neon database URL

### 3. HTTP API Deployment (Vercel)

1. Navigate to API: `cd apps/http`
2. Deploy: `vercel --prod`
3. Set environment variables:
   - `DATABASE_URL`: Your Neon database URL
   - `JWT_SECRET`: Strong random string (generate with: `openssl rand -base64 32`)
   - `NODE_ENV`: `production`

### 4. WebSocket Deployment (Railway)

1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Create new service from repo
4. Set root directory to `apps/websocket`
5. Set environment variables:
   - `DATABASE_URL`: Your Neon database URL
   - `JWT_SECRET`: Same as HTTP API
   - `NODE_ENV`: `production`
   - `PORT`: `8081`

### 5. Database Migration

Run migrations against production database:

```bash
cd packages/db
DATABASE_URL="your-neon-url" pnpm prisma migrate deploy
```

### 6. CI/CD Setup (GitHub Actions)

1. Go to GitHub repository → Settings → Secrets and Variables → Actions
2. Add the following secrets:
   - `DATABASE_URL`: Your Neon database URL
   - `VERCEL_TOKEN`: From Vercel dashboard
   - `VERCEL_ORG_ID`: From Vercel project settings
   - `VERCEL_PROJECT_ID`: From Vercel project settings
   - `VERCEL_API_PROJECT_ID`: Separate project for API
   - `RAILWAY_TOKEN`: From Railway dashboard
   - `RAILWAY_SERVICE_ID`: From Railway project
   - `NEXT_PUBLIC_HTTP_BACKEND`: Your deployed API URL
   - `NEXT_PUBLIC_WS_URL`: Your deployed WebSocket URL

3. Push to `main` branch to trigger automatic deployment

## Local Development with Docker

For testing the full stack locally:

```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## Environment Variables Reference

### Frontend (apps/whiteboard)
```env
NEXT_PUBLIC_HTTP_BACKEND=https://your-api.vercel.app
NEXT_PUBLIC_WS_URL=wss://your-websocket.railway.app
```

### HTTP API (apps/http)
```env
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-super-secure-secret
NODE_ENV=production
PORT=5050
```

### WebSocket (apps/websocket)
```env
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-super-secure-secret
NODE_ENV=production
PORT=8081
```

## Cost Estimation

**Free Tier (Development/Low Traffic)**:
- Vercel: $0 (Hobby tier)
- Railway: $5/month (Starter)
- Neon: $0 (Free tier: 512MB RAM, 1GB storage)
- **Total: ~$5/month**

**Production (Medium Traffic)**:
- Vercel: $20/month (Pro tier)
- Railway: $10-20/month (usage-based)
- Neon: $19/month (Branch tier: 2GB RAM, 8GB storage)
- **Total: ~$50-60/month**

## Monitoring and Maintenance

### Health Checks
- Frontend: `https://your-domain.vercel.app/api/health`
- HTTP API: `https://your-api.vercel.app/health`
- WebSocket: `https://your-websocket.railway.app/health`

### Logs
- Vercel: Dashboard → Functions → View logs
- Railway: Dashboard → Deployments → View logs
- Neon: Dashboard → Monitoring

### Scaling
- **Frontend**: Auto-scales globally on Vercel
- **HTTP API**: Auto-scales with serverless functions
- **WebSocket**: Manually scale Railway instance
- **Database**: Upgrade Neon plan for more resources

## Troubleshooting

### Common Issues

1. **CORS Errors**: Update allowed origins in `apps/http/src/index.ts`
2. **WebSocket Connection Failed**: Check Railway logs and environment variables
3. **Database Connection**: Verify `DATABASE_URL` format and network access
4. **Build Failures**: Check dependencies and TypeScript errors

### Debugging Commands

```bash
# Check deployment status
vercel ls

# View Railway logs
railway logs

# Test database connection
cd packages/db && pnpm prisma studio

# Local development
pnpm dev
```

## Security Checklist

- [ ] Strong `JWT_SECRET` (32+ characters)
- [ ] CORS configured for production domains only
- [ ] Environment variables set correctly
- [ ] Database connection encrypted (Neon uses SSL by default)
- [ ] Health check endpoints accessible
- [ ] Error logging configured

## Rollback Procedure

1. **Frontend/API**: Use Vercel's 1-click rollback in dashboard
2. **WebSocket**: Redeploy previous commit via Railway
3. **Database**: Revert migrations if needed (rare, plan schema changes carefully)

## Support

For deployment issues:
1. Check service status pages (Vercel, Railway, Neon)
2. Review application logs
3. Verify environment variables
4. Test locally with production environment variables

---

**Need help?** Open an issue in the repository with deployment logs and error messages.
