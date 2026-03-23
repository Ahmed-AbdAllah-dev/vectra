// app/admin/layout.tsx
// Wraps all /admin/* pages except /admin/login
// The sidebar is a server component — session check is done in each page's own server component

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // If not logged in as admin (e.g. on /admin/login), render children directly with no chrome
  if (!session || session.user.role !== "admin") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <AdminSidebar adminName={session.user.name ?? "Admin"} adminEmail={session.user.email ?? ""} />
      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {children}
      </div>
    </div>
  );
}