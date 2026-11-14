# Dockerfile for TU Canteen Runnable Web Application
FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm install --production

# Copy application files
COPY . .

# Expose port 3000
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
