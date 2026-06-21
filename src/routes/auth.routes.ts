import { Elysia, t } from "elysia";
import { jwtPlugin } from "../middleware/auth";
import { authService } from "../services/auth.service";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwtPlugin)

  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const user = await authService.register(body);
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
        // Menerima string bebas seperti "Teknik Informatika"
        namaProdi: t.String({ description: "Contoh: Teknik Informatika" }), 
        password: t.String({ minLength: 6 }),
      }),
      detail: {
        summary: "Registrasi mandiri mahasiswa (Default: Role Mahasiswa)",
        description: "Admin dan Dosen tidak dapat mendaftar melalui endpoint ini.",
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
          description: "Masukkan NIM (untuk Mahasiswa), Kode Dosen (untuk Dosen), atau Username Admin" 
        }),
        password: t.String(),
      }),
      detail: {
        summary: "Login ke sistem akademik",
        description: "Mendukung login menggunakan NIM bagi mahasiswa, Kode Dosen bagi dosen, dan akun khusus bagi administrator.",
        tags: ["Auth"],
      },
    }
  );