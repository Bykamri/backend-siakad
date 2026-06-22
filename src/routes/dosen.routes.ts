import { Elysia, t } from "elysia";
import { authGuard, requireRole } from "../middleware/auth";
import { dosenService } from "../services/dosen.service";
import { saveUploadedFile, UPLOAD_SUBDIR, FOTO_MIME_TYPES } from "../utils/upload";


export const dosenRoutes = new Elysia({ prefix: "/dosen" })

  .use(authGuard)

  // GET / -- daftar dosen.
  // admin       : semua dosen, filter opsional.
  // dosen       : hanya dirinya sendiri (ditampilkan sebagai array 1 item).
  // mahasiswa   : hanya dosen wali-nya + dosen pengampu MK yang sedang/
  //               pernah diambil (lewat KRS) -- data ringkas saja.
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

  // GET /:kodedsn -- detail satu dosen.
  // admin     : detail lengkap, bebas kodedsn manapun.
  // dosen     : detail lengkap, HANYA untuk dirinya sendiri.
  // mahasiswa : data RINGKAS (nama + kodedsn saja), HANYA jika kodedsn
  //             tersebut adalah dosen wali-nya atau pengampu MK yang
  //             sedang/pernah diambil.
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
            message: "Anda hanya boleh mengakses dosen wali Anda atau dosen pengampu matakuliah yang Anda ambil",
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
          "Mahasiswa: data RINGKAS (nama + kodedsn saja, tanpa prodi/status aktif/daftar " +
          "mahasiswa wali), HANYA jika kodedsn tersebut dosen wali-nya atau dosen pengampu " +
          "matakuliah yang sedang/pernah ia ambil (403 jika di luar itu).",
        tags: ["Dosen"],
      },
    }
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
        kodeProdi: t.String({ description: "Kode prodi 2 digit, contoh: 41" }),
        statusAktif: t.Optional(t.Boolean()),
        foto: t.Optional(t.String()),
        jenisKelamin: t.Union([t.Literal("L"), t.Literal("P")]),
      }),
      detail: { summary: "[Admin] Tambah dosen baru", tags: ["Dosen"] },
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
        kodeProdi: t.Optional(t.String()),
        statusAktif: t.Optional(t.Boolean()),
        foto: t.Optional(t.String()),
        jenisKelamin: t.Optional(t.Union([t.Literal("L"), t.Literal("P")])),
      }),
      detail: { summary: "[Admin] Update data dosen", tags: ["Dosen"] },
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
  )
    .post(
    "/:kodedsn/foto",
    async ({ params, body, set }) => {
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
        summary: "[Admin] Upload/ganti foto dosen",
        description:
          "Body multipart/form-data, field 'foto'. Format: JPG/PNG/WEBP, maksimal " +
          "5MB. File lama otomatis dihapus saat diganti. Tersimpan di " +
          "uploads/foto-dosen/, bisa diakses publik lewat " +
          "GET /uploads/foto-dosen/<nama-file> (path = nilai kolom 'foto').",
        tags: ["Dosen"],
      },
    }
  );
