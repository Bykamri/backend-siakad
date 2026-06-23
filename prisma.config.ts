import { config as loadDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

// Di Vercel env vars datang dari Dashboard, .env tidak dimuat.
// Di lokal, muat .env.xampp jika user pakai script dev:xampp,
// kalau tidak Bun otomatis baca .env.
const isVercel = !!process.env.VERCEL;

if (!isVercel && process.env.PRISMA_ENV === "xampp") {
  loadDotenv({ path: ".env.xampp", override: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
