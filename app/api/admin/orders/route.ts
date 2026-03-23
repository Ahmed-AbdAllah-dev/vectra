export const runtime = "nodejs";

// app/api/admin/orders/route.ts
// GET → all orders (admin view), filterable by status and assignment

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status     = searchParams.get("status");      // e.g. PROCESSING
  const assigned   = searchParams.get("assigned");    // "true" | "false" | null

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(assigned === "false" ? { deliveryId: null } : {}),
      ...(assigned === "true"  ? { deliveryId: { not: null } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      deliveryId: true,
      buyer:    { select: { name: true } },
      product:  { select: { name: true } },
      delivery: { select: { id: true, name: true } },
      shippingAddress: {
        select: { city: true, state: true, street: true },
      },
    },
  });

  return NextResponse.json(orders);
}