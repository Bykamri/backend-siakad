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

  // ─── BACA ────────────────────────────────────────────────────────────────

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
          "Hanya admin. Dosen gunakan GET /mahasiswa/wali atau GET /mahasiswa/diampu; " +
          "mahasiswa hanya bisa lihat dirinya sendiri lewat GET /mahasiswa/:nim.",
        tags: ["Mahasiswa"],
      },
    }
  )

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
        tags: ["Mahasiswa"],
      },
    }
  )

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
        tags: ["Mahasiswa"],
      },
    }
  )

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
          "Mahasiswa: detail lengkap, HANYA untuk dirinya sendiri. " +
          "Dosen: HANYA jika mahasiswa tersebut mahasiswa wali-nya.",
        tags: ["Mahasiswa"],
      },
    }
  )

  // ─── FOTO (mahasiswa sendiri, bebas tanpa izin admin) ────────────────────

  .post(
    "/:nim/foto",
    async ({ params, body, user, set }) => {
      if (user.role !== "mahasiswa" || user.nim !== params.nim) {
        set.status = 403;
        return {
          success: false,
          message: "Hanya mahasiswa yang bersangkutan yang dapat mengubah foto",
        };
      }
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
        summary: "[Mahasiswa] Upload/ganti foto sendiri",
        description:
          "Hanya mahasiswa yang bersangkutan (token NIM = NIM di URL) yang boleh upload foto. " +
          "Admin hanya bisa melihat, tidak bisa upload/ganti foto mahasiswa. " +
          "Body multipart/form-data, field 'foto'. JPG/PNG/WEBP, maksimal 5MB. " +
          "File lama otomatis dihapus. Tidak perlu izin admin.",
        tags: ["Mahasiswa"],
      },
    }
  )

  // ─── IJAZAH (mahasiswa upload, admin verifikasi) ─────────────────────────

  .post(
    "/:nim/ijazah",
    async ({ params, body, user, set }) => {
      if (user.role !== "mahasiswa" || user.nim !== params.nim) {
        set.status = 403;
        return {
          success: false,
          message: "Hanya mahasiswa yang bersangkutan yang dapat mengunggah ijazah",
        };
      }
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
        summary: "[Mahasiswa] Upload scan ijazah sendiri (status jadi 'menunggu')",
        description:
          "Hanya mahasiswa yang bersangkutan yang boleh upload ijazah. Setelah upload, " +
          "status ijazah otomatis berubah menjadi 'menunggu' dan admin harus memverifikasi " +
          "lewat PATCH /mahasiswa/:nim/ijazah/verifikasi. Body multipart/form-data, field " +
          "'ijazah'. Hanya PDF, maksimal 10MB.",
        tags: ["Mahasiswa"],
      },
    }
  )

  // ─── UPDATE DATA DIRI (mahasiswa sendiri, harus ada izin admin) ──────────

  .patch(
    "/:nim/data-diri",
    async ({ params, body, user, set }) => {
      if (user.role !== "mahasiswa" || user.nim !== params.nim) {
        set.status = 403;
        return {
          success: false,
          message: "Hanya mahasiswa yang bersangkutan yang dapat mengubah data diri",
        };
      }
      try {
        const data = await mahasiswaService.updateDataDiri(params.nim, body);
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
      }),
      detail: {
        summary: "[Mahasiswa] Update data diri sendiri (butuh izin admin terlebih dahulu)",
        description:
          "Hanya mahasiswa yang bersangkutan. Membutuhkan izin dari admin terlebih dahulu " +
          "(admin harus memanggil PATCH /mahasiswa/:nim/izin-edit). Setelah data berhasil " +
          "disimpan, izin edit otomatis ter-reset. Jika ingin edit lagi, admin harus membuka " +
          "izin ulang. Field yang bisa diubah: nama, tglLahir, jenisKelamin.",
        tags: ["Mahasiswa"],
      },
    }
  )

  // ─── ADMIN ONLY ──────────────────────────────────────────────────────────

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
        kodeProdi: t.String(),
        angkatan: t.Integer(),
        kodedsnWali: t.Optional(t.String()),
        password: t.Optional(t.String({ description: "Password akun mahasiswa. Default: DEFAULT_STAFF_PASSWORD env var." })),
      }),
      detail: {
        summary: "[Admin] Tambah mahasiswa baru secara manual (akun user otomatis dibuat)",
        description:
          "Untuk input manual oleh admin (misal migrasi data lama). Sekaligus membuat akun " +
          "login dengan username = NIM. Password = nilai dari body (jika ada) atau DEFAULT_STAFF_PASSWORD env var. " +
          "Pendaftaran mandiri mahasiswa yang generate NIM otomatis tetap lewat POST /auth/register.",
        tags: ["Mahasiswa"],
      },
    }
  )

  // Admin update field administratif mahasiswa: dosen wali, prodi, status, angkatan.
  // Data diri (nama, tglLahir, jenisKelamin) TIDAK bisa diubah admin --
  // gunakan PATCH /:nim/izin-edit untuk beri izin ke mahasiswa.
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
        kodedsnWali: t.Optional(t.Nullable(t.String())),
        kodeProdi: t.Optional(t.String()),
        statusMhs: t.Optional(t.Union([t.Literal("aktif"), t.Literal("lulus")])),
        angkatan: t.Optional(t.Integer()),
      }),
      detail: {
        summary: "[Admin] Update data administratif mahasiswa",
        description:
          "Admin hanya boleh mengubah field administratif: kodedsnWali (assign dosen wali), " +
          "kodeProdi, statusMhs, angkatan. Untuk mengubah data diri mahasiswa (nama, tglLahir, " +
          "jenisKelamin), admin harus memberi izin lewat PATCH /mahasiswa/:nim/izin-edit " +
          "agar mahasiswa bisa update sendiri. kodedsnWali bisa di-set null untuk un-assign.",
        tags: ["Mahasiswa"],
      },
    }
  )

  .patch(
    "/:nim/ijazah/verifikasi",
    async ({ params, body, set }) => {
      try {
        const data = await mahasiswaService.verifikasiIjazah(
          params.nim,
          body.status,
          body.catatan
        );
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        status: t.Union([t.Literal("diterima"), t.Literal("ditolak")]),
        catatan: t.Optional(t.String({ maxLength: 500 })),
      }),
      detail: {
        summary: "[Admin] Verifikasi ijazah mahasiswa",
        description:
          "Hanya bisa dipanggil jika status ijazah saat ini adalah 'menunggu' (mahasiswa " +
          "sudah upload). Admin menentukan status 'diterima' atau 'ditolak', dengan catatan " +
          "opsional (misalnya alasan penolakan). Jika ditolak, mahasiswa bisa upload ulang " +
          "(status kembali ke 'menunggu') dan admin perlu verifikasi lagi.",
        tags: ["Mahasiswa"],
      },
    }
  )

  .patch(
    "/:nim/izin-edit",
    async ({ params, set }) => {
      try {
        const data = await mahasiswaService.grantEditPermission(params.nim);
        return {
          success: true,
          message: `Izin edit data diri telah dibuka untuk mahasiswa ${params.nim}`,
          data,
        };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      detail: {
        summary: "[Admin] Buka izin edit data diri untuk mahasiswa",
        description:
          "Mengaktifkan flag editPermission = true pada mahasiswa tertentu, sehingga mahasiswa " +
          "tersebut dapat memperbarui data dirinya (nama, tglLahir, jenisKelamin) melalui " +
          "PATCH /mahasiswa/:nim/data-diri. Setelah mahasiswa menyimpan perubahan, izin ini " +
          "otomatis ter-reset ke false.",
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
