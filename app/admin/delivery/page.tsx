// app/admin/delivery/page.tsx
// Server component — runs on the server, redirects before any HTML reaches the browser.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeliveryDashboard } from "./DeliveryDashboard";

export const metadata = { title: "Delivery Applications — Admin" };

export default async function AdminDeliveryPage() {
  const session = await getServerSession(authOptions);

  // Not logged in → go to login
  if (!session) {
    redirect("/login");
  }

  // Logged in but not admin → go home (don't reveal admin exists)
  if (session.user.role !== "admin") {
    redirect("/");
  }

  // Admin confirmed — render the dashboard
  return <DeliveryDashboard />;
}