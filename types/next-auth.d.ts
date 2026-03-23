import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role?: 'buyer' | 'seller';
    buyerId?: number;
    sellerId?: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role?: 'buyer' | 'seller';
      buyerId?: number;
      sellerId?: number;
      image?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role?: 'buyer' | 'seller';
    buyerId?: number;
    sellerId?: number;
  }
}