"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package, Truck, Search, X, Loader2, AlertTriangle,
  CheckCircle, ChevronDown, MapPin, User, RefreshCw, UserX,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminOrder {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  deliveryId: number | null;
  buyer:    { name: string };
  product:  { name: string } | null;
  delivery: { id: number; name: string } | null;
  shippingAddress: { city: string; state: string; street: string } | null;
}

interface DeliveryAgent {
  id: number;
  name: string;
  email: string;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Assign Dropdown ──────────────────────────────────────────────────────────

function AssignDropdown({
  order, agents, onAssign, isSaving,
}: {
  order: AdminOrder;
  agents: DeliveryAgent[];
  onAssign: (orderId: number, deliveryId: number | null) => Promise<void>;
  isSaving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const assigned = order.delivery;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isSaving}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-150 ${
          assigned
            ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
        }`}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : assigned ? (
          <Truck className="w-4 h-4" />
        ) : (
          <User className="w-4 h-4" />
        )}
        <span className="max-w-[120px] truncate">
          {assigned ? assigned.name : "Assign agent"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {/* Unassign option */}
            {assigned && (
              <button
                onClick={() => { onAssign(order.id, null); setOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-b border-gray-100"
              >
                <UserX className="w-4 h-4" />
                Unassign
              </button>
            )}

            {agents.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No approved agents</p>
            ) : (
              agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => { onAssign(order.id, agent.id); setOpen(false); }}
                  className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                    assigned?.id === agent.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{agent.name[0].toUpperCase()}</span>
                  </div>
                  <span className="truncate">{agent.name}</span>
                  {assigned?.id === agent.id && <CheckCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrderAssignPage() {
  const [orders, setOrders]   = useState<AdminOrder[]>([]);
  const [agents, setAgents]   = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<"ALL" | "assigned" | "unassigned">("ALL");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const assigned =
        filter === "assigned"   ? "true"  :
        filter === "unassigned" ? "false" : "";

      const [ordersRes, agentsRes] = await Promise.all([
        fetch(`/api/admin/orders?status=PROCESSING${assigned ? `&assigned=${assigned}` : ""}`),
        fetch("/api/admin/delivery?status=APPROVED"),
      ]);

      if (!ordersRes.ok) throw new Error("Failed to load orders");
      if (!agentsRes.ok) throw new Error("Failed to load agents");

      setOrders(await ordersRes.json());
      setAgents(await agentsRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async (orderId: number, deliveryId: number | null) => {
    setSavingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to assign");

      // Optimistically update the order in state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                deliveryId: data.order.deliveryId,
                delivery:   data.order.delivery,
              }
            : o
        )
      );
      showToast(deliveryId ? "Agent assigned successfully." : "Agent unassigned.");
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setSavingId(null);
    }
  };

  const visible = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.buyer.name.toLowerCase().includes(q) ||
      o.product?.name.toLowerCase().includes(q) ||
      String(o.id).includes(q) ||
      o.shippingAddress?.city.toLowerCase().includes(q)
    );
  });

  const unassignedCount = orders.filter((o) => !o.deliveryId).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page title bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-base font-bold text-gray-900">Assign Deliveries</h1>
            <div className="flex items-center gap-3">
              {unassignedCount > 0 && (
                <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                  {unassignedCount} unassigned
                </span>
              )}
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["ALL", "unassigned", "assigned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                filter === f
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {f === "ALL" ? "All Orders" : f === "unassigned" ? "Unassigned" : "Assigned"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by buyer, product, city or order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-700" />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-gray-500">{error}</p>
              <button onClick={fetchData} className="text-sm underline text-gray-900">Try again</button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Package className="w-10 h-10 text-gray-200" />
              <p className="text-sm text-gray-400">No orders found</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {["Order", "Buyer", "Product", "Delivery Address", "Total", "Assigned To"].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {visible.map((order) => (
                      <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${!order.deliveryId ? "bg-amber-50/40" : ""}`}>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900">#{order.id}</p>
                          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{order.buyer.name[0].toUpperCase()}</span>
                            </div>
                            <span className="text-sm text-gray-700">{order.buyer.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700 max-w-[160px] truncate">{order.product?.name ?? "—"}</p>
                        </td>
                        <td className="px-5 py-4">
                          {order.shippingAddress ? (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-gray-600">
                                <p className="truncate max-w-[140px]">{order.shippingAddress.street}</p>
                                <p className="text-gray-400">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No address</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <AssignDropdown
                            order={order}
                            agents={agents}
                            onAssign={handleAssign}
                            isSaving={savingId === order.id}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {visible.map((order) => (
                  <div key={order.id} className={`p-4 space-y-3 ${!order.deliveryId ? "bg-amber-50/40" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">#{order.id} · {order.product?.name ?? "—"}</p>
                        <p className="text-xs text-gray-500">{order.buyer.name} · {formatDate(order.createdAt)}</p>
                        {order.shippingAddress && (
                          <p className="text-xs text-gray-400 mt-1">
                            {order.shippingAddress.city}, {order.shippingAddress.state}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-900 flex-shrink-0">{formatCurrency(order.total)}</span>
                    </div>
                    <AssignDropdown
                      order={order}
                      agents={agents}
                      onAssign={handleAssign}
                      isSaving={savingId === order.id}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!loading && !error && (
          <p className="text-xs text-gray-400 text-right">
            {visible.length} order{visible.length !== 1 ? "s" : ""}
          </p>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.ok ? "bg-gray-900 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.ok
            ? <CheckCircle className="w-4 h-4 text-green-400" />
            : <AlertTriangle className="w-4 h-4 text-red-200" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}