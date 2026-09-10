# --- Base Node Alpine Image ---
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- Dependencies Stage ---
FROM base AS deps
COPY package*.json ./
COPY apps/gateway/package*.json ./apps/gateway/
COPY packages/database/package*.json ./packages/database/
RUN npm ci --workspace=apps/gateway --workspace=packages/database

# --- Build Stage ---
FROM deps AS builder
WORKDIR /app
COPY packages/database ./packages/database
RUN npm run generate --workspace=packages/database

COPY apps/gateway ./apps/gateway
RUN npm run build --workspace=apps/gateway

# --- Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002

# Copy dependencies and build artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/gateway/dist ./apps/gateway/dist
COPY --from=builder /app/apps/gateway/package.json ./apps/gateway/package.json

EXPOSE 3002

CMD ["npm", "run", "start", "--workspace=apps/gateway"]
