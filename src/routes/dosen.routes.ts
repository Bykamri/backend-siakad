import { Elysia, t } from "elysia";
import { authGuard, requireRole } from "../middleware/auth";
import { dosenService } from "../services/dosen.service";
import { saveUploadedFile, UPLOAD_SUBDIR, FOTO_MIME_TYPES } from "../utils/upload";


export const dosenRoutes = new Elysia({ prefix: "/dosen" })

  .use(authGuard)

  // ─── BACA (semua role, hasil berbeda per role) ───────────────────────────

  .get(
    "/",
    async ({ query, user, set }) => {
      if (user.role === "admin") {
        const data = await dosenService.getAll({
          kodeProdi: query.kodeProdi,
          statusAktif: query.statusAktif === undefined ? undefined : query.statusAktif === "true",
        });
        return { success: true, data };
      }

      if (user.role === "dosen") {
        const data = await dosenService.getByKode(user.kodedsn!);
        return { success: true, data: [data] };
      }

      // mahasiswa
      const data = await dosenService.getRingkasUntukMahasiswa(user.nim!);
      return { success: true, data };
    },
    {
      query: t.Object({
        kodeProdi: t.Optional(t.String()),
        statusAktif: t.Optional(t.String()),
      }),
      detail: {
        summary: "[Admin, Dosen, Mahasiswa] Daftar dosen (hasil berbeda per role)",
        description:
          "Admin: semua dosen (bisa difilter kodeProdi/statusAktif). " +
          "Dosen: hanya dirinya sendiri, ditampilkan sebagai array 1 item. " +
          "Mahasiswa: hanya dosen wali-nya + dosen pengampu matakuliah yang sedang/pernah " +
          "diambil (lewat KRS), dengan data RINGKAS (nama + kodedsn saja).",
        tags: ["Dosen"],
      },
    }
  )

  .get(
    "/:kodedsn",
    async ({ params, user, set }) => {
      try {
        if (user.role === "admin") {
          const data = await dosenService.getByKode(params.kodedsn);
          return { success: true, data };
        }

        if (user.role === "dosen") {
          if (user.kodedsn !== params.kodedsn) {
            set.status = 403;
            return { success: false, message: "Anda hanya boleh mengakses data Anda sendiri" };
          }
          const data = await dosenService.getByKode(params.kodedsn);
          return { success: true, data };
        }

        // mahasiswa
        const relevan = await dosenService.getKodedsnRelevanUntukMahasiswa(user.nim!);
        if (!relevan.includes(params.kodedsn)) {
          set.status = 403;
          return {
            success: false,
            message:
              "Anda hanya boleh mengakses dosen wali Anda atau dosen pengampu matakuliah yang Anda ambil",
          };
        }
        const data = await dosenService.getRingkasByKode(params.kodedsn);
        return { success: true, data };
      } catch (err) {
        set.status = 404;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      detail: {
        summary: "[Admin, Dosen, Mahasiswa] Detail satu dosen (akses & data berbeda per role)",
        description:
          "Admin: detail lengkap, bebas kodedsn manapun. " +
          "Dosen: detail lengkap, HANYA untuk dirinya sendiri (403 jika kodedsn lain). " +
          "Mahasiswa: data RINGKAS (nama + kodedsn saja), HANYA jika kodedsn tersebut dosen " +
          "wali-nya atau dosen pengampu matakuliah yang sedang/pernah ia ambil.",
        tags: ["Dosen"],
      },
    }
  )

  // ─── FOTO (dosen sendiri, bebas tanpa izin admin) ────────────────────────

  .post(
    "/:kodedsn/foto",
    async ({ params, body, user, set }) => {
      if (user.role !== "dosen" || user.kodedsn !== params.kodedsn) {
        set.status = 403;
        return { success: false, message: "Hanya dosen yang bersangkutan yang dapat mengubah foto" };
      }
      try {
        const relativePath = await saveUploadedFile(body.foto, UPLOAD_SUBDIR.fotoDosen, params.kodedsn);
        const data = await dosenService.updateFoto(params.kodedsn, relativePath);
        return { success: true, data };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      body: t.Object({
        foto: t.File({ type: FOTO_MIME_TYPES, maxSize: "5m" }),
      }),
      detail: {
        summary: "[Dosen] Upload/ganti foto sendiri",
        description:
          "Hanya dosen yang bersangkutan (token = kodedsn yang sama) yang boleh upload foto. " +
          "Admin hanya bisa melihat, tidak bisa upload/ganti foto dosen. " +
          "Body multipart/form-data, field 'foto'. Format: JPG/PNG/WEBP, maksimal 5MB. " +
          "File lama otomatis dihapus saat diganti. Tidak perlu izin admin.",
        tags: ["Dosen"],
      },
    }
  )

  // ─── UPDATE DATA DIRI (dosen sendiri, harus ada izin admin) ─────────────

  .patch(
    "/:kodedsn/data-diri",
    async ({ params, body, user, set }) => {
      if (user.role !== "dosen" || user.kodedsn !== params.kodedsn) {
        set.status = 403;
        return {
          success: false,
          message: "Hanya dosen yang bersangkutan yang dapat mengubah data diri",
        };
      }
      try {
        const data = await dosenService.updateDataDiri(params.kodedsn, body);
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
        jenisKelamin: t.Optional(t.Union([t.Literal("L"), t.Literal("P")])),
      }),
      detail: {
        summary: "[Dosen] Update data diri sendiri (butuh izin admin terlebih dahulu)",
        description:
          "Hanya dosen yang bersangkutan. Membutuhkan izin dari admin terlebih dahulu " +
          "(admin harus memanggil PATCH /dosen/:kodedsn/izin-edit). Setelah data berhasil " +
          "disimpan, izin edit otomatis ter-reset -- jika ingin edit lagi, admin harus " +
          "membuka izin ulang. Field yang bisa diubah: namaDosen, tglLahir, jenisKelamin.",
        tags: ["Dosen"],
      },
    }
  )

  // ─── ADMIN ONLY ──────────────────────────────────────────────────────────

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
        namaDosen: t.String(),
        tglLahir: t.String({ format: "date" }),
        kodeProdi: t.String({ description: "Kode prodi 2 digit, contoh: 41" }),
        statusAktif: t.Optional(t.Boolean()),
        jenisKelamin: t.Union([t.Literal("L"), t.Literal("P")]),
        password: t.Optional(t.String({ description: "Password akun dosen. Default: DEFAULT_STAFF_PASSWORD env var." })),
      }),
      detail: {
        summary: "[Admin] Tambah dosen baru (akun user otomatis dibuat)",
        description:
          "Menambah data dosen sekaligus membuat akun login-nya secara otomatis. " +
          "Username = kodedsn, password = nilai dari body (jika ada) atau DEFAULT_STAFF_PASSWORD env var. " +
          "Dosen tidak perlu registrasi mandiri.",
        tags: ["Dosen"],
      },
    }
  )

  // Admin update field administratif dosen: kodeProdi dan statusAktif.
  // Data diri (nama, tglLahir, jenisKelamin) TIDAK bisa diubah admin --
  // gunakan PATCH /:kodedsn/izin-edit untuk beri izin ke dosen.
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
        kodeProdi: t.Optional(t.String()),
        statusAktif: t.Optional(t.Boolean()),
      }),
      detail: {
        summary: "[Admin] Update data administratif dosen (prodi & status aktif)",
        description:
          "Admin hanya boleh mengubah field administratif: kodeProdi dan statusAktif. " +
          "Untuk mengubah data diri dosen (nama, tglLahir, jenisKelamin), admin harus " +
          "memberi izin lewat PATCH /dosen/:kodedsn/izin-edit agar dosen bisa update sendiri.",
        tags: ["Dosen"],
      },
    }
  )

  .patch(
    "/:kodedsn/izin-edit",
    async ({ params, set }) => {
      try {
        const data = await dosenService.grantEditPermission(params.kodedsn);
        return {
          success: true,
          message: `Izin edit data diri telah dibuka untuk dosen ${params.kodedsn}`,
          data,
        };
      } catch (err) {
        set.status = 400;
        return { success: false, message: (err as Error).message };
      }
    },
    {
      detail: {
        summary: "[Admin] Buka izin edit data diri untuk dosen",
        description:
          "Mengaktifkan flag editPermission = true pada dosen tertentu, sehingga dosen " +
          "tersebut dapat memperbarui data dirinya (nama, tglLahir, jenisKelamin) melalui " +
          "PATCH /dosen/:kodedsn/data-diri. Setelah dosen menyimpan perubahan, izin ini " +
          "otomatis ter-reset ke false -- admin harus membuka ulang jika dosen ingin edit lagi.",
        tags: ["Dosen"],
      },
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
    { detail: { summary: "[Admin] Hapus dosen", tags: ["Dosen"] } }
  );
