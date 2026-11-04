# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY packages/core/package*.json ./packages/core/
COPY packages/db/package*.json ./packages/db/
COPY packages/ai/package*.json ./packages/ai/
COPY apps/worker/package*.json ./apps/worker/
COPY apps/realtime/package*.json ./apps/realtime/
COPY apps/web/package*.json ./apps/web/
RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate
RUN npm run build:packages
RUN npm run build --workspace=@chizmo/worker

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./

CMD ["node", "apps/worker/dist/index.js"]
