import { Elysia, t } from "elysia";
import { authGuard, requireRole } from "../middleware/auth";
import { matakuliahService, jamKelasService } from "../services/matakuliah.service";

export const matakuliahRoutes = new Elysia({ prefix: "/matakuliah" })

  .use(authGuard)
  .get(
    "/",
    async () => {
      const data = await matakuliahService.getAll();
      return { success: true, data };
    },
    {
      detail: {
        summary: "[Admin, Dosen, Mahasiswa] Daftar semua matakuliah + jam kelas + pengampu",
        description: "Bisa diakses semua role yang sudah login, tanpa pembatasan tambahan.",
        tags: ["Matakuliah"],
      },
    }
  )

  .get(
    "/:kodemk",
    async ({ params, set }) => {
      try {
        const data = await matakuliahService.getByKode(params.kodemk);
        return { success: true, data };
      } catch (err) {
        set.status = 404;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      detail: {
        summary: "[Admin, Dosen, Mahasiswa] Detail matakuliah + jam kelas + mahasiswa yang ambil",
        description: "Bisa diakses semua role yang sudah login, tanpa pembatasan tambahan.",
        tags: ["Matakuliah"],
      },
    }
  )

  // Hanya admin yang boleh kelola matakuliah & jam_kelas
  .use(requireRole(["admin"]))
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const data = await matakuliahService.create(body);
        set.status = 201;
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        kodemk: t.String({ maxLength: 10 }),
        namamk: t.String(),
        sks: t.Integer({ minimum: 1, maximum: 6 }),
      }),
      detail: { summary: "[Admin] Tambah matakuliah baru", tags: ["Matakuliah"] },
    }
  )

  .patch(
    "/:kodemk",
    async ({ params, body, set }) => {
      try {
        const data = await matakuliahService.update(params.kodemk, body);
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        namamk: t.Optional(t.String()),
        sks: t.Optional(t.Integer({ minimum: 1, maximum: 6 })),
      }),
      detail: { summary: "[Admin] Update matakuliah", tags: ["Matakuliah"] },
    }
  )

  .delete(
    "/:kodemk",
    async ({ params, set }) => {
      try {
        await matakuliahService.remove(params.kodemk);
        return { success: true, message: "Matakuliah berhasil dihapus" };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    { detail: { summary: "[Admin] Hapus matakuliah", tags: ["Matakuliah"] } }
  )

  // --- Jam Kelas (sub-resource dari matakuliah) ---
  .post(
    "/:kodemk/jam-kelas",
    async ({ params, body, set }) => {
      try {
        const data = await jamKelasService.create({ ...body, kodemk: params.kodemk });
        set.status = 201;
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        kodedsn: t.String(),
        namaKelas: t.String({ maxLength: 5 }),
        hari: t.Union([
          t.Literal("Senin"),
          t.Literal("Selasa"),
          t.Literal("Rabu"),
          t.Literal("Kamis"),
          t.Literal("Jumat"),
          t.Literal("Sabtu"),
        ]),
        jamMulai: t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }),
        jamSelesai: t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }),
        ruangan: t.Optional(t.String()),
      }),
      detail: {
        summary: "[Admin] Tambah jam kelas baru untuk matakuliah",
        description: "Maksimal 3 jam kelas (dosen pengampu) per matakuliah, ditegakkan trigger DB.",
        tags: ["Matakuliah"],
      },
    }
  )

  .delete(
    "/jam-kelas/:idJamkelas",
    async ({ params, set }) => {
      try {
        await jamKelasService.remove(Number(params.idJamkelas));
        return { success: true, message: "Jam kelas berhasil dihapus" };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    { detail: { summary: "[Admin] Hapus jam kelas", tags: ["Matakuliah"] } }
  );
