"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Shield, Truck, Package, LayoutDashboard,
  LogOut, Menu, X, ChevronRight,
} from "lucide-react";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: "Delivery Applications",
    href:  "/admin/delivery",
    icon:  Truck,
    description: "Review & approve agents",
  },
  {
    label: "Order Assignment",
    href:  "/admin/orders",
    icon:  Package,
    description: "Assign agents to orders",
  },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function AdminSidebar({
  adminName,
  adminEmail,
}: {
  adminName: string;
  adminEmail: string;
}) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/admin/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Admin Panel</p>
            <p className="text-gray-500 text-xs">Vectra Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-3 text-xs font-bold text-gray-600 uppercase tracking-widest">
          Management
        </p>
        {NAV_ITEMS.map(({ label, href, icon: Icon, description }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 group ${
                active
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${
                active ? "bg-gray-100" : "bg-white/5 group-hover:bg-white/10"
              }`}>
                <Icon className={`w-4 h-4 ${active ? "text-gray-900" : "text-gray-400 group-hover:text-white"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${active ? "text-gray-900" : ""}`}>
                  {label}
                </p>
                <p className={`text-xs truncate ${active ? "text-gray-500" : "text-gray-600"}`}>
                  {description}
                </p>
              </div>
              {active && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Admin profile + sign out */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-gray-900 text-sm font-bold">
              {adminName[0]?.toUpperCase() ?? "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{adminName}</p>
            <p className="text-xs text-gray-500 truncate">{adminEmail}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (fixed) ───────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-64 bg-gray-950 border-r border-white/10 z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-950 border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">Admin Panel</span>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Mobile content offset */}
      <div className="lg:hidden h-14" />

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside className="lg:hidden fixed top-0 left-0 h-screen w-72 bg-gray-950 border-r border-white/10 z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-sm">Admin Panel</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarContent />
            </div>
          </aside>
        </>
      )}
    </>
  );
}