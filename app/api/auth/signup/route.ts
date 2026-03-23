export const runtime = "nodejs";

// api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      phone,
      accountType,
      // Delivery-only fields (expected to be URLs after uploading to your storage)
      idCardImage,
      vehicleDocument,
      vehicleImage,
    } = body;

    // ── Basic validation ────────────────────────────────────────────────────
    if (!email || !password || !name || !accountType) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, name, accountType" },
        { status: 400 }
      );
    }

    const VALID_TYPES = ["buyer", "seller", "delivery"];
    // Note: admin accounts should be created manually / via a seeder — not via the public signup endpoint
    if (!VALID_TYPES.includes(accountType)) {
      return NextResponse.json(
        { error: "Invalid account type. Must be buyer, seller, or delivery." },
        { status: 400 }
      );
    }

    if (accountType === "delivery") {
      if (!idCardImage || !vehicleDocument || !vehicleImage) {
        return NextResponse.json(
          {
            error:
              "Delivery accounts require idCardImage, vehicleDocument, and vehicleImage URLs.",
          },
          { status: 400 }
        );
      }
    }

    // ── Duplicate check ─────────────────────────────────────────────────────
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Transaction ─────────────────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone: phone ?? null,
          role:
            accountType === "delivery"
              ? "DELIVERY"
              : accountType === "seller"
              ? "SELLER"
              : "BUYER",
        },
      });

      if (accountType === "buyer") {
        await tx.buyer.create({
          data: {
            email: user.email,
            password: user.password,
            name: user.name ?? "",
            phone: user.phone ?? null,
            userId: user.id,
          },
        });
      }

      if (accountType === "seller") {
        await tx.seller.create({
          data: {
            email: user.email,
            password: user.password,
            name: user.name ?? "",
            phone: user.phone ?? null,
            userId: user.id,
          },
        });
        // Sellers also get a buyer profile so they can shop
        await tx.buyer.create({
          data: {
            email: user.email,
            password: user.password,
            name: user.name ?? "",
            phone: user.phone ?? null,
            userId: user.id,
          },
        });
      }

      if (accountType === "delivery") {
        await tx.delivery.create({
          data: {
            email: user.email,
            password: user.password,
            name: user.name ?? "",
            phone: user.phone ?? null,
            userId: user.id,
            idCardImage,
            vehicleDocument,
            vehicleImage,
            status: "PENDING", // awaiting admin approval
          },
        });
      }

      return user;
    });

    return NextResponse.json(
      {
        success: true,
        message:
          accountType === "delivery"
            ? "Account created. Your documents are under review. You will be notified once approved."
            : "Account created successfully.",
        userId: result.id,
        accountType,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Account already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message ?? "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}