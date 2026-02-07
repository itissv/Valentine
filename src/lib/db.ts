import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const dbUrl = (process.env.DATABASE_URL || "").trim();
const isPlaceholder = !dbUrl ||
    dbUrl === "undefined" ||
    dbUrl === "null" ||
    dbUrl.includes("user:password") ||
    dbUrl.includes("your_neon") ||
    (!dbUrl.startsWith("postgresql://") && !dbUrl.startsWith("postgres://"));
export const prisma = (() => {
    try {
        if (typeof window !== 'undefined' || isPlaceholder) {
            if (typeof window === 'undefined') {
                console.log("🛠️ Prisma: Using Mock Mode (invalid or missing DATABASE_URL)");
            }
            return null;
        }
        if (globalForPrisma.prisma) return globalForPrisma.prisma;
        let client: PrismaClient;
        // Use Neon adapter if we're in a serverless/production environment
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            console.log("✅ Prisma: Initializing with Neon Adapter");
            const pool = new Pool({ connectionString: dbUrl });
            // @ts-ignore - PrismaNeon constructor type mismatch in some versions
            const adapter = new PrismaNeon(pool);
            client = new PrismaClient({ adapter });
        } else {
            console.log("✅ Prisma: Initializing with standard Client");
            client = new PrismaClient();
        }
        if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
        return client;
    } catch (e) {
        console.error("Prisma initialization error:", e);
        return null; // Fallback to simulation/mock mode
    }
})();
