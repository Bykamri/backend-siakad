import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

// Pilih adapter berdasarkan DATABASE_PROVIDER:
//   "postgresql" → @prisma/adapter-pg  (Supabase / Vercel production)
//   lainnya      → @prisma/adapter-mariadb  (MySQL XAMPP, default)
const isPostgres = process.env.DATABASE_PROVIDER === "postgresql";

const adapter = isPostgres
  ? new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  : new PrismaMariaDb({
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME ?? "dbakademik",
      connectionLimit: 5,
    });

export const prisma = new PrismaClient({ adapter });
