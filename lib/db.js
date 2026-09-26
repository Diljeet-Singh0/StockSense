import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// ponytail: singleton pattern avoids connection exhaustion in Next.js dev hot-reload
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
