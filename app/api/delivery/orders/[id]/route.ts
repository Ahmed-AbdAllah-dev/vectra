export const runtime = "nodejs";

// app/api/delivery/orders/[id]/route.ts
// GET   → single order detail
// PUT   → update status (PROCESSING → SHIPPED → DELIVERED only)

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

async function getDeliveryId(req: NextRequest): Promise<number | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "delivery") return null;
  return (token.deliveryId as number) ?? null;
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const deliveryId = await getDeliveryId(req);
  if (!deliveryId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, deliveryId }, // ensures they can only see their own orders
    select: {
      id: true,
      status: true,
      quantity: true,
      subtotal: true,
      tax: true,
      shipping: true,
      total: true,
      notes: true,
      trackingNumber: true,
      paymentMethod: true,
      createdAt: true,
      updatedAt: true,
      product: { select: { name: true, category: true } },
      buyer: { select: { name: true, email: true, phone: true } },
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

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}

// ── PUT ───────────────────────────────────────────────────────────────────────
// Allowed transitions: PROCESSING → SHIPPED → DELIVERED
const ALLOWED_TRANSITIONS: Record<string, string> = {
  PROCESSING: "SHIPPED",
  SHIPPED:    "DELIVERED",
};

export async function PUT(req: NextRequest, { params }: Params) {
  const deliveryId = await getDeliveryId(req);
  if (!deliveryId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const { status: newStatus } = await req.json() as { status: string };

  // Find the order and make sure it belongs to this agent
  const order = await prisma.order.findFirst({
    where: { id: orderId, deliveryId },
    select: { id: true, status: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Validate the transition
  const allowedNext = ALLOWED_TRANSITIONS[order.status];
  if (!allowedNext || allowedNext !== newStatus) {
    return NextResponse.json(
      { error: `Cannot transition from ${order.status} to ${newStatus}` },
      { status: 400 }
    );
  }

  // Get the delivery user id for the status history log
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    select: { userId: true, name: true },
  });

  const updated = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus, updatedAt: new Date() },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: newStatus,
        changedBy: delivery?.name ?? "Delivery Agent",
        changedById: delivery?.userId ?? null,
        notes: `Status updated to ${newStatus} by delivery agent`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, order: updated[0] });
}