import { Elysia, t } from "elysia";
import { authGuard, requireRole } from "../middleware/auth";
import { mahasiswaService } from "../services/mahasiswa.service";

export const mahasiswaRoutes = new Elysia({ prefix: "/mahasiswa" })

  .use(authGuard)
  // admin & dosen boleh lihat semua mahasiswa; mahasiswa hanya lihat dirinya sendiri (dicek di route /:nim)
  .get(
    "/",
    async ({ query, user, set }) => {
      if (user.role === "mahasiswa") {
        set.status = 403;
        return { success: false, message: "Mahasiswa hanya boleh mengakses data dirinya sendiri" };
      }
      const data = await mahasiswaService.getAll({
        prodi: query.prodi,
        statusMhs: query.statusMhs as "aktif" | "lulus" | undefined,
      });
      return { success: true, data };
    },
    {
      query: t.Object({
        prodi: t.Optional(t.String()),
        statusMhs: t.Optional(t.Union([t.Literal("aktif"), t.Literal("lulus")])),
      }),
      detail: { summary: "Daftar semua mahasiswa (admin & dosen)", tags: ["Mahasiswa"] },
    }
  )

  .get(
    "/:nim",
    async ({ params, user, set }) => {
      // Mahasiswa hanya boleh lihat datanya sendiri; admin & dosen boleh lihat semua
      if (user.role === "mahasiswa" && user.nim !== params.nim) {
        set.status = 403;
        return { success: false, message: "Anda hanya boleh mengakses data Anda sendiri" };
      }
      try {
        const data = await mahasiswaService.getByNim(params.nim);
        return { success: true, data };
      } catch (err) {
        set.status = 404;
        return { success: false, message: (err as Error).message };
      }
    },
    { detail: { summary: "Detail mahasiswa + dosen wali + KRS", tags: ["Mahasiswa"] } }
  )

  // Hanya admin yang boleh create/update/delete data mahasiswa
  .use(requireRole(["admin"]))
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const data = await mahasiswaService.create(body);
        set.status = 201;
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        nim: t.String({ maxLength: 15 }),
        nama: t.String(),
        tglLahir: t.String({ format: "date" }),
        jenisKelamin: t.Union([t.Literal("L"), t.Literal("P")]),
        statusMhs: t.Optional(t.Union([t.Literal("aktif"), t.Literal("lulus")])),
        ijazah: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        prodi: t.String(),
        kodedsnWali: t.String(),
      }),
      detail: { summary: "Tambah mahasiswa baru (admin only)", tags: ["Mahasiswa"] },
    }
  )

  .patch(
    "/:nim",
    async ({ params, body, set }) => {
      try {
        const data = await mahasiswaService.update(params.nim, body);
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        nama: t.Optional(t.String()),
        tglLahir: t.Optional(t.String({ format: "date" })),
        jenisKelamin: t.Optional(t.Union([t.Literal("L"), t.Literal("P")])),
        statusMhs: t.Optional(t.Union([t.Literal("aktif"), t.Literal("lulus")])),
        ijazah: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        prodi: t.Optional(t.String()),
        kodedsnWali: t.Optional(t.String()),
      }),
      detail: { summary: "Update data mahasiswa (admin only)", tags: ["Mahasiswa"] },
    }
  )

  .delete(
    "/:nim",
    async ({ params, set }) => {
      try {
        await mahasiswaService.remove(params.nim);
        return { success: true, message: "Mahasiswa berhasil dihapus" };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    { detail: { summary: "Hapus mahasiswa (admin only)", tags: ["Mahasiswa"] } }
  );
