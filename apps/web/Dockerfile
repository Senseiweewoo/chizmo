# Stage 1: Base & Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY packages/core/package*.json ./packages/core/
COPY packages/db/package*.json ./packages/db/
COPY packages/ai/package*.json ./packages/ai/
COPY apps/web/package*.json ./apps/web/
COPY apps/realtime/package*.json ./apps/realtime/
COPY apps/worker/package*.json ./apps/worker/
RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run db:generate
RUN npm run build:packages
RUN npm run build --workspace=@chizmo/web

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app ./

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=@chizmo/web"]
