# ==========================================
# Stage 1: Build React Frontend
# ==========================================
FROM node:23-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Express Backend
# ==========================================
FROM node:23-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

# ==========================================
# Stage 3: Production Runner
# ==========================================
FROM node:23-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_PATH=/app/server/data/habits.db \
    MIGRATIONS_DIR=/app/server/migrations \
    CLIENT_DIST_PATH=/app/client/dist

# Install only production dependencies for the server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled backend and migrations
COPY --from=server-builder /app/server/dist ./dist
COPY server/migrations ./migrations

# Copy compiled frontend static assets
COPY --from=client-builder /app/client/dist /app/client/dist

# Prepare persistent data directory for SQLite
RUN mkdir -p /app/server/data

EXPOSE 3001

CMD ["node", "dist/index.js"]
