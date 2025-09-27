FROM debian:12-slim

# Install base dependencies and runtime requirements
# Add PostgreSQL 17 official repository
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    wget \
    ca-certificates \
    gnupg \
    lsb-release \
    build-essential \
    curl \
    bash \
    tar \
    xz-utils \
    supervisor \
    tini \
    gosu \
    dpkg-dev \
    gcc \
    g++ \
    libc6-dev \
    libssl-dev \
    make \
    git \
    cmake \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
    && echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y --no-install-recommends \
    postgresql-17 \
    postgresql-contrib-17 \
    postgresql-client-17 \
    && cd /usr/src \
    && wget -O redis-stable.tar.gz https://github.com/redis/redis/archive/refs/tags/8.2.1.tar.gz \
    && tar xf redis-stable.tar.gz \
    && cd redis-8.2.1 \
    && export BUILD_TLS=yes \
    && make -j "$(nproc)" all \
    && make install \
    && cd / \
    && rm -rf /usr/src/redis* \
    && adduser --system --group --no-create-home redis \
    && apt-get remove -y build-essential wget gnupg lsb-release dpkg-dev gcc g++ libc6-dev libssl-dev make cmake \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory and copy .tool-versions
WORKDIR /app
COPY .tool-versions ./

# Install Node.js and pnpm based on .tool-versions
RUN NODE_VERSION=$(cat .tool-versions | grep 'nodejs' | cut -d ' ' -f 2) && \
    PNPM_VERSION=$(cat .tool-versions | grep 'pnpm' | cut -d ' ' -f 2) && \
    ARCH=$(uname -m) && \
    echo "Installing Node.js v${NODE_VERSION} and pnpm v${PNPM_VERSION} for ${ARCH}" && \
    \
    # Map architecture names for Node.js official builds
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then \
        NODE_ARCH="arm64"; \
    elif [ "$ARCH" = "x86_64" ]; then \
        NODE_ARCH="x64"; \
    else \
        echo "Unsupported architecture: ${ARCH}" && exit 1; \
    fi && \
    \
    # Download and install official Node.js glibc build
    curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" -o node-official.tar.xz && \
    tar -xJf node-official.tar.xz --strip-components=1 -C /usr/local && \
    rm node-official.tar.xz && \
    \
    # Install pnpm
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then \
        curl -fsSL "https://github.com/pnpm/pnpm/releases/download/v${PNPM_VERSION}/pnpm-linuxstatic-arm64" -o /usr/local/bin/pnpm; \
    else \
        curl -fsSL "https://github.com/pnpm/pnpm/releases/download/v${PNPM_VERSION}/pnpm-linuxstatic-x64" -o /usr/local/bin/pnpm; \
    fi && \
    chmod +x /usr/local/bin/pnpm && \
    \
    # Verify installations
    echo "Final versions installed:" && \
    node -v && \
    pnpm -v && \
    \
    # verify that node -v matches .tool-versions nodejs version
    if [ "$(node -v)" != "v${NODE_VERSION}" ]; then \
        echo "Node.js version mismatch"; \
        exit 1; \
    fi && \
    # verify that pnpm -v matches .tool-versions pnpm version
    if [ "$(pnpm -v)" != "${PNPM_VERSION}" ]; then \
        echo "pnpm version mismatch"; \
        exit 1; \
    fi

# Copy package files
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/docs/package.json ./apps/docs/
COPY apps/gateway/package.json ./apps/gateway/
COPY apps/playground/package.json ./apps/playground/
COPY apps/ui/package.json ./apps/ui/
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/models/package.json ./packages/models/
COPY packages/logger/package.json ./packages/logger/
COPY packages/cache/package.json ./packages/cache/
COPY packages/instrumentation/package.json ./packages/instrumentation/
COPY packages/shared/package.json ./packages/shared/

# Copy source code
COPY . .

# Install all dependencies, build, then prune to production only
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    --mount=type=cache,target=/app/.turbo \
    pnpm install --frozen-lockfile && \
    pnpm build && \
    # Remove all dev dependencies after build
    pnpm prune --prod && \
    # Clean up source files that are not needed at runtime
    find . -name "*.ts" -not -path "*/node_modules/*" -not -name "*.d.ts" -delete && \
    find . -name "*.tsx" -not -path "*/node_modules/*" -delete && \
    find . -name "*.map" -not -path "*/node_modules/*" -delete && \
    find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find . -name "tsconfig.tsbuildinfo" -delete && \
    rm -rf apps/*/src packages/*/src && \
    # Remove unnecessary Next.js cache and build files
    rm -rf apps/*/.next/cache && \
    # Clean up package manager files
    rm -rf .pnpm-store

# Copy database init scripts
COPY packages/db/init/ /docker-entrypoint-initdb.d/

# Copy migrations to the API directory where they're expected
RUN cp -r /app/packages/db/migrations /app/apps/api/migrations

# Create directories with correct ownership
RUN mkdir -p /var/log/supervisor /var/log/postgresql /run/postgresql && \
    mkdir -p /var/lib/postgresql/data && \
    chown -R postgres:postgres /var/lib/postgresql && \
    chmod 755 /var/lib/postgresql && \
    chmod 700 /var/lib/postgresql/data && \
    touch /var/log/postgresql.log && \
    chown postgres:postgres /var/log/postgresql.log && \
    chown postgres:postgres /run/postgresql && \
    mkdir -p /var/lib/redis && \
    chown redis:redis /var/lib/redis && \
    chmod 755 /var/lib/redis

# Configure Supervisor
COPY infra/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Update supervisord.conf to use the correct paths
RUN sed -i 's|/app/services/ui|/app/apps/ui|g' /etc/supervisor/conf.d/supervisord.conf && \
    sed -i 's|/app/services/playground|/app/apps/playground|g' /etc/supervisor/conf.d/supervisord.conf && \
    sed -i 's|/app/services/docs|/app/apps/docs|g' /etc/supervisor/conf.d/supervisord.conf && \
    sed -i 's|/app/services/api|/app/apps/api|g' /etc/supervisor/conf.d/supervisord.conf && \
    sed -i 's|/app/services/gateway|/app/apps/gateway|g' /etc/supervisor/conf.d/supervisord.conf && \
    sed -i 's|/app/services/worker|/app/apps/worker|g' /etc/supervisor/conf.d/supervisord.conf

# Create startup script
COPY infra/start.sh /start.sh
RUN chmod +x /start.sh

# Expose ports
EXPOSE 3002 3003 3005 4001 4002 5432 6379

# Set environment variables
ENV NODE_ENV=production
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=llmgateway
ENV POSTGRES_DB=llmgateway
ENV DATABASE_URL=postgres://postgres:llmgateway@localhost:5432/llmgateway
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379
ENV TELEMETRY_ACTIVE=true
ENV RUN_MIGRATIONS=true

# Use tini as init system
ENTRYPOINT ["/usr/bin/tini", "--"]

ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION

# Start all services
CMD ["/start.sh"]
