import { PrismaClient, Role, MarketStatus, ResolutionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

const USERS = [
  { email: "admin@example.com", password: "admin123", displayName: "Admin", role: Role.ADMIN, balance: 10000 },
  { email: "resolver@example.com", password: "resolver123", displayName: "Resolver", role: Role.RESOLVER, balance: 5000 },
  { email: "user@example.com", password: "user123", displayName: "User", role: Role.USER, balance: 1000 },
] as const;

const MARKETS = [
  {
    title: "Will Bitcoin reach $100k by end of 2026?",
    description: "Resolves YES if the price of Bitcoin (BTC/USD) reaches or exceeds $100,000 at any point before December 31, 2026 23:59 UTC.",
    status: MarketStatus.ACTIVE,
    closeDate: new Date("2026-12-31T23:59:00Z"),
    yesPrice: 0.65,
    noPrice: 0.35,
  },
  {
    title: "Will ChatGPT-5 be released before 2026?",
    description: "Resolves YES if OpenAI publicly releases a model officially named GPT-5 or ChatGPT-5 before January 1, 2026 00:00 UTC.",
    status: MarketStatus.CLOSED,
    closeDate: new Date("2025-12-31T23:59:00Z"),
    yesPrice: 0.72,
    noPrice: 0.28,
  },
  {
    title: "Did Thailand qualify for the 2026 World Cup?",
    description: "Resolves YES if the Thailand national football team qualifies for the 2026 FIFA World Cup.",
    status: MarketStatus.RESOLVED,
    closeDate: new Date("2025-06-30T23:59:00Z"),
    resolvedAt: new Date("2025-07-01T12:00:00Z"),
    yesPrice: 0.85,
    noPrice: 0.15,
  },
] as const;

async function upsertUser(userData: (typeof USERS)[number]) {
  const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email: userData.email },
    update: { displayName: userData.displayName, role: userData.role, passwordHash },
    create: { email: userData.email, passwordHash, displayName: userData.displayName, role: userData.role },
  });

  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: { balance: userData.balance },
    create: { userId: user.id, balance: userData.balance },
  });

  return user;
}

async function upsertMarketWithOptions(
  marketData: (typeof MARKETS)[number],
  creatorId: string,
  resolverId: string
) {
  const existingMarket = await prisma.market.findFirst({
    where: { title: marketData.title },
  });

  const market = existingMarket
    ? await prisma.market.update({
        where: { id: existingMarket.id },
        data: {
          status: marketData.status,
          closeDate: marketData.closeDate,
          resolvedAt: "resolvedAt" in marketData ? marketData.resolvedAt : null,
          resolverId,
        },
      })
    : await prisma.market.create({
        data: {
          title: marketData.title,
          description: marketData.description,
          status: marketData.status,
          creatorId,
          resolverId,
          closeDate: marketData.closeDate,
          resolvedAt: "resolvedAt" in marketData ? marketData.resolvedAt : null,
        },
      });

  const yesOption = await upsertMarketOption(market.id, "YES", marketData.yesPrice);
  const noOption = await upsertMarketOption(market.id, "NO", marketData.noPrice);

  return { market, yesOption, noOption };
}

async function upsertMarketOption(marketId: string, label: string, price: number) {
  return prisma.marketOption.upsert({
    where: { marketId_label: { marketId, label } },
    update: { currentPrice: price },
    create: { marketId, label, currentPrice: price },
  });
}

async function createResolution(marketId: string, resolverId: string, winningOptionId: string) {
  const existing = await prisma.resolution.findUnique({ where: { marketId } });
  if (existing) {
    return prisma.resolution.update({
      where: { marketId },
      data: { resolverId, winningOptionId, status: ResolutionStatus.RESOLVED, resolvedAt: new Date("2025-07-01T12:00:00Z") },
    });
  }

  return prisma.resolution.create({
    data: {
      marketId,
      resolverId,
      winningOptionId,
      status: ResolutionStatus.RESOLVED,
      evidenceUrl: "https://www.fifa.com/tournaments/mens/worldcup/26",
      notes: "Thailand did not qualify for the 2026 FIFA World Cup.",
      resolvedAt: new Date("2025-07-01T12:00:00Z"),
    },
  });
}

async function main() {
  console.log("Seeding database...");

  const [admin, resolver, user] = await Promise.all(USERS.map(upsertUser));

  console.log(`Created users: ${admin.email}, ${resolver.email}, ${user.email}`);

  const [activeMarket, closedMarket, resolvedMarket] = await Promise.all(
    MARKETS.map((m) => upsertMarketWithOptions(m, admin.id, resolver.id))
  );

  console.log(`Created markets: ${activeMarket.market.title}, ${closedMarket.market.title}, ${resolvedMarket.market.title}`);

  await createResolution(resolvedMarket.market.id, resolver.id, resolvedMarket.noOption.id);

  console.log("Created resolution for resolved market");
  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
