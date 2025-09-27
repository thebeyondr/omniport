# Base builder with Node.js and pnpm
FROM debian:12-slim AS base-builder

# Install base dependencies including tini for better caching
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    curl \
    bash \
    tar \
    xz-utils \
    ca-certificates \
    tini \
    && rm -rf /var/lib/apt/lists/* \
    && /usr/bin/tini --version

# Create app directory
WORKDIR /app

# Copy .tool-versions to get Node.js and pnpm versions
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

# verify that pnpm store path
RUN STORE_PATH="/root/.local/share/pnpm/store" && \
    if [ "${STORE_PATH#/root/.local/share/pnpm/store}" = "${STORE_PATH}" ]; then \
        echo "pnpm store path mismatch: ${STORE_PATH}"; \
        exit 1; \
    fi && \
    echo "pnpm store path matches: ${STORE_PATH}"

# Copy package files
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
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

# Builder for API
FROM base-builder AS api-builder
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=api... install --frozen-lockfile
RUN --mount=type=cache,target=/app/.turbo pnpm --filter=api... build

# Builder for Gateway
FROM base-builder AS gateway-builder
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=gateway... install --frozen-lockfile
RUN --mount=type=cache,target=/app/.turbo pnpm --filter=gateway... build

# Builder for UI
FROM base-builder AS ui-builder
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=ui... install --frozen-lockfile
RUN --mount=type=cache,target=/app/.turbo pnpm --filter=ui... build

# Builder for Playground
FROM base-builder AS playground-builder
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=playground... install --frozen-lockfile
RUN --mount=type=cache,target=/app/.turbo pnpm --filter=playground... build

# Builder for Worker
FROM base-builder AS worker-builder
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=worker... install --frozen-lockfile
RUN --mount=type=cache,target=/app/.turbo pnpm --filter=worker... build

# Builder for Docs
FROM base-builder AS docs-builder
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=docs... install --frozen-lockfile
RUN --mount=type=cache,target=/app/.turbo pnpm --filter=docs... build

FROM debian:12-slim AS runtime

# Install base runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends bash && rm -rf /var/lib/apt/lists/*

# copy nodejs, pnpm, and tini from base-builder stage
COPY --from=base-builder /usr/local/bin/node /usr/local/bin/node
COPY --from=base-builder /usr/local/bin/pnpm /usr/local/bin/pnpm
COPY --from=base-builder /usr/bin/tini /tini

# Verify installations
RUN node -v && pnpm -v

ENTRYPOINT ["/tini", "--"]

ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION

# API preparation stage
FROM api-builder AS api-prep
WORKDIR /app
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=api --prod deploy /app/api-dist

# API runtime stage
FROM runtime AS api
WORKDIR /app
COPY --from=api-prep /app/api-dist ./
# copy migrations files for API service to run migrations at runtime
COPY --from=api-builder /app/packages/db/migrations ./migrations
EXPOSE 80
ENV PORT=80
ENV NODE_ENV=production
ENV TELEMETRY_ACTIVE=true
CMD ["node", "--enable-source-maps", "dist/serve.js"]

# Gateway preparation stage
FROM gateway-builder AS gateway-prep
WORKDIR /app
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=gateway --prod deploy /app/gateway-dist

# Gateway runtime stage
FROM runtime AS gateway
WORKDIR /app
COPY --from=gateway-prep /app/gateway-dist ./
EXPOSE 80
ENV PORT=80
ENV NODE_ENV=production
CMD ["node", "--enable-source-maps", "dist/serve.js"]

# UI preparation stage
FROM ui-builder AS ui-prep
WORKDIR /app
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=ui --prod deploy /app/ui-dist

# UI runtime stage
FROM runtime AS ui
WORKDIR /app
COPY --from=ui-prep /app/ui-dist ./
EXPOSE 80
ENV PORT=80
ENV NODE_ENV=production
CMD ["./node_modules/.bin/next", "start"]

# Playground preparation stage
FROM playground-builder AS playground-prep
WORKDIR /app
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=playground --prod deploy /app/playground-dist

# Playground runtime stage
FROM runtime AS playground
WORKDIR /app
COPY --from=playground-prep /app/playground-dist ./
EXPOSE 80
ENV PORT=80
ENV NODE_ENV=production
CMD ["./node_modules/.bin/next", "start"]

# Worker preparation stage
FROM worker-builder AS worker-prep
WORKDIR /app
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=worker --prod deploy /app/worker-dist

# Worker runtime stage
FROM runtime AS worker
WORKDIR /app
COPY --from=worker-prep /app/worker-dist ./
ENV NODE_ENV=production
CMD ["node", "--enable-source-maps", "dist/index.js"]

# Docs preparation stage
FROM docs-builder AS docs-prep
WORKDIR /app
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm --filter=docs --prod deploy /app/docs-dist

# Docs runtime stage
FROM runtime AS docs
WORKDIR /app
COPY --from=docs-prep /app/docs-dist ./
EXPOSE 80
ENV PORT=80
ENV NODE_ENV=production
CMD ["./node_modules/.bin/next", "start", "-H", "0.0.0.0"]
