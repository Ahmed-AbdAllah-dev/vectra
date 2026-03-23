"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Truck, MapPin, Search, Package, Clock,
  CheckCircle, ChevronRight, Loader2, AlertTriangle,
  RefreshCw, X, Phone, User, LogOut,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryOrder {
  id: number;
  quantity: number;
  total: number;
  status: string;
  createdAt: string;
  trackingNumber: string | null;
  buyer: { name: string; phone: string | null };
  shippingAddress: {
    fullName: string; phone: string;
    street: string; city: string; state: string; zipCode: string; country: string;
  } | null;
  product: { name: string } | null;
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeliveryOrdersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // allOrders is always the full unfiltered list — used only for counts
  const [allOrders, setAllOrders]   = useState<DeliveryOrder[]>([]);
  // orders is what's shown in the list — filtered by status + city
  const [orders, setOrders]         = useState<DeliveryOrder[]>([]);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [loadingList,   setLoadingList]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [statusFilter, setStatusFilter]   = useState<string>("PROCESSING");
  const [citySearch, setCitySearch] = useState("");
  const [search, setSearch]         = useState("");

  // Redirect non-delivery users
  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.push("/");
    if (sessionStatus === "authenticated" && session?.user?.role !== "delivery") router.push("/");
  }, [sessionStatus, session, router]);

  // Fetch ALL orders once for accurate counts — no status/city filter
  const fetchCounts = useCallback(async () => {
    setLoadingCounts(true);
    try {
      const res = await fetch("/api/delivery/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      setAllOrders(await res.json());
    } catch {
      // counts fail silently — list error is shown separately
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  // Fetch filtered list separately
  const fetchList = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (citySearch.trim()) params.set("city", citySearch.trim());
      const res = await fetch(`/api/delivery/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load orders");
      setOrders(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter, citySearch]);

  // On mount fetch both; on filter change only re-fetch the list
  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const handleRefresh = () => { fetchCounts(); fetchList(); };

  // Counts always come from allOrders so they never zero out on filter change
  const counts = {
    ALL:        allOrders.length,
    PROCESSING: allOrders.filter((o) => o.status === "PROCESSING").length,
    SHIPPED:    allOrders.filter((o) => o.status === "SHIPPED").length,
    DELIVERED:  allOrders.filter((o) => o.status === "DELIVERED").length,
  };

  // Client-side text search on top of the API filter
  const visible = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.buyer.name.toLowerCase().includes(q) ||
      o.product?.name.toLowerCase().includes(q) ||
      String(o.id).includes(q)
    );
  });

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 rounded-xl">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">My Deliveries</h1>
                <p className="text-xs text-gray-500">Hello, {session?.user?.name ?? "Agent"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${(loadingCounts || loadingList) ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Stat / filter tabs — counts from allOrders, always accurate */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["ALL", "PROCESSING", "SHIPPED", "DELIVERED"] as const).map((s) => {
            const active = statusFilter === s;
            const Icon = s === "ALL" ? Package : STATUS_CONFIG[s].icon;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                  active
                    ? s === "ALL"         ? "bg-gray-900 border-gray-900"
                    : s === "PROCESSING"  ? "bg-amber-50 border-amber-400"
                    : s === "SHIPPED"     ? "bg-blue-50 border-blue-400"
                    :                       "bg-green-50 border-green-400"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon className={`w-4 h-4 mb-1.5 ${active && s === "ALL" ? "text-white" : "text-gray-500"}`} />
                <p className={`text-xl font-bold ${active && s === "ALL" ? "text-white" : "text-gray-900"}`}>
                  {loadingCounts ? "—" : counts[s]}
                </p>
                <p className={`text-xs font-medium ${active && s === "ALL" ? "text-gray-400" : "text-gray-500"}`}>
                  {s === "ALL" ? "Total" : STATUS_CONFIG[s].label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search buyer or product…"
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
          <div className="relative sm:w-56">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by city…"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            {citySearch && (
              <button onClick={() => setCitySearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-700" />
              </button>
            )}
          </div>
        </div>

        {/* Orders list */}
        {loadingList ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <p className="text-gray-500 text-sm">{error}</p>
            <button onClick={fetchList} className="text-sm text-gray-900 underline">Try again</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Package className="w-10 h-10 text-gray-200" />
            <p className="text-gray-400 text-sm">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((order) => (
              <button
                key={order.id}
                onClick={() => router.push(`/delivery/orders/${order.id}`)}
                className="w-full text-left bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-400 hover:shadow-sm transition-all duration-150 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">#{order.id}</span>
                      <StatusBadge status={order.status} />
                      {order.trackingNumber && (
                        <span className="text-xs text-gray-400 font-mono">{order.trackingNumber}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {order.product?.name ?? "Product"}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <User className="w-3.5 h-3.5" />
                      <span>{order.buyer.name}</span>
                      {order.buyer.phone && (
                        <>
                          <span className="text-gray-300">·</span>
                          <Phone className="w-3.5 h-3.5" />
                          <span>{order.buyer.phone}</span>
                        </>
                      )}
                    </div>
                    {order.shippingAddress && (
                      <div className="flex items-start gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span className="truncate">
                          {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                          {order.shippingAddress.state} {order.shippingAddress.zipCode}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-700 transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loadingList && !error && visible.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            {visible.length} order{visible.length !== 1 ? "s" : ""}
          </p>
        )}
      </main>
    </div>
  );
}