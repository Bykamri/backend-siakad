import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client";

// Driver adapter rust-free (Prisma 7) untuk MySQL/MariaDB.
// Tidak butuh native query-engine binary, jalan pure JS/TS.
const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "dbakademik",
  connectionLimit: 5,
});

export const prisma = new PrismaClient({ adapter });
