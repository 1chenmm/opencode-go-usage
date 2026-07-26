# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build deps (includes Python for better-sqlite3 native addon)
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
RUN pnpm install

COPY . .
RUN pnpm build

# ─── Runtime Stage ────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ dumb-init

# Copy pnpm + deps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy backend source (TypeScript)
COPY --from=builder /app/electron ./electron

# Copy server entry
COPY --from=builder /app/server ./server

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Add tsconfig for server
COPY tsconfig.server.json ./

# Compile server + backend TypeScript
RUN npx tsc --project tsconfig.server.json

EXPOSE 8788

ENV NODE_ENV=production
ENV 68BACKEND_DATA=/app/data
ENV 68BACKEND_LISTEN_HOST=0.0.0.0
ENV 68BACKEND_LISTEN_PORT=8788

VOLUME ["/app/data"]

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist-server/server/index.js"]
