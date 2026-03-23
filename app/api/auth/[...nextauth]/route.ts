export const runtime = "nodejs";

// app/api/auth/[...nextauth]/route.ts
// Kept thin — all logic lives in lib/auth.ts so other
// API routes can import authOptions without circular deps.

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };