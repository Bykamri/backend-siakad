import { Elysia, t } from "elysia";
import { authGuard, requireRole } from "../middleware/auth";
import { dosenService } from "../services/dosen.service";

export const dosenRoutes = new Elysia({ prefix: "/dosen" })

  // Semua role yang sudah login boleh melihat data dosen
  .use(authGuard)
  .get(
    "/",
    async ({ query }) => {
      const data = await dosenService.getAll({
        prodi: query.prodi,
        statusAktif: query.statusAktif === undefined ? undefined : query.statusAktif === "true",
      });
      return { success: true, data };
    },
    {
      query: t.Object({
        prodi: t.Optional(t.String()),
        statusAktif: t.Optional(t.String()),
      }),
      detail: { summary: "Daftar semua dosen (filter opsional)", tags: ["Dosen"] },
    }
  )

  .get(
    "/:kodedsn",
    async ({ params, set }) => {
      try {
        const data = await dosenService.getByKode(params.kodedsn);
        return { success: true, data };
      } catch (err) {
        set.status = 404;
        return { success: false, message: (err as Error).message };
      }
    },
    { detail: { summary: "Detail dosen + mahasiswa wali + jam kelas yang diampu", tags: ["Dosen"] } }
  )

  // Hanya admin yang boleh create/update/delete data dosen
  .use(requireRole(["admin"]))
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const data = await dosenService.create(body);
        set.status = 201;
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        kodedsn: t.String({ maxLength: 10 }),
        namaDosen: t.String(),
        tglLahir: t.String({ format: "date" }),
        prodi: t.String(),
        statusAktif: t.Optional(t.Boolean()),
        foto: t.Optional(t.String()),
        jenisKelamin: t.Union([t.Literal("L"), t.Literal("P")]),
      }),
      detail: { summary: "Tambah dosen baru (admin only)", tags: ["Dosen"] },
    }
  )

  .patch(
    "/:kodedsn",
    async ({ params, body, set }) => {
      try {
        const data = await dosenService.update(params.kodedsn, body);
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        namaDosen: t.Optional(t.String()),
        tglLahir: t.Optional(t.String({ format: "date" })),
        prodi: t.Optional(t.String()),
        statusAktif: t.Optional(t.Boolean()),
        foto: t.Optional(t.String()),
        jenisKelamin: t.Optional(t.Union([t.Literal("L"), t.Literal("P")])),
      }),
      detail: { summary: "Update data dosen (admin only)", tags: ["Dosen"] },
    }
  )

  .delete(
    "/:kodedsn",
    async ({ params, set }) => {
      try {
        await dosenService.remove(params.kodedsn);
        return { success: true, message: "Dosen berhasil dihapus" };
      } catch (err) {
        set.status = 400;
        return {
          success: false,
          message:
            (err as Error).message.includes("foreign key") ||
            (err as Error).message.includes("Foreign key")
              ? "Dosen tidak bisa dihapus karena masih menjadi dosen wali atau pengampu jam kelas"
              : (err as Error).message,
        };
      }
    },
    { detail: { summary: "Hapus dosen (admin only)", tags: ["Dosen"] } }
  );
