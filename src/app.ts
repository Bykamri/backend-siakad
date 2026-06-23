import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";

import { authRoutes } from "./routes/auth.routes";
import { dosenRoutes } from "./routes/dosen.routes";
import { mahasiswaRoutes } from "./routes/mahasiswa.routes";
import { matakuliahRoutes } from "./routes/matakuliah.routes";
import { krsRoutes, krsViewRoutes } from "./routes/krs.routes";
import { prodiPublicRoutes, prodiAdminRoutes, fakultasRoutes } from "./routes/prodi.routes";

export const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "API dbakademik",
          version: "1.0.0",
          description:
            "REST API untuk sistem akademik (matakuliah, dosen, mahasiswa, KRS) dengan 3 role: " +
            "admin, dosen, mahasiswa.\n\n" +
            "**Cara membaca dokumentasi ini**: setiap endpoint diawali label role di bagian " +
            "summary, contoh `[Admin]`, `[Dosen]`, `[Admin, Dosen, Mahasiswa]`, atau `[Publik]`. " +
            "Label tersebut menunjukkan role mana yang BOLEH mengakses endpoint tersebut. Jika " +
            "lebih dari satu role tercantum, baca bagian description untuk melihat perbedaan " +
            "data/akses antar role pada endpoint yang sama (misalnya admin bisa lihat semua " +
            "data sementara mahasiswa hanya bisa lihat datanya sendiri).\n\n" +
            "Login lewat `POST /auth/login`, salin token dari response, lalu klik tombol " +
            "**Authorize** di kanan atas dan masukkan token (tanpa prefix `Bearer`) untuk " +
            "mencoba endpoint yang butuh login.",
        },
        tags: [
          { name: "Auth", description: "Registrasi & login. Sebagian besar bersifat publik." },
          { name: "Dosen", description: "Data dosen. Lihat label role di setiap endpoint." },
          { name: "Mahasiswa", description: "Data mahasiswa. Lihat label role di setiap endpoint." },
          { name: "Matakuliah", description: "Matakuliah & jam kelas." },
          { name: "KRS", description: "Pengambilan matakuliah & input nilai." },
          { name: "Prodi", description: "Data prodi & fakultas." },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description:
                "Token JWT dari response `POST /auth/login`. " +
                "Masukkan token saja (tanpa prefix `Bearer`).",
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    })
  )
  .get("/", () => ({
    success: true,
    message: "dbakademik API aktif",
    docs: "/docs",
  }))
  .use(authRoutes)
  .use(dosenRoutes)
  .use(mahasiswaRoutes)
  .use(matakuliahRoutes)
  .use(krsRoutes)
  .use(krsViewRoutes)
  .use(prodiPublicRoutes)
  .use(prodiAdminRoutes)
  .use(fakultasRoutes)
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return { success: false, message: error.message };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { success: false, message: "Endpoint tidak ditemukan" };
    }
    set.status = set.status === 200 ? 500 : set.status;
    return { success: false, message: (error as Error).message ?? "Terjadi kesalahan server" };
  });

export type App = typeof app;
