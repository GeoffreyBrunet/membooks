FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies (cached layer)
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Build
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Production
FROM base AS release
COPY --from=deps /app/node_modules node_modules
COPY --from=build /app/dist dist
COPY --from=build /app/src/server.ts src/server.ts
COPY --from=build /app/src/index.html src/index.html
COPY package.json .

USER bun
EXPOSE 3001
CMD ["bun", "run", "src/server.ts"]
