// scripts/seed-admin.ts
// Run once with:  npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-admin.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const EMAIL    = "admin@yoursite.com"; // ← change this
  const PASSWORD = "Admin1234!";         // ← change this

  // 1. Create or find the base User
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { role: "ADMIN" },          // if user already exists just fix the role
    create: {
      email:    EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      name:     "Admin",
      role:     "ADMIN",
    },
  });

  // 2. Create the Admin profile row if it doesn't exist yet
  const admin = await prisma.admin.upsert({
    where:  { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log("✅ Admin ready:");
  console.log("   User  id:", user.id,  "| email:", user.email, "| role:", user.role);
  console.log("   Admin id:", admin.id);
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());