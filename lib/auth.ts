// lib/auth.ts
// Single source of truth for authOptions.
// Import from here everywhere — API routes, server components, middleware.

import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { Adapter, AdapterUser } from "next-auth/adapters";

// ─── Type augmentation ────────────────────────────────────────────────────────

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role?: "buyer" | "seller" | "delivery" | "admin";
    buyerId?: number;
    sellerId?: number;
    deliveryId?: number;
    adminId?: number;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: "buyer" | "seller" | "delivery" | "admin";
      buyerId?: number;
      sellerId?: number;
      deliveryId?: number;
      adminId?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role?: "buyer" | "seller" | "delivery" | "admin";
    buyerId?: number;
    sellerId?: number;
    deliveryId?: number;
    adminId?: number;
  }
}

// ─── Prisma adapter (integer IDs) ─────────────────────────────────────────────

const toAdapterUser = (user: any): AdapterUser => ({
  id: user.id.toString(),
  email: user.email,
  emailVerified: user.emailVerified,
  name: user.name ?? undefined,
  image: user.image ?? undefined,
});

const customAdapter: Adapter = {
  ...PrismaAdapter(prisma),
  async createUser(data: Omit<AdapterUser, "id">) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: "",
        image: data.image ?? null,
        emailVerified: data.emailVerified ?? null,
      },
    });
    return toAdapterUser(user);
  },
  async getUser(id: string) {
    const uid = parseInt(id);
    if (isNaN(uid)) return null;
    const user = await prisma.user.findUnique({ where: { id: uid } });
    return user ? toAdapterUser(user) : null;
  },
  async getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? toAdapterUser(user) : null;
  },
  async getUserByAccount(providerInfo) {
    const account = await prisma.account.findUnique({
      where: { provider_providerAccountId: providerInfo },
      include: { user: true },
    });
    return account?.user ? toAdapterUser(account.user) : null;
  },
  async updateUser(data: Partial<AdapterUser> & Pick<AdapterUser, "id">) {
    const uid = parseInt(data.id);
    if (isNaN(uid)) throw new Error("Invalid user ID");
    const { id, ...rest } = data;
    const user = await prisma.user.update({
      where: { id: uid },
      data: {
        email: rest.email,
        name: rest.name,
        image: rest.image,
        emailVerified: rest.emailVerified,
      },
    });
    return toAdapterUser(user);
  },
  async deleteUser(id: string) {
    const uid = parseInt(id);
    if (isNaN(uid)) throw new Error("Invalid user ID");
    await prisma.user.delete({ where: { id: uid } });
    return null;
  },
};

// ─── Auth options ─────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", signOut: "/", error: "/auth/error" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:       { label: "Email",        type: "email" },
        password:    { label: "Password",     type: "password" },
        accountType: { label: "Account Type", type: "text" },
      },
      async authorize(credentials) {
        const { email, password, accountType } = credentials ?? {};
        if (!email || !password || !accountType) {
          throw new Error("Please provide email, password, and account type");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error("No user found with this email");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Incorrect password");

        if (accountType === "buyer") {
          const buyer = await prisma.buyer.findUnique({ where: { userId: user.id } });
          if (!buyer) throw new Error("This account is not registered as a buyer.");
          return { id: user.id.toString(), email: user.email, name: user.name, image: user.image, role: "buyer", buyerId: buyer.id };
        }

        if (accountType === "seller") {
          const seller = await prisma.seller.findUnique({ where: { userId: user.id } });
          if (!seller) throw new Error("This account is not registered as a seller.");
          return { id: user.id.toString(), email: user.email, name: user.name, image: user.image, role: "seller", sellerId: seller.id };
        }

        if (accountType === "delivery") {
          const delivery = await prisma.delivery.findUnique({ where: { userId: user.id } });
          if (!delivery) throw new Error("This account is not registered as a delivery person.");
          if (delivery.status === "PENDING")  throw new Error("Your delivery account is awaiting admin approval.");
          if (delivery.status === "REJECTED") throw new Error(`Your account was rejected. Reason: ${delivery.rejectionReason ?? "No reason provided."}`);
          return { id: user.id.toString(), email: user.email, name: user.name, image: user.image, role: "delivery", deliveryId: delivery.id };
        }

        if (accountType === "admin") {
          const admin = await prisma.admin.findUnique({ where: { userId: user.id } });
          if (!admin) throw new Error("This account does not have admin privileges.");
          return { id: user.id.toString(), email: user.email, name: user.name, image: user.image, role: "admin", adminId: admin.id };
        }

        throw new Error("Invalid account type");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id         = user.id;
        token.email      = user.email;
        token.name       = user.name;
        token.role       = user.role;
        token.buyerId    = user.buyerId;
        token.sellerId   = user.sellerId;
        token.deliveryId = user.deliveryId;
        token.adminId    = user.adminId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id         = token.id;
        session.user.email      = token.email;
        session.user.name       = token.name as string | null;
        session.user.role       = token.role;
        session.user.buyerId    = token.buyerId;
        session.user.sellerId   = token.sellerId;
        session.user.deliveryId = token.deliveryId;
        session.user.adminId    = token.adminId;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user }) { console.log("Signed in:", user.email); },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};