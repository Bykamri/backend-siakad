import { Elysia, t } from "elysia";
import { authGuard, requireRole } from "../middleware/auth";
import { fakultasService, prodiService } from "../services/prodi.service";

// Daftar prodi bersifat PUBLIK (tanpa login) supaya bisa dipakai
// sebagai pilihan dropdown di form registrasi mahasiswa.
export const prodiPublicRoutes = new Elysia({ prefix: "/prodi" }).get(
  "/",
  async () => {
    const data = await prodiService.getAll();
    return { success: true, data };
  },
  {
    detail: {
      summary: "[Publik] Daftar semua prodi",
      description:
        "Tidak perlu login. Dipakai sebagai pilihan dropdown kodeProdi di form " +
        "registrasi mahasiswa (POST /auth/register).",
      tags: ["Prodi"],
    },
  }
);

export const fakultasRoutes = new Elysia({ prefix: "/fakultas" })
  .use(authGuard)
  .use(requireRole(["admin"]))
  .get(
    "/",
    async () => {
      const data = await fakultasService.getAll();
      return { success: true, data };
    },
    { detail: { summary: "[Admin] Daftar semua fakultas", tags: ["Prodi"] } }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const data = await fakultasService.create(body);
        set.status = 201;
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        kodeFakultas: t.String({ minLength: 1, maxLength: 1 }),
        namaFakultas: t.String(),
      }),
      detail: { summary: "[Admin] Tambah fakultas baru", tags: ["Prodi"] },
    }
  );

export const prodiAdminRoutes = new Elysia({ prefix: "/prodi" })
  .use(authGuard)
  .use(requireRole(["admin"]))
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const data = await prodiService.create(body);
        set.status = 201;
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        kodeProdi: t.String({
          minLength: 2,
          maxLength: 2,
          description: "2 digit: 1 digit kode fakultas + 1 digit urutan prodi dalam fakultas",
        }),
        namaProdi: t.String(),
        kodeFakultas: t.String({ minLength: 1, maxLength: 1 }),
      }),
      detail: { summary: "[Admin] Tambah prodi baru", tags: ["Prodi"] },
    }
  );
