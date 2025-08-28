# HTTP API Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/common/package.json ./packages/common/
COPY packages/backend-common/package.json ./packages/backend-common/
COPY apps/http/package.json ./apps/http/

# Install dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
# Generate Prisma client
RUN pnpm prisma generate --schema=packages/db/prisma/schema.prisma

# Build the HTTP server
RUN cd apps/http && pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/apps/http/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/http/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 5050

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5050/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
