FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/

RUN bun install
RUN bunx prisma generate

COPY . .

RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
CMD ["bun", "run", "src/services/market/index.ts"]
