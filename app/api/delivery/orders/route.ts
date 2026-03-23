export const runtime = "nodejs";

// app/api/delivery/orders/route.ts
// GET → orders assigned to the logged-in delivery agent
// Query params: ?status=PROCESSING|SHIPPED|DELIVERED  &city=Algiers

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== "delivery") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deliveryId = token.deliveryId as number | undefined;
  if (!deliveryId) {
    return NextResponse.json({ error: "Delivery profile not found" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const city   = searchParams.get("city");

  const orders = await prisma.order.findMany({
    where: {
      deliveryId,
      // Status filter
      ...(status ? { status } : {
        // Default: only show active orders (not cancelled/pending)
        status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
      }),
      // City filter — applied on the shipping address relation
      ...(city ? {
        shippingAddress: {
          city: { contains: city, mode: "insensitive" },
        },
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      quantity: true,
      total: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      trackingNumber: true,
      buyer: { select: { name: true, phone: true } },
      product: { select: { name: true } },
      shippingAddress: {
        select: {
          fullName: true,
          phone: true,
          street: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
        },
      },
    },
  });

  return NextResponse.json(orders);
}