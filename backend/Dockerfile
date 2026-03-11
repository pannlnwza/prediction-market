FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/

RUN bun install
RUN bunx prisma generate

COPY . .

EXPOSE 3001 3002 3003 3004 3005

CMD ["bun", "run", "src/services/market/index.ts"]
