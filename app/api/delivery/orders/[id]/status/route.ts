export const runtime = "nodejs";

// app/api/delivery/orders/[id]/status/route.ts
// PUT → update order status (PROCESSING → SHIPPED → DELIVERED only)

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_TRANSITIONS: Record<string, string> = {
  PROCESSING: "SHIPPED",
  SHIPPED:    "DELIVERED",
};

export async function PUT(req: NextRequest, { params }: Params) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== "delivery") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deliveryId = token.deliveryId as number | undefined;
  if (!deliveryId) {
    return NextResponse.json({ error: "Delivery profile not found" }, { status: 403 });
  }

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const { status: newStatus } = (await req.json()) as { status: string };

  // Find the order and verify it belongs to this agent
  const order = await prisma.order.findFirst({
    where: { id: orderId, deliveryId },
    select: { id: true, status: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Validate the transition
  const allowedNext = ALLOWED_TRANSITIONS[order.status];
  if (!allowedNext || allowedNext !== newStatus) {
    return NextResponse.json(
      { error: `Cannot transition from ${order.status} to ${newStatus}` },
      { status: 400 }
    );
  }

  // Fetch delivery agent info for the history log
  const delivery = await prisma.delivery.findUnique({
    where:  { id: deliveryId },
    select: { userId: true, name: true },
  });

  const [updatedOrder] = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data:  { status: newStatus, updatedAt: new Date() },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        status:      newStatus,
        changedBy:   delivery?.name ?? "Delivery Agent",
        changedById: delivery?.userId ?? null,
        notes:       `Marked as ${newStatus} by delivery agent`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, order: updatedOrder });
}