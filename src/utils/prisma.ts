import { createRequire } from "node:module";
import { PrismaClient } from "../../generated/prisma/client";

// Cek VERCEL=1 (build & runtime Vercel) ATAU DATABASE_PROVIDER eksplisit
const isPostgres =
  !!process.env.VERCEL || process.env.DATABASE_PROVIDER === "postgresql";

// Pakai createRequire (sync) alih-alih dynamic import + top-level await.
// Top-level await pada module yang banyak di-import (semua service pakai
// prisma) membuat Bun gagal meng-link module graph di Vercel dengan
// error "Requested module is not instantiated yet". createRequire tetap
// memberi conditional load — hanya satu adapter yang dimuat per env.
const require = createRequire(import.meta.url);

function createAdapter() {
  if (isPostgres) {
    const { PrismaPg } = require("@prisma/adapter-pg");
    return new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  }

  const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
  return new PrismaMariaDb({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "dbakademik",
    connectionLimit: 5,
  });
}

export const prisma = new PrismaClient({ adapter: createAdapter() });