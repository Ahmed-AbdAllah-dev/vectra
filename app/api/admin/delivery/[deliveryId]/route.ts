export const runtime = "nodejs";

// app/api/admin/delivery/[deliveryId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ deliveryId: string }> };

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") return null;
  return token;
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const token = await requireAdmin(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deliveryId: deliveryIdStr } = await params;
  const deliveryId = parseInt(deliveryIdStr);
  if (isNaN(deliveryId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { user: { select: { email: true, createdAt: true } }, approvals: true },
  });

  if (!delivery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(delivery);
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const token = await requireAdmin(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deliveryId: deliveryIdStr } = await params;
  const deliveryId = parseInt(deliveryIdStr);
  if (isNaN(deliveryId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const { action, notes, rejectionReason } = body as {
    action: "APPROVED" | "REJECTED";
    notes?: string;
    rejectionReason?: string;
  };

  if (!["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "action must be APPROVED or REJECTED" }, { status: 400 });
  }

  const adminId = token.adminId as number | undefined;
  if (!adminId) return NextResponse.json({ error: "Admin profile not found" }, { status: 403 });

  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updatedDelivery] = await prisma.$transaction([
    prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: action,
        rejectionReason: action === "REJECTED" ? (rejectionReason ?? null) : null,
      },
    }),
    prisma.deliveryApproval.create({
      data: { deliveryId, adminId, action, notes: notes ?? null },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: `Delivery account ${action.toLowerCase()}.`,
    delivery: updatedDelivery,
  });
}