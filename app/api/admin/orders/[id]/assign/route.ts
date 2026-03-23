export const runtime = "nodejs";

// app/api/admin/orders/[id]/assign/route.ts
// PATCH → assign or unassign a delivery agent to an order
// Body: { deliveryId: number | null }

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const body = await req.json() as { deliveryId: number | null };
  const { deliveryId } = body;

  // If assigning, make sure the delivery agent exists and is approved
  if (deliveryId !== null) {
    const agent = await prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!agent) {
      return NextResponse.json({ error: "Delivery agent not found" }, { status: 404 });
    }
    if (agent.status !== "APPROVED") {
      return NextResponse.json({ error: "Agent is not approved" }, { status: 400 });
    }
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data:  { deliveryId: deliveryId ?? null },
    select: {
      id: true, status: true, deliveryId: true,
      delivery: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, order });
}