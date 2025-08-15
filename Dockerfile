# Multi-stage Dockerfile for Relife Smart Alarm App
# Optimized for production deployment with performance monitoring

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Copy package files
COPY package*.json ./
COPY bun.lock* ./

# Install bun for faster package management
RUN npm install -g bun

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Set build arguments for environment configuration
ARG NODE_ENV=production
ARG VITE_APP_ENV=production
ARG VITE_APP_VERSION
ARG VITE_BUILD_TIME
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
ARG VITE_SENTRY_DSN
ARG VITE_PERFORMANCE_MONITORING=true
ARG VITE_PERFORMANCE_ENDPOINT
ARG VITE_ANALYTICS_ENDPOINT

# Set environment variables for build
ENV NODE_ENV=${NODE_ENV}
ENV VITE_APP_ENV=${VITE_APP_ENV}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
ENV VITE_BUILD_TIME=${VITE_BUILD_TIME}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_POSTHOG_KEY=${VITE_POSTHOG_KEY}
ENV VITE_POSTHOG_HOST=${VITE_POSTHOG_HOST}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
ENV VITE_PERFORMANCE_MONITORING=${VITE_PERFORMANCE_MONITORING}
ENV VITE_PERFORMANCE_ENDPOINT=${VITE_PERFORMANCE_ENDPOINT}
ENV VITE_ANALYTICS_ENDPOINT=${VITE_ANALYTICS_ENDPOINT}

# Build the application
RUN bun run build

# Stage 2: Production stage with nginx
FROM nginx:alpine AS production

# Install additional tools for health checks and monitoring
RUN apk add --no-cache \
    curl \
    jq \
    bash \
    htop

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy static assets with proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

# Create directory for nginx cache and logs
RUN mkdir -p /var/cache/nginx/client_temp \
    && mkdir -p /var/log/nginx \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx

# Copy health check script
COPY docker/health-check.sh /usr/local/bin/health-check.sh
RUN chmod +x /usr/local/bin/health-check.sh

# Copy startup script
COPY docker/startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup \
    && adduser -S appuser -u 1001 -G appgroup

# Set up proper permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/log/nginx

# Expose port 80 and 443
EXPOSE 80 443

# Add labels for container metadata
LABEL maintainer="Relife Team <team@relife.app>" \
      version="${VITE_APP_VERSION}" \
      description="Relife Smart Alarm App - Production Container" \
      build_time="${VITE_BUILD_TIME}"

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Set startup command
CMD ["/usr/local/bin/startup.sh"]

# Stage 3: Development stage (optional)
FROM node:20-alpine AS development

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Install bun
RUN npm install -g bun

# Copy package files
COPY package*.json ./
COPY bun.lock* ./

# Install dependencies including dev dependencies
RUN bun install

# Copy source code
COPY . .

# Expose development port
EXPOSE 3000

# Set development environment
ENV NODE_ENV=development
ENV VITE_APP_ENV=development

# Health check for development
HEALTHCHECK --interval=60s --timeout=10s --start-period=10s --retries=2 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start development server
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]

# Stage 4: Testing stage
FROM node:20-alpine AS testing

WORKDIR /app

# Install system dependencies and testing tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Install bun
RUN npm install -g bun

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./
COPY bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Set testing environment
ENV NODE_ENV=test
ENV VITE_APP_ENV=test

# Run tests by default
CMD ["bun", "run", "test"]