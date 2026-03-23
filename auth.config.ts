// auth.config.ts
// auth.config.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const buyer = await prisma.buyer.findUnique({
          where: { email: credentials.email }
        });

        if (!buyer) {
          throw new Error("No buyer found with this email");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          buyer.password
        );

        if (!isValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: buyer.id.toString(),
          email: buyer.email,
          name: buyer.name,
          role: "buyer"
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as any;
        session.user.id = token.sub as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/auth/error"
  },
  secret: process.env.NEXTAUTH_SECRET
};