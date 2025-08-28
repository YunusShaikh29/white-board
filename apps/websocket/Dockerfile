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
RUN cd packages/db && npx prisma generate

# Build workspace packages that need compilation
RUN cd packages/common && npx tsc src/types.ts --outDir dist --target es2020 --module esnext --moduleResolution node --declaration
RUN cd packages/backend-common && npx tsc src/index.ts --outDir dist --target es2020 --module esnext --moduleResolution node --declaration
RUN cd packages/db && npx tsc src/index.ts --outDir dist --target es2020 --module esnext --moduleResolution node --declaration

# Update package.json exports to point to compiled JS files for production
RUN sed -i 's|"./types": "./src/types.ts"|"./types": "./dist/types.js"|g' packages/common/package.json
RUN sed -i 's|"./config": "./src/index.ts"|"./config": "./dist/index.js"|g' packages/backend-common/package.json
RUN sed -i 's|"./index": "./src/index.ts"|"./index": "./dist/index.js"|g' packages/db/package.json

# Build the WebSocket server
RUN cd apps/websocket && pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy the entire workspace to maintain dependency structure
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/websocket ./apps/websocket

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8081/health || exit 1

# Start the server from the correct directory
WORKDIR /app/apps/websocket
CMD ["node", "dist/index.js"]
