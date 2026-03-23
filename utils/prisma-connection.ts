// utils/prisma-connection.ts
import  prisma  from '@/lib/prisma';

let isConnected = false;

export async function ensurePrismaConnection() {
  if (!isConnected) {
    try {
      await prisma.$connect();
      isConnected = true;
      console.log('Prisma connected successfully');
    } catch (error) {
      console.error('Failed to connect to Prisma:', error);
      throw error;
    }
  }
  return prisma;
}