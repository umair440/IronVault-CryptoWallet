import { PrismaClient } from '@prisma/client';

const createPrismaClient = () => new PrismaClient();

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientSingleton };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
