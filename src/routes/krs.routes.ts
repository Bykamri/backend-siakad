import { Elysia, t } from "elysia";
import { authGuard, requireRole } from "../middleware/auth";
import { krsService } from "../services/krs.service";
import { mahasiswaService } from "../services/mahasiswa.service";

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
        summary: "[Admin, Mahasiswa] Ambil matakuliah (pilih jam kelas)",
        description:
          "Mahasiswa: hanya boleh mengambil untuk dirinya sendiri (field nim di body " +
          "diabaikan, diganti otomatis dengan NIM dari token). Admin: boleh mengambilkan " +
          "untuk NIM siapa pun (kasus input manual). Dosen penilai ditentukan otomatis " +
          "dari dosen pengampu jam_kelas yang dipilih.",
        tags: ["KRS"],
      },
    }
  );

export const krsViewRoutes = new Elysia({ prefix: "/krs" })
  .use(authGuard)

  // GET /krs/mahasiswa/:nim -- lihat KRS + dosen penilai milik mahasiswa.
  // admin     : bebas nim manapun.
  // mahasiswa : hanya KRS dirinya sendiri.
  // dosen     : hanya jika dia dosen wali mahasiswa tersebut (boleh lihat
  //             seluruh nilai matakuliahnya, sesuai matriks akses).
  .get(
    "/mahasiswa/:nim",
    async ({ params, user, set }) => {
      if (user.role === "mahasiswa" && user.nim !== params.nim) {
        set.status = 403;
        return { success: false, message: "Anda hanya boleh mengakses KRS Anda sendiri" };
      }

      if (user.role === "dosen") {
        try {
          // getByNimUntukDosenWali melempar error jika bukan dosen wali
          await mahasiswaService.getByNimUntukDosenWali(params.nim, user.kodedsn!);
        } catch (err) {
          set.status = 403;
          return { success: false, message: (err as Error).message };
        }
      }

      const data = await krsService.getByMahasiswa(params.nim);
      return { success: true, data };
    },
    {
      detail: {
        summary: "[Admin, Dosen, Mahasiswa] Lihat KRS + dosen penilai milik mahasiswa",
        description:
          "Admin: bebas nim manapun. " +
          "Mahasiswa: hanya KRS dirinya sendiri (403 jika nim lain). " +
          "Dosen: hanya jika dia dosen WALI mahasiswa tersebut (403 jika bukan wali, " +
          "termasuk jika dosen tersebut hanya pengampu salah satu matakuliahnya tapi " +
          "bukan wali -- gunakan GET /mahasiswa/diampu untuk kasus itu).",
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
        summary: "[Dosen] Input nilai mahasiswa",
        description:
          "Hanya dosen yang berhasil login. Khusus dosen yang menjadi PENGAMPU jam_kelas " +
          "terkait KRS tersebut -- status dosen wali TIDAK relevan di sini (dosen wali yang " +
          "bukan pengampu kelas tetap ditolak 403, dan dosen pengampu yang bukan wali tetap " +
          "berhak input nilai).",
        tags: ["KRS"],
      },
    }
  );
