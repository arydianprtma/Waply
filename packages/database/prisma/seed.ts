import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  const plans = [
    {
      code: "FREE",
      name: "Free Trial",
      price: 0,
      interval: "monthly",
      maxDevices: 1,
      monthlyMessages: 100,
      rateLimitPerMin: 10,
      features: {
        devices: 1,
        monthlyMessages: 100,
        rateLimitPerMin: 10,
        spintax: true,
        antiBanWarmup: true,
        webhooks: 1,
        automation: false,
        support: "community",
      },
    },
    {
      code: "STARTER",
      name: "Starter Plan",
      price: 49000,
      interval: "monthly",
      maxDevices: 2,
      monthlyMessages: 5000,
      rateLimitPerMin: 60,
      features: {
        devices: 2,
        monthlyMessages: 5000,
        rateLimitPerMin: 60,
        spintax: true,
        antiBanWarmup: true,
        webhooks: 3,
        automation: true,
        support: "email",
      },
    },
    {
      code: "BUSINESS",
      name: "Business Plan",
      price: 149000,
      interval: "monthly",
      maxDevices: 5,
      monthlyMessages: 25000,
      rateLimitPerMin: 300,
      features: {
        devices: 5,
        monthlyMessages: 25000,
        rateLimitPerMin: 300,
        spintax: true,
        antiBanWarmup: true,
        webhooks: 10,
        automation: true,
        support: "priority",
      },
    },
    {
      code: "PRO",
      name: "Pro Unlimited",
      price: 299000,
      interval: "monthly",
      maxDevices: 10,
      monthlyMessages: 100000,
      rateLimitPerMin: 1000,
      features: {
        devices: 10,
        monthlyMessages: 100000,
        rateLimitPerMin: 1000,
        spintax: true,
        antiBanWarmup: true,
        webhooks: 50,
        automation: true,
        support: "vip_24_7",
      },
    },
  ];

  for (const plan of plans) {
    const upserted = await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
    console.log(`✅ Upserted plan: ${upserted.name} (${upserted.code}) - Rp${upserted.price.toLocaleString("id-ID")}`);
  }

  console.log("✨ Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
