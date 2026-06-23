import { config as loadDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

// On Vercel, .env files are not present — env vars come from the Vercel dashboard.
// VERCEL=1 is injected automatically by the Vercel build environment.
const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  // PRISMA_ENV menentukan file env mana yang dimuat:
  //   PRISMA_ENV=supabase  → .env.supabase  (PostgreSQL, Supabase)
  //   PRISMA_ENV=xampp     → .env.xampp     (MySQL, lokal)  [default]
  const prismaEnv = process.env.PRISMA_ENV ?? "xampp";
  loadDotenv({ path: `.env.${prismaEnv}`, override: true });
}

// On Vercel always use PostgreSQL; locally respect DATABASE_PROVIDER.
const isPostgres = isVercel || process.env.DATABASE_PROVIDER === "postgresql";

// Untuk PostgreSQL, DATABASE_URL bisa pakai pooler (port 6543) dan
// DIRECT_URL pakai direct connection (port 5432) untuk migrations.
// Jika DATABASE_URL tidak di-set, fallback ke DIRECT_URL.
const pgUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
const pgDirectUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

const databaseUrl = isPostgres
  ? pgUrl!
  : `mysql://${process.env.DB_USER ?? "root"}:${encodeURIComponent(process.env.DB_PASSWORD ?? "")}@${process.env.DB_HOST ?? "localhost"}:${process.env.DB_PORT ?? "3306"}/${process.env.DB_NAME ?? "dbakademik"}`;

export default defineConfig({
  schema: isPostgres ? "prisma/schema.postgresql.prisma" : "prisma/schema.prisma",
  migrations: {
    path: isPostgres ? "prisma/migrations-pg" : "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
    ...(isPostgres && pgDirectUrl ? { directUrl: pgDirectUrl } : {}),
  },
});
