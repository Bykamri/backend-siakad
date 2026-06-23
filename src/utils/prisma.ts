import { PrismaClient } from "../../generated/prisma/client";

// Cek VERCEL=1 (build & runtime Vercel) ATAU DATABASE_PROVIDER eksplisit
const isPostgres =
  !!process.env.VERCEL || process.env.DATABASE_PROVIDER === "postgresql";

// Dynamic import: hanya adapter yang dibutuhkan yang di-load.
// Ini penting di Vercel/Bun — @prisma/adapter-mariadb membawa
// mariadb@3.4.5 yang punya internal circular ESM refs yang membuat
// Bun throw "Requested module is not instantiated yet".
const adapter = await (async () => {
  if (isPostgres) {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    return new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  }

  const { PrismaMariaDb } = await import("@prisma/adapter-mariadb");
  return new PrismaMariaDb({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "dbakademik",
    connectionLimit: 5,
  });
})();

export const prisma = new PrismaClient({ adapter });