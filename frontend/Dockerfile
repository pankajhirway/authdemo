# Dockerfile for AuthzAuthn Demo Frontend
# Multi-stage build for optimal layer caching

# Stage 1: Dependencies
FROM node:20-slim AS dependencies

# Set environment variables
ENV NODE_ENV=development \
    npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_dedupe=false

# Set work directory
WORKDIR /app/frontend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Stage 2: Development
FROM node:20-slim

# Set environment variables
ENV NODE_ENV=development \
    npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_dedupe=false

# Set work directory
WORKDIR /app/frontend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies from previous stage
COPY --from=dependencies --chown=node:node /app/frontend/node_modules ./node_modules

# Copy package files
COPY package*.json ./

# Copy application code
COPY . .

# Create non-root user (UID 1000 to match backend pattern)
RUN useradd -m -u 1000 nodeuser && chown -R nodeuser:node /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Run Vite dev server with host binding for Docker network
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
