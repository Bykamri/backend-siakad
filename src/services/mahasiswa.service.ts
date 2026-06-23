import { prisma } from "../utils/prisma";
import type { CreateMahasiswaInput } from "../types/mahasiswa";
import { deleteUploadedFileIfExists } from "../utils/upload";
import { hashPassword } from "../utils/password";

const DEFAULT_STAFF_PASSWORD = process.env.DEFAULT_STAFF_PASSWORD ?? "password123";

type UpdateMahasiswaAdminInput = {
  kodedsnWali?: string | null;
  kodeProdi?: string;
  statusMhs?: "aktif" | "lulus";
  angkatan?: number;
};

type UpdateMahasiswaDataDiriInput = {
  nama?: string;
  tglLahir?: string;
  jenisKelamin?: "L" | "P";
};

export const mahasiswaService = {
  // Admin: bebas lihat semua mahasiswa, filter opsional
  async getAll(params: { kodeProdi?: string; statusMhs?: "aktif" | "lulus" }) {
    return prisma.mahasiswa.findMany({
      where: {
        kodeProdi: params.kodeProdi,
        statusMhs: params.statusMhs,
      },
      include: {
        dosenWali: { select: { kodedsn: true, namaDosen: true } },
      },
      orderBy: { nama: "asc" },
    });
  },

  // Dosen - daftar 1: mahasiswa yang dia jadi DOSEN WALI
  async getMahasiswaWaliDariDosen(kodedsn: string) {
    return prisma.mahasiswa.findMany({
      where: { kodedsnWali: kodedsn },
      select: {
        nim: true,
        nama: true,
        statusMhs: true,
        angkatan: true,
        prodi: { select: { kodeProdi: true, namaProdi: true } },
      },
      orderBy: { nama: "asc" },
    });
  },

  // Untuk pengecekan apakah nim X relevan bagi dosen Y (dipakai di route)
  async getNimMahasiswaDiampuDosen(kodedsn: string): Promise<string[]> {
    const krsList = await prisma.krs.findMany({
      where: { jamKelas: { kodedsn } },
      select: { nim: true },
      distinct: ["nim"],
    });
    return krsList.map((k: { nim: string }) => k.nim);
  },

  // Detail lengkap standar (admin, atau mahasiswa untuk dirinya sendiri)
  async getByNim(nim: string) {
    const mhs = await prisma.mahasiswa.findUnique({
      where: { nim },
      include: {
        prodi: { select: { kodeProdi: true, namaProdi: true } },
        dosenWali: { select: { kodedsn: true, namaDosen: true } },
        krs: {
          include: {
            jamKelas: {
              include: {
                matakuliah: true,
                dosen: { select: { kodedsn: true, namaDosen: true } },
              },
            },
          },
        },
      },
    });
    if (!mhs) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);
    return mhs;
  },

  // Detail untuk DOSEN WALI
  async getByNimUntukDosenWali(nim: string, kodedsnDosen: string) {
    const mhs = await prisma.mahasiswa.findUnique({
      where: { nim },
      include: {
        prodi: { select: { kodeProdi: true, namaProdi: true } },
        krs: {
          include: {
            jamKelas: {
              include: {
                matakuliah: true,
                dosen: { select: { kodedsn: true, namaDosen: true } },
              },
            },
          },
        },
      },
    });
    if (!mhs) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);
    if (mhs.kodedsnWali !== kodedsnDosen) {
      throw new Error("Anda bukan dosen wali mahasiswa ini");
    }
    return mhs;
  },

  // Tambah mahasiswa secara manual oleh admin
  async create(input: CreateMahasiswaInput) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim: input.nim } });
    if (existing) throw new Error(`NIM ${input.nim} sudah digunakan`);

    const prodi = await prisma.prodi.findUnique({ where: { kodeProdi: input.kodeProdi } });
    if (!prodi) throw new Error(`Prodi dengan kode ${input.kodeProdi} tidak ditemukan`);

    if (input.kodedsnWali) {
      const dosenWali = await prisma.dosen.findUnique({ where: { kodedsn: input.kodedsnWali } });
      if (!dosenWali) throw new Error(`Dosen wali dengan kode ${input.kodedsnWali} tidak ditemukan`);
    }

    const { password, ...mahasiswaData } = input;
    const hashedPassword = await hashPassword(password ?? DEFAULT_STAFF_PASSWORD);

    return prisma.$transaction(async (tx) => {
      const mhs = await tx.mahasiswa.create({
        data: {
          ...mahasiswaData,
          tglLahir: new Date(mahasiswaData.tglLahir),
        },
      });

      const existingUser = await tx.user.findUnique({ where: { username: input.nim } });
      if (!existingUser) {
        await tx.user.create({
          data: {
            username: input.nim,
            password: hashedPassword,
            role: "mahasiswa",
            nim: input.nim,
          },
        });
      }

      return mhs;
    });
  },

  // Update oleh ADMIN: hanya field administratif.
  // Data diri (nama, tglLahir, jenisKelamin) hanya bisa diubah mahasiswa
  // sendiri lewat updateDataDiri() setelah admin memberi izin.
  async update(nim: string, input: UpdateMahasiswaAdminInput) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (!existing) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);

    if (input.kodeProdi) {
      const prodi = await prisma.prodi.findUnique({ where: { kodeProdi: input.kodeProdi } });
      if (!prodi) throw new Error(`Prodi dengan kode ${input.kodeProdi} tidak ditemukan`);
    }

    if (input.kodedsnWali) {
      const dosenWali = await prisma.dosen.findUnique({ where: { kodedsn: input.kodedsnWali } });
      if (!dosenWali) throw new Error(`Dosen wali dengan kode ${input.kodedsnWali} tidak ditemukan`);
    }

    return prisma.mahasiswa.update({
      where: { nim },
      data: input,
    });
  },

  // Update DATA DIRI oleh MAHASISWA SENDIRI.
  // Syarat: editPermission harus true (sudah dibuka oleh admin).
  // Setelah berhasil disimpan, editPermission otomatis di-reset ke false.
  async updateDataDiri(nim: string, input: UpdateMahasiswaDataDiriInput) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (!existing) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);

    if (!existing.editPermission) {
      throw new Error(
        "Anda belum mendapat izin edit dari admin. Hubungi admin untuk membuka izin edit."
      );
    }

    return prisma.mahasiswa.update({
      where: { nim },
      data: {
        ...input,
        tglLahir: input.tglLahir ? new Date(input.tglLahir) : undefined,
        editPermission: false, // auto-reset setelah mahasiswa menyimpan
      },
      select: {
        nim: true,
        nama: true,
        tglLahir: true,
        jenisKelamin: true,
        editPermission: true,
        updatedAt: true,
      },
    });
  },

  // Upload/ganti foto mahasiswa. Dapat dilakukan MAHASISWA SENDIRI kapan saja
  // tanpa perlu izin admin. File lama (jika ada) otomatis dihapus.
  async updateFoto(nim: string, relativePath: string) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (!existing) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);

    await deleteUploadedFileIfExists(existing.foto);

    return prisma.mahasiswa.update({
      where: { nim },
      data: { foto: relativePath },
      select: { nim: true, nama: true, foto: true },
    });
  },

  // Upload scan ijazah oleh MAHASISWA SENDIRI.
  // Status otomatis jadi 'menunggu' untuk menunggu verifikasi admin.
  // File lama otomatis dihapus jika ada (re-upload sebelum diverifikasi).
  async updateIjazah(nim: string, relativePath: string) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (!existing) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);

    await deleteUploadedFileIfExists(existing.ijazah);

    return prisma.mahasiswa.update({
      where: { nim },
      data: {
        ijazah: relativePath,
        ijazahStatus: "menunggu",
        ijazahCatatan: null, // reset catatan lama saat upload ulang
      },
      select: { nim: true, nama: true, ijazah: true, ijazahStatus: true },
    });
  },

  // Verifikasi ijazah oleh ADMIN.
  // Status bisa diset ke 'diterima' atau 'ditolak', dengan catatan opsional.
  async verifikasiIjazah(
    nim: string,
    status: "diterima" | "ditolak",
    catatan?: string
  ) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (!existing) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);

    if (existing.ijazahStatus !== "menunggu") {
      throw new Error(
        `Ijazah belum dalam status 'menunggu'. Status saat ini: ${existing.ijazahStatus}`
      );
    }

    return prisma.mahasiswa.update({
      where: { nim },
      data: {
        ijazahStatus: status,
        ijazahCatatan: catatan ?? null,
      },
      select: {
        nim: true,
        nama: true,
        ijazahStatus: true,
        ijazahCatatan: true,
      },
    });
  },

  // ADMIN membuka izin edit untuk mahasiswa tertentu.
  // Setelah mahasiswa menyimpan perubahannya, izin ini otomatis ter-reset.
  async grantEditPermission(nim: string) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (!existing) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);

    return prisma.mahasiswa.update({
      where: { nim },
      data: { editPermission: true },
      select: { nim: true, nama: true, editPermission: true },
    });
  },

  // Dipakai src/index.ts untuk cek kepemilikan saat mahasiswa minta akses
  // GET /uploads/ijazah/<file>
  async getNimByIjazahPath(relativePath: string): Promise<string | null> {
    const mhs = await prisma.mahasiswa.findFirst({
      where: { ijazah: relativePath },
      select: { nim: true },
    });
    return mhs?.nim ?? null;
  },

  async remove(nim: string) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (!existing) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);
    return prisma.mahasiswa.delete({ where: { nim } });
  },
};
