import { Elysia, t } from "elysia";
import { authGuard, requireRole } from "../middleware/auth";
import { mahasiswaService } from "../services/mahasiswa.service";
import { krsService } from "../services/krs.service";
import {
  saveUploadedFile,
  UPLOAD_SUBDIR,
  FOTO_MIME_TYPES,
  IJAZAH_MIME_TYPES,
} from "../utils/upload";

export const mahasiswaRoutes = new Elysia({ prefix: "/mahasiswa" })

  .use(authGuard)

  // GET / -- hanya admin (daftar semua mahasiswa, filter opsional).
  // dosen & mahasiswa TIDAK bisa lihat daftar lengkap lewat endpoint ini;
  // gunakan /mahasiswa/wali atau /mahasiswa/diampu untuk dosen.
  .get(
    "/",
    async ({ query, user, set }) => {
      if (user.role !== "admin") {
        set.status = 403;
        return {
          success: false,
          message:
            user.role === "dosen"
              ? "Gunakan /mahasiswa/wali atau /mahasiswa/diampu untuk melihat mahasiswa yang relevan dengan Anda"
              : "Mahasiswa hanya boleh mengakses data dirinya sendiri",
        };
      }
      const data = await mahasiswaService.getAll({
        kodeProdi: query.kodeProdi,
        statusMhs: query.statusMhs as "aktif" | "lulus" | undefined,
      });
      return { success: true, data };
    },
    {
      query: t.Object({
        kodeProdi: t.Optional(t.String()),
        statusMhs: t.Optional(t.Union([t.Literal("aktif"), t.Literal("lulus")])),
      }),
      detail: {
        summary: "[Admin] Daftar semua mahasiswa",
        description:
          "Hanya admin yang bisa mengakses daftar lengkap ini. Dosen gunakan " +
          "GET /mahasiswa/wali atau GET /mahasiswa/diampu; mahasiswa hanya bisa lihat " +
          "dirinya sendiri lewat GET /mahasiswa/:nim.",
        tags: ["Mahasiswa"],
      },
    }
  )

  // Dosen - daftar 1: mahasiswa yang dia jadi DOSEN WALI
  .get(
    "/wali",
    async ({ user, set }) => {
      if (user.role !== "dosen") {
        set.status = 403;
        return { success: false, message: "Hanya dosen yang bisa mengakses daftar ini" };
      }
      const data = await mahasiswaService.getMahasiswaWaliDariDosen(user.kodedsn!);
      return { success: true, data };
    },
    {
      detail: {
        summary: "[Dosen] Daftar mahasiswa wali (mahasiswa yang ia bimbing)",
        description:
          "Hanya dosen yang bisa mengakses endpoint ini. Menampilkan mahasiswa yang " +
          "kodedsn_wali-nya = dosen yang sedang login. Mahasiswa yang belum di-assign " +
          "dosen wali oleh admin tidak akan muncul di daftar siapa pun.",
        tags: ["Mahasiswa"],
      },
    }
  )

  // Dosen - daftar 2: mahasiswa yang mengambil jam_kelas yang dia ampu
  .get(
    "/diampu",
    async ({ query, user, set }) => {
      if (user.role !== "dosen") {
        set.status = 403;
        return { success: false, message: "Hanya dosen yang bisa mengakses daftar ini" };
      }
      const data = await krsService.getMahasiswaUntukDinilai(user.kodedsn!, query.kodemk);
      return { success: true, data };
    },
    {
      query: t.Object({ kodemk: t.Optional(t.String()) }),
      detail: {
        summary: "[Dosen] Daftar mahasiswa yang diampu (untuk keperluan penilaian)",
        description:
          "Hanya dosen yang bisa mengakses endpoint ini. Menampilkan mahasiswa yang " +
          "mengambil jam_kelas yang diampu dosen ini, terlepas dari status dosen wali. " +
          "Daftar ini TERPISAH dari GET /mahasiswa/wali -- seorang mahasiswa bisa muncul " +
          "di daftar ini tanpa dosen tersebut menjadi dosen wali-nya.",
        tags: ["Mahasiswa"],
      },
    }
  )

  // GET /:nim -- detail satu mahasiswa.
  // admin     : detail lengkap, bebas nim manapun.
  // mahasiswa : detail lengkap, HANYA untuk dirinya sendiri.
  // dosen     : HANYA jika mahasiswa tersebut adalah mahasiswa wali-nya
  //             (boleh lihat seluruh nilai matakuliahnya); jika bukan wali
  //             tapi ada di kelas yang ia ampu, gunakan /mahasiswa/diampu.
  .get(
    "/:nim",
    async ({ params, user, set }) => {
      try {
        if (user.role === "admin") {
          const data = await mahasiswaService.getByNim(params.nim);
          return { success: true, data };
        }

        if (user.role === "mahasiswa") {
          if (user.nim !== params.nim) {
            set.status = 403;
            return { success: false, message: "Anda hanya boleh mengakses data Anda sendiri" };
          }
          const data = await mahasiswaService.getByNim(params.nim);
          return { success: true, data };
        }

        // dosen -- hanya boleh sebagai dosen wali
        const data = await mahasiswaService.getByNimUntukDosenWali(params.nim, user.kodedsn!);
        return { success: true, data };
      } catch (err) {
        const msg = (err as Error).message;
        set.status = msg.includes("bukan dosen wali") ? 403 : 404;
        return { success: false, message: msg };
      }
    },
    {
      detail: {
        summary: "[Admin, Dosen, Mahasiswa] Detail satu mahasiswa (akses berbeda per role)",
        description:
          "Admin: detail lengkap, bebas nim manapun. " +
          "Mahasiswa: detail lengkap, HANYA untuk dirinya sendiri (403 jika nim lain). " +
          "Dosen: HANYA jika mahasiswa tersebut mahasiswa wali-nya (boleh lihat seluruh " +
          "nilai matakuliahnya, 403 jika bukan wali). Untuk dosen pengampu yang BUKAN " +
          "wali, gunakan GET /mahasiswa/diampu untuk keperluan penilaian.",
        tags: ["Mahasiswa"],
      },
    }
  )

  // Hanya admin yang boleh create/update/delete data mahasiswa secara manual.
  // (Pendaftaran mandiri mahasiswa lewat POST /auth/register, bukan di sini.)
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
        nim: t.String({ maxLength: 8 }),
        nama: t.String(),
        tglLahir: t.String({ format: "date" }),
        jenisKelamin: t.Union([t.Literal("L"), t.Literal("P")]),
        statusMhs: t.Optional(t.Union([t.Literal("aktif"), t.Literal("lulus")])),
        ijazah: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        kodeProdi: t.String(),
        angkatan: t.Integer(),
        kodedsnWali: t.Optional(t.String()),
      }),
      detail: {
        summary: "[Admin] Tambah mahasiswa baru secara manual",
        description:
          "Untuk input manual oleh admin (misal migrasi data lama). Pendaftaran mandiri " +
          "mahasiswa yang generate NIM otomatis tetap lewat POST /auth/register.",
        tags: ["Mahasiswa"],
      },
    }
  )

  .post(
    "/:nim/foto",
    async ({ params, body, set }) => {
      try {
        const relativePath = await saveUploadedFile(body.foto, UPLOAD_SUBDIR.fotoMahasiswa, params.nim);
        const data = await mahasiswaService.updateFoto(params.nim, relativePath);
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({ foto: t.File({ type: FOTO_MIME_TYPES, maxSize: "5m" }) }),
      detail: {
        summary: "[Admin] Upload/ganti foto mahasiswa",
        description:
          "Body multipart/form-data, field 'foto'. JPG/PNG/WEBP, maksimal 5MB. " +
          "File lama otomatis dihapus. Publik lewat GET /uploads/foto-mahasiswa/<nama-file>.",
        tags: ["Mahasiswa"],
      },
    }
  )

  .post(
    "/:nim/ijazah",
    async ({ params, body, set }) => {
      try {
        const relativePath = await saveUploadedFile(body.ijazah, UPLOAD_SUBDIR.ijazah, params.nim);
        const data = await mahasiswaService.updateIjazah(params.nim, relativePath);
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({ ijazah: t.File({ type: IJAZAH_MIME_TYPES, maxSize: "10m" }) }),
      detail: {
        summary: "[Admin] Upload/ganti scan ijazah mahasiswa (PDF)",
        description:
          "Body multipart/form-data, field 'ijazah'. Hanya PDF, maksimal 10MB. " +
          "File lama otomatis dihapus. BERBEDA dari foto -- ijazah TIDAK publik, " +
          "hanya admin atau mahasiswa pemiliknya yang bisa GET /uploads/ijazah/<nama-file>.",
        tags: ["Mahasiswa"],
      },
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
        kodeProdi: t.Optional(t.String()),
        angkatan: t.Optional(t.Integer()),
        kodedsnWali: t.Optional(t.String()),
      }),
      detail: {
        summary: "[Admin] Update data mahasiswa (termasuk assign/ganti dosen wali)",
        description:
          "Hanya admin. Termasuk dipakai untuk meng-assign dosen wali pertama kali " +
          "(kodedsnWali NULL -> diisi) untuk mahasiswa hasil self-register.",
        tags: ["Mahasiswa"],
      },
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
    { detail: { summary: "[Admin] Hapus mahasiswa", tags: ["Mahasiswa"] } }
  );
