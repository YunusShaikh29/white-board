# WebSocket Server Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/common/package.json ./packages/common/
COPY packages/backend-common/package.json ./packages/backend-common/
COPY apps/websocket/package.json ./apps/websocket/

# Install dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN cd packages/db && pnpm prisma generate

# Build the WebSocket server
RUN cd apps/websocket && pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/apps/websocket/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/websocket/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8081/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
