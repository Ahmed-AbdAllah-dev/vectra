// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// This checks if we are running on the server side
const prismaClientSingleton = () => {
  return new PrismaClient()
}

// This is the magic part. We declare globalThis as having a prisma property.
// If it doesn't exist, we create it.
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma