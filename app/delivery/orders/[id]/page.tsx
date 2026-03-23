"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, MapPin, Package, Truck, CheckCircle,
  Clock, AlertCircle, User, Phone, Mail, Calendar,
  DollarSign, Loader2, ChevronRight, Hash,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderDetail {
  id: number;
  status: string;
  quantity: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes: string | null;
  trackingNumber: string | null;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  product: { name: string; category: string } | null;
  buyer: { name: string; email: string; phone: string | null };
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  PROCESSING: { label: "Processing", bg: "bg-amber-100",  text: "text-amber-700",  icon: Clock },
  SHIPPED:    { label: "Shipped",    bg: "bg-blue-100",   text: "text-blue-700",   icon: Truck },
  DELIVERED:  { label: "Delivered",  bg: "bg-green-100",  text: "text-green-700",  icon: CheckCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: "bg-gray-100", text: "text-gray-600", icon: Package };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-4 h-4" />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// What action is available for each status
const NEXT_STATUS: Record<string, { label: string; next: string; color: string } | null> = {
  PROCESSING: { label: "Mark as Shipped",   next: "SHIPPED",   color: "bg-blue-600 hover:bg-blue-700 text-white" },
  SHIPPED:    { label: "Mark as Delivered", next: "DELIVERED", color: "bg-green-600 hover:bg-green-700 text-white" },
  DELIVERED:  null, // terminal state
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  action, onConfirm, onCancel, isLoading,
}: {
  action: { label: string; next: string };
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const Icon = STATUS_CONFIG[action.next]?.icon ?? CheckCircle;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-xl">
            <Icon className="w-6 h-6 text-gray-700" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{action.label}</h2>
        </div>
        <p className="text-sm text-gray-600">
          Are you sure you want to update this order to{" "}
          <span className="font-semibold">{STATUS_CONFIG[action.next]?.label}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2 ${
              action.next === "SHIPPED"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeliveryOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ label: string; next: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/delivery/orders/${orderId}`);
      if (!res.ok) throw new Error(res.status === 404 ? "Order not found" : "Failed to load order");
      setOrder(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  const handleStatusUpdate = async () => {
    if (!confirmAction) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/delivery/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: confirmAction.next }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setConfirmAction(null);
      showToast(`Order marked as ${STATUS_CONFIG[confirmAction.next]?.label}`);
      await fetchOrder();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-gray-400 animate-spin" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 p-6 max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-gray-700 font-medium">{error ?? "Order not found"}</p>
          <button onClick={() => router.back()} className="text-sm text-gray-500 underline">Go back</button>
        </div>
      </div>
    );
  }

  const nextAction = NEXT_STATUS[order.status] ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 h-14">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">Order #{order.id}</h1>
              <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* ── Action button ─────────────────────────────────────────────────── */}
        {nextAction && (
          <button
            onClick={() => setConfirmAction(nextAction)}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold transition-colors duration-150 ${
              nextAction.next === "SHIPPED"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {nextAction.next === "SHIPPED"
              ? <Truck className="w-5 h-5" />
              : <CheckCircle className="w-5 h-5" />}
            {nextAction.label}
          </button>
        )}

        {order.status === "DELIVERED" && (
          <div className="flex items-center justify-center gap-2 py-4 bg-green-50 border border-green-200 rounded-2xl">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-semibold">Delivery Complete</span>
          </div>
        )}

        {/* ── Shipping Address ──────────────────────────────────────────────── */}
        {order.shippingAddress && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Delivery Address</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a href={`tel:${order.shippingAddress.phone}`} className="text-sm text-blue-600 hover:underline">
                  {order.shippingAddress.phone}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 leading-relaxed">
                  <p className="font-medium">{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>
            </div>

            {/* Open in Maps */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Open in Google Maps
            </a>
          </div>
        )}

        {/* ── Order Info ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Order Details</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Product</p>
                <p className="text-sm font-medium text-gray-900 truncate">{order.product?.name ?? "—"}</p>
              </div>
              <span className="text-sm text-gray-500">×{order.quantity}</span>
            </div>

            {order.trackingNumber && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Tracking Number</p>
                  <p className="text-sm font-mono font-medium text-gray-900">{order.trackingNumber}</p>
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            {[
              ["Subtotal", order.subtotal],
              ["Tax",      order.tax],
              ["Shipping", order.shipping],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-700">{formatCurrency(val as number)}</span>
              </div>
            ))}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Customer ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Customer</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{order.buyer.name[0].toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{order.buyer.name}</p>
              <p className="text-xs text-gray-500">{order.buyer.email}</p>
            </div>
          </div>
          {order.buyer.phone && (
            <a
              href={`tel:${order.buyer.phone}`}
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Phone className="w-4 h-4" />
              {order.buyer.phone}
            </a>
          )}
        </div>

        {/* ── Notes ─────────────────────────────────────────────────────────── */}
        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-amber-800 mb-2">Order Notes</h2>
            <p className="text-sm text-amber-700">{order.notes}</p>
          </div>
        )}
      </main>

      {/* Confirm modal */}
      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          onConfirm={handleStatusUpdate}
          onCancel={() => setConfirmAction(null)}
          isLoading={isUpdating}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}