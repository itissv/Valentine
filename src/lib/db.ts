import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const isPlaceholder = !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes("user:password") ||
    process.env.DATABASE_URL === "file:./dev.db";

export const prisma = (() => {
    try {
        if (typeof window !== 'undefined' || isPlaceholder) return null;

        if (globalForPrisma.prisma) return globalForPrisma.prisma;

        let client: PrismaClient;

        // Use Neon adapter if we're in a serverless/production environment
        // Locally, we can try to use standard connection if Pool fails
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            const pool = new Pool({ connectionString: process.env.DATABASE_URL });
            // @ts-ignore - PrismaNeon constructor type mismatch in some versions
            const adapter = new PrismaNeon(pool);
            client = new PrismaClient({ adapter });
        } else {
            // Local development: use standard client without adapter for better stability
            client = new PrismaClient();
        }

        if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
        return client;
    } catch (e) {
        console.error("Prisma initialization error:", e);
        return null; // Fallback to simulation/mock mode
    }
})();
