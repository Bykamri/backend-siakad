import { createRequire } from "node:module";
import { PrismaClient } from "../../generated/prisma";

// Single MySQL-compatible adapter dipakai untuk dev lokal (XAMPP/MariaDB)
// maupun produksi serverless (TiDB Cloud Serverless via Vercel).
// TiDB Serverless mewajibkan TLS — set DB_SSL=true di env produksi.
const isServerless = !!process.env.VERCEL;

function createAdapter() {
  // Load via createRequire supaya Bun/Vercel tidak ikut meng-evaluate
  // ESM-nya saat bundling untuk runtime serverless.
  const require = createRequire(import.meta.url);
  const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

  const useSsl = process.env.DB_SSL === "true" || process.env.DB_SSL === "1";

  return new PrismaMariaDb({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? process.env.DB_USERNAME ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? process.env.DB_DATABASE ?? "dbakademik",
    ssl: useSsl ? { rejectUnauthorized: true } : undefined,
    connectionLimit: Number(
      process.env.DB_CONNECTION_LIMIT ?? (isServerless ? 1 : 5)
    ),
  });
}

export const prisma = new PrismaClient({ adapter: createAdapter() });
