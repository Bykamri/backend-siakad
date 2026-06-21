import { Elysia, t } from "elysia";
import { jwtPlugin, authGuard, requireRole } from "../middleware/auth";
import { authService } from "../services/auth.service";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwtPlugin)

  // Registrasi mandiri -- SELALU jadi mahasiswa. NIM, angkatan, dan
  // username (= NIM) di-generate otomatis oleh sistem.
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const user = await authService.registerMahasiswa(body);
        set.status = 201;
        return { success: true, data: user };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        namaLengkap: t.String({ minLength: 3 }),
        tglLahir: t.String({ description: "Format: YYYY-MM-DD" }),
        jenisKelamin: t.Union([t.Literal("L"), t.Literal("P")]),
        kodeProdi: t.String({ description: "Kode prodi 2 digit, contoh: 41" }),
        password: t.String({ minLength: 6 }),
      }),
      detail: {
        summary: "[Publik] Registrasi mandiri menjadi mahasiswa",
        description:
          "Tidak perlu login. Role akun yang dibuat OTOMATIS 'mahasiswa' -- field role " +
          "tidak diminta. NIM & angkatan di-generate otomatis sistem. Angkatan ditentukan " +
          "dari tanggal registrasi: Jan-Jun = tahun ini, Jul-Des = tahun depan. Username " +
          "login = NIM hasil generate. Dosen wali belum di-assign (admin akan assign manual " +
          "nanti lewat PATCH /mahasiswa/:nim).",
        tags: ["Auth"],
      },
    }
  )

  .post(
    "/login",
    async ({ body, jwt, set }) => {
      try {
        const user = await authService.login(body);
        const token = await jwt.sign({
          idUser: user.idUser,
          username: user.username,
          role: user.role,
          nim: user.nim,
          kodedsn: user.kodedsn,
        });

        return { success: true, data: { token, user } };
      } catch (err) {
        set.status = 401;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        username: t.String({
          description: "Masukkan NIM (untuk Mahasiswa), Kode Dosen (untuk Dosen), atau Username Admin",
        }),
        password: t.String(),
      }),
      detail: {
        summary: "[Publik] Login ke sistem akademik (semua role)",
        description:
          "Tidak perlu login sebelumnya. Mendukung login menggunakan NIM bagi mahasiswa, " +
          "Kode Dosen bagi dosen, dan username khusus bagi administrator. Token JWT yang " +
          "dihasilkan berisi role, sehingga endpoint lain otomatis tahu hak akses Anda.",
        tags: ["Auth"],
      },
    }
  )

  // Hanya admin yang boleh membuat akun admin/dosen baru
  .use(requireRole(["admin"]))
  .post(
    "/register-staff",
    async ({ body, set }) => {
      try {
        const user = await authService.registerStaff(body);
        set.status = 201;
        return { success: true, data: user };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3 }),
        password: t.String({ minLength: 6 }),
        role: t.Union([t.Literal("admin"), t.Literal("dosen")]),
        kodedsn: t.Optional(t.String()),
      }),
      detail: {
        summary: "[Admin] Buat akun admin atau dosen baru",
        description:
          "Hanya admin yang bisa mengakses endpoint ini. Dipakai untuk membuat akun staff " +
          "(admin/dosen) -- BUKAN untuk mahasiswa, karena mahasiswa selalu mendaftar sendiri " +
          "lewat POST /auth/register.",
        tags: ["Auth"],
      },
    }
  );
