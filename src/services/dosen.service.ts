import { prisma } from "../utils/prisma";
import { hashPassword } from "../utils/password";
import type { CreateDosenInput } from "../types/dosen";
import { deleteUploadedFileIfExists } from "../utils/upload";
import { hitungNomorUrutDosenBerikutnya, formatKodedsn } from "./kodedsn.service";
import { Prisma } from "../../generated/prisma/client";

const MAX_KODEDSN_RETRY = 5;

// Hanya field administratif yang boleh diubah oleh admin langsung
// (bukan "data diri" seperti nama/tglLahir/jenisKelamin).
type UpdateDosenAdminInput = {
  kodeProdi?: string;
  statusAktif?: boolean;
};

// Field "data diri" yang hanya boleh diubah oleh dosen sendiri
// setelah admin membuka izin edit (editPermission = true).
type UpdateDosenDataDiriInput = {
  namaDosen?: string;
  tglLahir?: string;
  jenisKelamin?: "L" | "P";
};

// Password default untuk akun dosen baru yang dibuat oleh admin.
// Dapat di-override lewat env variable DEFAULT_STAFF_PASSWORD.
const DEFAULT_STAFF_PASSWORD = process.env.DEFAULT_STAFF_PASSWORD ?? "password123";

export const dosenService = {
  // Admin: bebas lihat semua dosen, filter opsional
  async getAll(params: { kodeProdi?: string; statusAktif?: boolean }) {
    return prisma.dosen.findMany({
      where: {
        kodeProdi: params.kodeProdi,
        statusAktif: params.statusAktif,
      },
      orderBy: { namaDosen: "asc" },
    });
  },

  // Dosen: hanya boleh lihat dirinya sendiri (dicek di route, bukan di sini)
  // Mahasiswa: hanya dosen wali-nya + dosen pengampu matakuliah yang
  // sedang/pernah diambil (lewat KRS) -- daftar kodedsn yang relevan.
  async getKodedsnRelevanUntukMahasiswa(nim: string): Promise<string[]> {
    const mhs = await prisma.mahasiswa.findUnique({
      where: { nim },
      select: { kodedsnWali: true },
    });

    const krsList = await prisma.krs.findMany({
      where: { nim },
      select: { jamKelas: { select: { kodedsn: true } } },
    });

    const kodedsnSet = new Set<string>();
    if (mhs?.kodedsnWali) kodedsnSet.add(mhs.kodedsnWali);
    for (const k of krsList) kodedsnSet.add(k.jamKelas.kodedsn);

    return Array.from(kodedsnSet);
  },

  // Versi ringkas untuk mahasiswa: hanya nama + kodedsn, tanpa data sensitif
  async getRingkasUntukMahasiswa(nim: string) {
    const kodedsnList = await this.getKodedsnRelevanUntukMahasiswa(nim);
    if (kodedsnList.length === 0) return [];

    return prisma.dosen.findMany({
      where: { kodedsn: { in: kodedsnList } },
      select: { kodedsn: true, namaDosen: true },
      orderBy: { namaDosen: "asc" },
    });
  },

  // Detail lengkap (admin & dosen-untuk-dirinya-sendiri)
  async getByKode(kodedsn: string) {
    const dosen = await prisma.dosen.findUnique({
      where: { kodedsn },
      include: {
        mahasiswaWali: { select: { nim: true, nama: true, statusMhs: true } },
        jamKelas: {
          include: { matakuliah: { select: { kodemk: true, namamk: true } } },
        },
      },
    });
    if (!dosen) throw new Error(`Dosen dengan kode ${kodedsn} tidak ditemukan`);
    return dosen;
  },

  // Detail ringkas (mahasiswa, untuk dosen yang relevan dengannya saja)
  async getRingkasByKode(kodedsn: string) {
    const dosen = await prisma.dosen.findUnique({
      where: { kodedsn },
      select: { kodedsn: true, namaDosen: true },
    });
    if (!dosen) throw new Error(`Dosen dengan kode ${kodedsn} tidak ditemukan`);
    return dosen;
  },

  // Membuat dosen baru sekaligus membuat akun user-nya secara otomatis.
  // kodedsn di-generate otomatis: kodeProdi (2 digit) + nomorUrut (3 digit).
  // Contoh: prodi '11', dosen ke-6 -> kodedsn '11006'.
  // Username = kodedsn, password = dari body atau DEFAULT_STAFF_PASSWORD.
  async create(input: CreateDosenInput) {
    const prodi = await prisma.prodi.findUnique({ where: { kodeProdi: input.kodeProdi } });
    if (!prodi) throw new Error(`Prodi dengan kode ${input.kodeProdi} tidak ditemukan`);

    const { password, ...dosenData } = input;
    const hashedPassword = await hashPassword(password ?? DEFAULT_STAFF_PASSWORD);

    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_KODEDSN_RETRY; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const nomorUrut = await hitungNomorUrutDosenBerikutnya(tx, input.kodeProdi);
          const kodedsn = formatKodedsn(input.kodeProdi, nomorUrut);

          const dosen = await tx.dosen.create({
            data: {
              ...dosenData,
              kodedsn,
              tglLahir: new Date(dosenData.tglLahir),
            },
          });

          await tx.user.create({
            data: {
              username: kodedsn,
              password: hashedPassword,
              role: "dosen",
              kodedsn,
            },
          });

          return dosen;
        });
      } catch (err: unknown) {
        const isUniqueConflict =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (isUniqueConflict) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    console.error("Gagal generate kodedsn unik setelah beberapa kali percobaan:", lastError);
    throw new Error("Gagal membuat kode dosen, silakan coba lagi.");
  },

  // Update oleh ADMIN: hanya field administratif (kodeProdi, statusAktif).
  // Data diri (nama, tglLahir, jenisKelamin) hanya bisa diubah dosen sendiri
  // lewat updateDataDiri() setelah admin memberi izin.
  async update(kodedsn: string, input: UpdateDosenAdminInput) {
    const existing = await prisma.dosen.findUnique({ where: { kodedsn } });
    if (!existing) throw new Error(`Dosen dengan kode ${kodedsn} tidak ditemukan`);

    if (input.kodeProdi) {
      const prodi = await prisma.prodi.findUnique({ where: { kodeProdi: input.kodeProdi } });
      if (!prodi) throw new Error(`Prodi dengan kode ${input.kodeProdi} tidak ditemukan`);
    }

    return prisma.dosen.update({
      where: { kodedsn },
      data: input,
    });
  },

  // Update DATA DIRI oleh DOSEN SENDIRI.
  // Syarat: editPermission harus true (sudah dibuka oleh admin).
  // Setelah berhasil disimpan, editPermission otomatis di-reset ke false.
  async updateDataDiri(kodedsn: string, input: UpdateDosenDataDiriInput) {
    const existing = await prisma.dosen.findUnique({ where: { kodedsn } });
    if (!existing) throw new Error(`Dosen dengan kode ${kodedsn} tidak ditemukan`);

    if (!existing.editPermission) {
      throw new Error(
        "Anda belum mendapat izin edit dari admin. Hubungi admin untuk membuka izin edit."
      );
    }

    return prisma.dosen.update({
      where: { kodedsn },
      data: {
        ...input,
        tglLahir: input.tglLahir ? new Date(input.tglLahir) : undefined,
        editPermission: false, // auto-reset setelah dosen menyimpan
      },
      select: {
        kodedsn: true,
        namaDosen: true,
        tglLahir: true,
        jenisKelamin: true,
        editPermission: true,
        updatedAt: true,
      },
    });
  },

  // ADMIN membuka izin edit untuk dosen tertentu.
  // Setelah dosen menyimpan perubahannya, izin ini otomatis ter-reset.
  async grantEditPermission(kodedsn: string) {
    const existing = await prisma.dosen.findUnique({ where: { kodedsn } });
    if (!existing) throw new Error(`Dosen dengan kode ${kodedsn} tidak ditemukan`);

    return prisma.dosen.update({
      where: { kodedsn },
      data: { editPermission: true },
      select: { kodedsn: true, namaDosen: true, editPermission: true },
    });
  },

  // Upload/ganti foto dosen. Dapat dilakukan DOSEN SENDIRI kapan saja
  // tanpa perlu izin admin. File lama (jika ada) otomatis dihapus.
  async updateFoto(kodedsn: string, relativePath: string) {
    const existing = await prisma.dosen.findUnique({ where: { kodedsn } });
    if (!existing) throw new Error(`Dosen dengan kode ${kodedsn} tidak ditemukan`);

    await deleteUploadedFileIfExists(existing.foto);

    return prisma.dosen.update({
      where: { kodedsn },
      data: { foto: relativePath },
      select: { kodedsn: true, namaDosen: true, foto: true },
    });
  },

  async remove(kodedsn: string) {
    const existing = await prisma.dosen.findUnique({ where: { kodedsn } });
    if (!existing) throw new Error(`Dosen dengan kode ${kodedsn} tidak ditemukan`);
    return prisma.dosen.delete({ where: { kodedsn } });
  },
};
