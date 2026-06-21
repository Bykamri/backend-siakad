import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import type { JwtPayload, Role } from "../types/auth";

// Plugin JWT dasar — dipakai di /auth/login untuk sign token
export const jwtPlugin = new Elysia().use(
  jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET ?? "change_this_secret",
    exp: "8h",
  })
);

// Plugin authGuard: memverifikasi Bearer token dan menaruh payload user
// di context (ctx.user). Dipakai di route yang butuh login.
export const authGuard = new Elysia()
  .use(jwtPlugin)
  .derive({ as: "scoped" }, async ({ jwt, headers, set }) => {
    const authHeader = headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      throw new Error("Token tidak ditemukan. Sertakan header Authorization: Bearer <token>");
    }

    const token = authHeader.slice(7);
    const payload = await jwt.verify(token);

    if (!payload) {
      set.status = 401;
      throw new Error("Token tidak valid atau sudah kedaluwarsa");
    }

    return { user: payload as unknown as JwtPayload };
  });

// Helper untuk membatasi route hanya untuk role tertentu.
// Pemakaian: .use(requireRole(["admin"]))
export const requireRole = (allowedRoles: Role[]) =>
  new Elysia().use(authGuard).onBeforeHandle({ as: "scoped" }, ({ user, set }) => {
    if (!user || !allowedRoles.includes(user.role)) {
      set.status = 403;
      return {
        success: false,
        message: `Akses ditolak. Role yang diizinkan: ${allowedRoles.join(", ")}`,
      };
    }
  });
