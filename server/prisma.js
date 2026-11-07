import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Cache the client on globalThis in dev so hot reloads do not exhaust database connections.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

