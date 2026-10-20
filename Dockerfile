# Dockerfile for HiwKhaw TU Rangsit (CS261 Sprint 1)
# Multi-stage build for optimal image size and zero-config run

# ==========================================
# Stage 1: Build Frontend (Vite + React)
# ==========================================
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Server (Node.js Express)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built frontend from Stage 1 into client/dist
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "server/index.js"]
