import { PrismaClient, Role, MarketStatus, ResolutionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

const USERS = [
  { email: "admin@example.com", password: "admin123", displayName: "Admin", role: Role.ADMIN, balance: 10000 },
  { email: "resolver@example.com", password: "resolver123", displayName: "Resolver", role: Role.RESOLVER, balance: 5000 },
  { email: "user@example.com", password: "user123", displayName: "Alice", role: Role.USER, balance: 1000 },
  { email: "bob@example.com", password: "bob123", displayName: "Bob", role: Role.USER, balance: 1000 },
  { email: "charlie@example.com", password: "charlie123", displayName: "Charlie", role: Role.USER, balance: 1000 },
] as const;

const MARKETS: {
  title: string;
  description: string;
  category: string;
  status: MarketStatus;
  closeDate: Date;
  yesPrice: number;
  noPrice: number;
  resolvedAt?: Date;
}[] = [
  { title: "Will Bitcoin reach $150k by end of 2026?", description: "Resolves YES if BTC/USD reaches $150,000 on any major exchange before Dec 31, 2026.", category: "Crypto", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.42, noPrice: 0.58 },
  { title: "Will Tesla stock exceed $400 by Q3 2026?", description: "Resolves YES if TSLA closing price exceeds $400 before Oct 1, 2026.", category: "Finance", status: MarketStatus.ACTIVE, closeDate: new Date("2026-09-30"), yesPrice: 0.55, noPrice: 0.45 },
  { title: "Will GPT-5 be released before July 2026?", description: "Resolves YES if OpenAI releases GPT-5 before July 1, 2026.", category: "Tech", status: MarketStatus.ACTIVE, closeDate: new Date("2026-07-01"), yesPrice: 0.73, noPrice: 0.27 },
  { title: "Will the Fed cut rates below 3% by end of 2026?", description: "Resolves YES if Federal Funds Rate target is below 3.00% on Dec 31, 2026.", category: "Finance", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.31, noPrice: 0.69 },
  { title: "Will Apple release a foldable device in 2026?", description: "Resolves YES if Apple ships a foldable iPhone or iPad by Dec 31, 2026.", category: "Tech", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.18, noPrice: 0.82 },
  { title: "Will Thailand's GDP growth exceed 4% in 2026?", description: "Resolves YES if Thailand's annual real GDP growth exceeds 4.0% as reported by BOT.", category: "Finance", status: MarketStatus.ACTIVE, closeDate: new Date("2027-03-31"), yesPrice: 0.35, noPrice: 0.65 },
  { title: "Will Spotify reach 700M monthly users in 2026?", description: "Resolves YES if Spotify reports 700M+ MAUs in any 2026 quarterly earnings.", category: "Tech", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.61, noPrice: 0.39 },
  { title: "Will a major earthquake (7.0+) hit Japan in 2026?", description: "Resolves YES if USGS records a 7.0+ earthquake in Japan before Dec 31, 2026.", category: "Science", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.45, noPrice: 0.55 },
  { title: "Will Ethereum ETF be approved in 2026?", description: "Resolves YES if SEC approves a spot Ethereum ETF by Dec 31, 2026.", category: "Crypto", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.78, noPrice: 0.22 },
  { title: "Will global temperature exceed 1.5°C above pre-industrial in 2026?", description: "Resolves YES if annual global mean temp exceeds 1.5°C above baseline per WMO.", category: "Science", status: MarketStatus.ACTIVE, closeDate: new Date("2027-01-31"), yesPrice: 0.67, noPrice: 0.33 },
  { title: "Will there be a ceasefire in Ukraine by end of 2026?", description: "Resolves YES if a formal ceasefire agreement is signed before Dec 31, 2026.", category: "Politics", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.28, noPrice: 0.72 },
  { title: "Will Manchester City win the Premier League 2025-26?", description: "Resolves YES if Manchester City wins the 2025-26 Premier League title.", category: "Sports", status: MarketStatus.ACTIVE, closeDate: new Date("2026-06-01"), yesPrice: 0.40, noPrice: 0.60 },
  { title: "Will a Thai team reach AFC Champions League semifinals?", description: "Resolves YES if any Thai club reaches the ACL semifinals in 2026.", category: "Sports", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.12, noPrice: 0.88 },
  { title: "Will US inflation drop below 2% in 2026?", description: "Resolves YES if US CPI year-over-year drops below 2.0% in any 2026 report.", category: "Finance", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.38, noPrice: 0.62 },
  { title: "Will TikTok be banned in the US in 2026?", description: "Resolves YES if TikTok is fully banned or divested in the US by Dec 31, 2026.", category: "Politics", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.25, noPrice: 0.75 },
  { title: "Will SpaceX Starship reach orbit in 2026?", description: "Resolves YES if a Starship vehicle achieves stable orbit before Dec 31, 2026.", category: "Science", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.82, noPrice: 0.18 },
  { title: "Will ChatGPT-5 be released before 2026?", description: "Resolves YES if OpenAI releases GPT-5 before Jan 1, 2026.", category: "Tech", status: MarketStatus.CLOSED, closeDate: new Date("2025-12-31"), yesPrice: 0.72, noPrice: 0.28 },
  { title: "Will there be a US government shutdown in Q4 2025?", description: "Resolves YES if any federal shutdown occurs Oct-Dec 2025.", category: "Politics", status: MarketStatus.CLOSED, closeDate: new Date("2025-12-31"), yesPrice: 0.60, noPrice: 0.40 },
  { title: "Did Thailand qualify for the 2026 World Cup?", description: "Resolves YES if Thailand qualifies for the 2026 FIFA World Cup.", category: "Sports", status: MarketStatus.RESOLVED, closeDate: new Date("2025-06-30"), resolvedAt: new Date("2025-07-01"), yesPrice: 0.15, noPrice: 0.85 },
  { title: "Did the 2025 Bangkok election happen on schedule?", description: "Resolves YES if Bangkok gubernatorial election takes place as scheduled in 2025.", category: "Politics", status: MarketStatus.RESOLVED, closeDate: new Date("2025-12-31"), resolvedAt: new Date("2025-11-15"), yesPrice: 0.90, noPrice: 0.10 },
  { title: "Will Netflix stock hit $1000 in 2026?", description: "Resolves YES if NFLX closing price exceeds $1000 on any trading day in 2026.", category: "Finance", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.33, noPrice: 0.67 },
  { title: "Will the next iPhone have USB-C worldwide?", description: "Resolves YES if Apple ships iPhone 17 with USB-C in all regions.", category: "Tech", status: MarketStatus.ACTIVE, closeDate: new Date("2026-10-31"), yesPrice: 0.92, noPrice: 0.08 },
  { title: "Will Lewis Hamilton win a race for Ferrari in 2026?", description: "Resolves YES if Hamilton wins any F1 Grand Prix driving for Ferrari in 2026.", category: "Sports", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.65, noPrice: 0.35 },
  { title: "Will Solana price exceed $500 in 2026?", description: "Resolves YES if SOL/USD exceeds $500 on any major exchange before Dec 31, 2026.", category: "Crypto", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.22, noPrice: 0.78 },
  { title: "Will Thailand host a Formula 1 race by 2027?", description: "Resolves YES if Thailand is confirmed as an F1 Grand Prix host for 2027 season.", category: "Sports", status: MarketStatus.ACTIVE, closeDate: new Date("2027-03-31"), yesPrice: 0.08, noPrice: 0.92 },
  { title: "Will oil prices exceed $100/barrel in 2026?", description: "Resolves YES if WTI crude oil exceeds $100/barrel at any point in 2026.", category: "Finance", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.35, noPrice: 0.65 },
  { title: "Will Meta release AR glasses in 2026?", description: "Resolves YES if Meta ships consumer AR glasses by Dec 31, 2026.", category: "Tech", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.55, noPrice: 0.45 },
  { title: "Will a new COVID variant cause lockdowns in 2026?", description: "Resolves YES if any country with 50M+ population reimplements lockdowns due to COVID.", category: "Science", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.10, noPrice: 0.90 },
  { title: "Will Real Madrid win Champions League 2026?", description: "Resolves YES if Real Madrid wins the 2025-26 UEFA Champions League.", category: "Sports", status: MarketStatus.ACTIVE, closeDate: new Date("2026-06-01"), yesPrice: 0.30, noPrice: 0.70 },
  { title: "Will India's GDP surpass Japan's in 2026?", description: "Resolves YES if India's nominal GDP exceeds Japan's in IMF 2026 data.", category: "Finance", status: MarketStatus.ACTIVE, closeDate: new Date("2027-04-30"), yesPrice: 0.72, noPrice: 0.28 },
  { title: "Will there be a manned Mars mission announcement in 2026?", description: "Resolves YES if NASA or SpaceX announces a crewed Mars mission date in 2026.", category: "Science", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.20, noPrice: 0.80 },
  { title: "Will Dogecoin reach $1 in 2026?", description: "Resolves YES if DOGE/USD exceeds $1.00 on any major exchange in 2026.", category: "Crypto", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.08, noPrice: 0.92 },
  { title: "Will the US rejoin the Paris Climate Agreement?", description: "Resolves YES if the US formally rejoins the Paris Agreement by Dec 31, 2026.", category: "Politics", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.15, noPrice: 0.85 },
  { title: "Will Nintendo release Switch 2 before July 2026?", description: "Resolves YES if Nintendo ships the Switch successor before July 1, 2026.", category: "Tech", status: MarketStatus.ACTIVE, closeDate: new Date("2026-07-01"), yesPrice: 0.88, noPrice: 0.12 },
  { title: "Will Thailand's SET Index exceed 2000 in 2026?", description: "Resolves YES if the SET Index closes above 2000 on any trading day in 2026.", category: "Finance", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.45, noPrice: 0.55 },
  { title: "Will a Category 6 hurricane hit the US in 2026?", description: "Resolves YES if a hurricane rated Category 5+ makes landfall in the US in 2026.", category: "Science", status: MarketStatus.ACTIVE, closeDate: new Date("2026-12-31"), yesPrice: 0.18, noPrice: 0.82 },
];

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
          resolvedAt: marketData.resolvedAt ?? null,
          resolverId,
        },
      })
    : await prisma.market.create({
        data: {
          title: marketData.title,
          description: marketData.description,
          category: marketData.category,
          status: marketData.status,
          creatorId,
          resolverId,
          closeDate: marketData.closeDate,
          resolvedAt: marketData.resolvedAt ?? null,
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

async function createResolution(marketId: string, resolverId: string, winningOptionId: string, notes: string, evidenceUrl: string) {
  const existing = await prisma.resolution.findUnique({ where: { marketId } });
  if (existing) {
    return prisma.resolution.update({
      where: { marketId },
      data: { resolverId, winningOptionId, status: ResolutionStatus.RESOLVED, resolvedAt: new Date() },
    });
  }

  return prisma.resolution.create({
    data: {
      marketId,
      resolverId,
      winningOptionId,
      status: ResolutionStatus.RESOLVED,
      evidenceUrl,
      notes,
      resolvedAt: new Date(),
    },
  });
}

async function main() {
  console.log("Seeding database...");

  const users = await Promise.all(USERS.map(upsertUser));
  const admin = users[0];
  const resolver = users[1];

  console.log(`Created ${users.length} users`);

  const markets = await Promise.all(
    MARKETS.map((m) => upsertMarketWithOptions(m, admin.id, resolver.id))
  );

  console.log(`Created ${markets.length} markets`);

  // Resolve the resolved markets
  const resolvedMarkets = markets.filter((m) => m.market.status === MarketStatus.RESOLVED);

  for (const rm of resolvedMarkets) {
    if (rm.market.title.includes("Thailand")) {
      await createResolution(
        rm.market.id, resolver.id, rm.noOption.id,
        "Thailand did not qualify for the 2026 FIFA World Cup.",
        "https://www.fifa.com/tournaments/mens/worldcup/26"
      );
    } else if (rm.market.title.includes("Bangkok")) {
      await createResolution(
        rm.market.id, resolver.id, rm.yesOption.id,
        "The Bangkok gubernatorial election was held on schedule.",
        "https://www.ect.go.th"
      );
    }
  }

  console.log(`Created ${resolvedMarkets.length} resolutions`);

  // Create some sample orders + trades between users
  const alice = users[2];
  const bob = users[3];
  const btcMarket = markets[0]; // BTC $150k market

  // Alice buys YES at $0.42, Bob buys NO at $0.58
  const aliceOrder = await prisma.order.create({
    data: { userId: alice.id, marketId: btcMarket.market.id, optionId: btcMarket.yesOption.id, price: 0.42, quantity: 20, filledQuantity: 20, status: "FILLED" },
  });

  const bobOrder = await prisma.order.create({
    data: { userId: bob.id, marketId: btcMarket.market.id, optionId: btcMarket.noOption.id, price: 0.58, quantity: 20, filledQuantity: 20, status: "FILLED" },
  });

  await prisma.trade.create({
    data: {
      marketId: btcMarket.market.id,
      optionId: btcMarket.yesOption.id,
      yesOrderId: aliceOrder.id,
      noOrderId: bobOrder.id,
      yesUserId: alice.id,
      noUserId: bob.id,
      price: 0.42,
      quantity: 20,
    },
  });

  // Create positions
  await prisma.position.upsert({
    where: { userId_marketId_optionId: { userId: alice.id, marketId: btcMarket.market.id, optionId: btcMarket.yesOption.id } },
    update: { quantity: 20, avgPrice: 0.42 },
    create: { userId: alice.id, marketId: btcMarket.market.id, optionId: btcMarket.yesOption.id, quantity: 20, avgPrice: 0.42 },
  });

  await prisma.position.upsert({
    where: { userId_marketId_optionId: { userId: bob.id, marketId: btcMarket.market.id, optionId: btcMarket.noOption.id } },
    update: { quantity: 20, avgPrice: 0.58 },
    create: { userId: bob.id, marketId: btcMarket.market.id, optionId: btcMarket.noOption.id, quantity: 20, avgPrice: 0.58 },
  });

  // Deduct from wallets (escrow)
  await prisma.wallet.update({ where: { userId: alice.id }, data: { balance: { decrement: 8.40 } } }); // 20 * 0.42
  await prisma.wallet.update({ where: { userId: bob.id }, data: { balance: { decrement: 11.60 } } }); // 20 * 0.58

  // Create escrows
  const aliceWallet = await prisma.wallet.findUnique({ where: { userId: alice.id } });
  const bobWallet = await prisma.wallet.findUnique({ where: { userId: bob.id } });

  if (aliceWallet) {
    await prisma.escrow.create({ data: { walletId: aliceWallet.id, orderId: aliceOrder.id, amount: 8.40, status: "LOCKED" } });
    await prisma.transaction.create({ data: { walletId: aliceWallet.id, type: "ESCROW_LOCK", amount: 8.40, referenceId: aliceOrder.id, description: "Escrow for BTC $150k market" } });
  }
  if (bobWallet) {
    await prisma.escrow.create({ data: { walletId: bobWallet.id, orderId: bobOrder.id, amount: 11.60, status: "LOCKED" } });
    await prisma.transaction.create({ data: { walletId: bobWallet.id, type: "ESCROW_LOCK", amount: 11.60, referenceId: bobOrder.id, description: "Escrow for BTC $150k market" } });
  }

  // Create some notifications
  await prisma.notification.createMany({
    data: [
      { userId: alice.id, type: "TRADE_MATCHED", title: "Trade Matched", message: "Your YES order on BTC $150k market was filled: 20 shares at $0.42", referenceId: btcMarket.market.id },
      { userId: bob.id, type: "TRADE_MATCHED", title: "Trade Matched", message: "Your NO order on BTC $150k market was filled: 20 shares at $0.58", referenceId: btcMarket.market.id },
      { userId: alice.id, type: "MARKET_CREATED", title: "New Market", message: "New market created: Will GPT-5 be released before July 2026?", referenceId: markets[2].market.id },
    ],
  });

  console.log("Created sample orders, trades, positions, escrows, and notifications");
  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
