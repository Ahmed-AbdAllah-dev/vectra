"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck, Clock, CheckCircle, XCircle, Eye, Search,
  X, FileText, CreditCard, Car, User, Mail, Phone,
  Calendar, AlertTriangle, Check, Loader2, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliveryStatus = "PENDING" | "APPROVED" | "REJECTED";

interface DeliveryAgent {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: DeliveryStatus;
  idCardImage: string;
  vehicleDocument: string;
  vehicleImage: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: { email: string; createdAt: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  PENDING:  { label: "Pending",  bg: "bg-amber-100",  text: "text-amber-700",  icon: Clock },
  APPROVED: { label: "Approved", bg: "bg-green-100",  text: "text-green-700",  icon: CheckCircle },
  REJECTED: { label: "Rejected", bg: "bg-red-100",    text: "text-red-700",    icon: XCircle },
};

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const cfg = STATUS_CONFIG[status];
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

// ─── Document link ────────────────────────────────────────────────────────────

function DocLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const isPdf = href.toLowerCase().endsWith(".pdf");
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all duration-150 group"
    >
      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-900 transition-colors duration-150">
        <Icon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors duration-150" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
        <p className="text-xs text-gray-400">{isPdf ? "PDF document" : "Image"} — click to view</p>
      </div>
      <Eye className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors duration-150" />
    </a>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  agent, onClose, onAction, isActing,
}: {
  agent: DeliveryAgent;
  onClose: () => void;
  onAction: (id: number, action: "APPROVED" | "REJECTED", reason?: string) => Promise<void>;
  isActing: boolean;
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = () => onAction(agent.id, "APPROVED");
  const handleReject = () => {
    if (!showRejectForm) { setShowRejectForm(true); return; }
    onAction(agent.id, "REJECTED", rejectionReason);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-xl">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{agent.name}</h2>
              <p className="text-sm text-gray-500">Application #{agent.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={agent.status} />
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal info */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Applicant Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: User,     label: "Full Name", value: agent.name },
                { icon: Mail,     label: "Email",     value: agent.email },
                { icon: Phone,    label: "Phone",     value: agent.phone ?? "—" },
                { icon: Calendar, label: "Applied",   value: formatDate(agent.createdAt) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Documents */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Submitted Documents</h3>
            <div className="space-y-2">
              <DocLink href={agent.idCardImage}     label="ID Card"          icon={CreditCard} />
              <DocLink href={agent.vehicleDocument} label="Vehicle Document" icon={FileText} />
              <DocLink href={agent.vehicleImage}    label="Vehicle Photo"    icon={Car} />
            </div>
          </section>

          {/* Rejection reason (already rejected) */}
          {agent.status === "REJECTED" && agent.rejectionReason && (
            <section className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-semibold text-red-700">Rejection Reason</p>
              </div>
              <p className="text-sm text-red-600">{agent.rejectionReason}</p>
            </section>
          )}

          {/* Rejection reason input */}
          {showRejectForm && (
            <section className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-red-700">Provide a reason for rejection (optional)</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                placeholder="e.g. Documents are blurry or expired..."
              />
              <button onClick={() => setShowRejectForm(false)} className="text-xs text-red-500 hover:text-red-700 underline">
                Cancel
              </button>
            </section>
          )}

          {/* Action buttons — only when PENDING */}
          {agent.status === "PENDING" && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleApprove}
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Approve
              </button>
              <button
                onClick={handleReject}
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white text-red-600 border-2 border-red-200 rounded-xl font-medium hover:bg-red-50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                {showRejectForm ? "Confirm Rejection" : "Reject"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DeliveryDashboard() {
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DeliveryStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DeliveryAgent | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter === "ALL" ? "/api/admin/delivery" : `/api/admin/delivery?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load applications");
      setAgents(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAction = async (id: number, action: "APPROVED" | "REJECTED", reason?: string) => {
    setIsActing(true);
    try {
      const res = await fetch(`/api/admin/delivery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      showToast(
        action === "APPROVED" ? "Agent approved successfully." : "Agent rejected.",
        action === "APPROVED" ? "success" : "error",
      );
      setSelected(null);
      fetchAgents();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsActing(false);
    }
  };

  const counts = {
    ALL:      agents.length,
    PENDING:  agents.filter((a) => a.status === "PENDING").length,
    APPROVED: agents.filter((a) => a.status === "APPROVED").length,
    REJECTED: agents.filter((a) => a.status === "REJECTED").length,
  };

  const visible = agents.filter((a) =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page title bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-base font-bold text-gray-900">Delivery Applications</h1>
            <button
              onClick={fetchAgents}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-150"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stat / filter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => {
            const active = filter === s;
            const Icon = s === "ALL" ? Truck : STATUS_CONFIG[s].icon;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                  active
                    ? s === "ALL"      ? "bg-gray-900 border-gray-900 text-white"
                    : s === "PENDING"  ? "bg-amber-50 border-amber-400"
                    : s === "APPROVED" ? "bg-green-50 border-green-400"
                    :                    "bg-red-50 border-red-400"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${active && s === "ALL" ? "bg-white/10" : "bg-gray-100"}`}>
                    <Icon className={`w-4 h-4 ${active && s === "ALL" ? "text-white" : "text-gray-600"}`} />
                  </div>
                  {active && <div className="w-2 h-2 rounded-full bg-current opacity-60" />}
                </div>
                <p className={`text-2xl font-bold ${active && s === "ALL" ? "text-white" : "text-gray-900"}`}>
                  {counts[s]}
                </p>
                <p className={`text-xs font-medium mt-0.5 ${active && s === "ALL" ? "text-gray-400" : "text-gray-500"}`}>
                  {s === "ALL" ? "Total" : STATUS_CONFIG[s].label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
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
              <p className="text-gray-500 text-sm">{error}</p>
              <button onClick={fetchAgents} className="text-sm text-gray-900 underline">Try again</button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Truck className="w-10 h-10 text-gray-200" />
              <p className="text-gray-400 text-sm">No applications found</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {["Applicant", "Contact", "Applied", "Status", "Action"].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {visible.map((agent) => (
                      <tr key={agent.id} className="hover:bg-gray-50 transition-colors duration-100">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-bold">{agent.name[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{agent.name}</p>
                              <p className="text-xs text-gray-400">#{agent.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700">{agent.email}</p>
                          <p className="text-xs text-gray-400">{agent.phone ?? "—"}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">{formatDate(agent.createdAt)}</td>
                        <td className="px-5 py-4"><StatusBadge status={agent.status} /></td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setSelected(agent)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-colors duration-150"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {visible.map((agent) => (
                  <div key={agent.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">{agent.name[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{agent.name}</p>
                          <p className="text-xs text-gray-400">{agent.email}</p>
                        </div>
                      </div>
                      <StatusBadge status={agent.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Applied {formatDate(agent.createdAt)}</p>
                      <button
                        onClick={() => setSelected(agent)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!loading && !error && visible.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            Showing {visible.length} of {agents.length} application{agents.length !== 1 ? "s" : ""}
          </p>
        )}
      </main>

      {selected && (
        <DetailModal
          agent={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
          isActing={isActing}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-gray-900 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success"
            ? <CheckCircle className="w-4 h-4 text-green-400" />
            : <AlertTriangle className="w-4 h-4 text-red-200" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}