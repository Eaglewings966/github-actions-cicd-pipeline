# Production Dockerfile
# Author: Emmanuel Ubani - Cloud & DevOps Engineer

# Stage 1 - Build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY app/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2 - Production
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY app/ .

# Set ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=5s \
            --retries=3 \
  CMD wget --no-verbose \
      --tries=1 \
      --spider \
      http://localhost:3000/health \
      || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start application
CMD ["node", "index.js"] 