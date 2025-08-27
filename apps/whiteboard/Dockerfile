# Frontend (Next.js) Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/common/package.json ./packages/common/
COPY packages/ui/package.json ./packages/ui/
COPY apps/whiteboard/package.json ./apps/whiteboard/

# Install dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Next.js application
RUN cd apps/whiteboard && pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy Next.js build output
COPY --from=builder --chown=nodejs:nodejs /app/apps/whiteboard/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/whiteboard/.next/static ./apps/whiteboard/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/whiteboard/public ./apps/whiteboard/public

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the server
CMD ["node", "apps/whiteboard/server.js"]
