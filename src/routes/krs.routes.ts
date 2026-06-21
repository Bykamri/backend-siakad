import { Elysia, t } from "elysia";
import { authGuard, requireRole } from "../middleware/auth";
import { krsService } from "../services/krs.service";

export const krsRoutes = new Elysia({ prefix: "/krs" })

  .use(authGuard)

  // Mahasiswa mengambil matakuliah dengan memilih jam_kelas tertentu
  .use(requireRole(["mahasiswa", "admin"]))
  .post(
    "/ambil",
    async ({ body, user, set }) => {
      try {
        // mahasiswa hanya boleh mengambil untuk dirinya sendiri,
        // admin boleh mengambilkan untuk NIM siapa pun (kasus input manual)
        const nim = user.role === "mahasiswa" ? user.nim! : body.nim;
        const data = await krsService.ambilMatakuliah({ ...body, nim });
        set.status = 201;
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        nim: t.String(),
        idJamkelas: t.Integer(),
        tahunAkademik: t.String({ pattern: "^\\d{4}/\\d{4}$" }),
        semester: t.Union([t.Literal("Ganjil"), t.Literal("Genap")]),
      }),
      detail: {
        summary: "Mahasiswa mengambil matakuliah (pilih jam kelas, dosen penilai otomatis)",
        tags: ["KRS"],
      },
    }
  );

export const krsViewRoutes = new Elysia({ prefix: "/krs" })
  .use(authGuard)

  .get(
    "/mahasiswa/:nim",
    async ({ params, user, set }) => {
      if (user.role === "mahasiswa" && user.nim !== params.nim) {
        set.status = 403;
        return { success: false, message: "Anda hanya boleh mengakses KRS Anda sendiri" };
      }
      const data = await krsService.getByMahasiswa(params.nim);
      return { success: true, data };
    },
    { detail: { summary: "Lihat KRS + dosen penilai milik mahasiswa", tags: ["KRS"] } }
  )

  .get(
    "/dosen/:kodedsn/mahasiswa",
    async ({ params, query, user, set }) => {
      if (user.role === "dosen" && user.kodedsn !== params.kodedsn) {
        set.status = 403;
        return { success: false, message: "Anda hanya boleh mengakses data kelas yang Anda ampu sendiri" };
      }
      const data = await krsService.getMahasiswaUntukDinilai(params.kodedsn, query.kodemk);
      return { success: true, data };
    },
    {
      query: t.Object({ kodemk: t.Optional(t.String()) }),
      detail: {
        summary: "Daftar mahasiswa yang harus dinilai dosen (hanya di jam kelas yang ia ampu)",
        tags: ["KRS"],
      },
    }
  )

  .use(requireRole(["dosen"]))
  .patch(
    "/:idKrs/nilai",
    async ({ params, body, user, set }) => {
      try {
        const data = await krsService.inputNilai({
          idKrs: Number(params.idKrs),
          ...body,
          kodedsnPenilai: user.kodedsn!,
        });
        return { success: true, data };
      } catch (err) {
        set.status = 403;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        nilaiAngka: t.Number({ minimum: 0, maximum: 100 }),
        nilaiHuruf: t.Optional(t.String({ maxLength: 2 })),
      }),
      detail: {
        summary: "Dosen input nilai (hanya dosen pengampu jam kelas terkait yang berhak)",
        tags: ["KRS"],
      },
    }
  );
