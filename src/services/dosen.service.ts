import { prisma } from "../utils/prisma";
import type { CreateDosenInput } from "../types/dosen";
import { deleteUploadedFileIfExists } from "../utils/upload";


type UpdateDosenInput = Partial<Omit<CreateDosenInput, "kodedsn">>;

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

  // Versi ringan untuk mahasiswa: hanya nama + kodedsn, tanpa data sensitif
  // (prodi, status aktif, daftar mahasiswa wali, dll)
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

  async create(input: CreateDosenInput) {
    const existing = await prisma.dosen.findUnique({ where: { kodedsn: input.kodedsn } });
    if (existing) throw new Error(`Kode dosen ${input.kodedsn} sudah digunakan`);

    const prodi = await prisma.prodi.findUnique({ where: { kodeProdi: input.kodeProdi } });
    if (!prodi) throw new Error(`Prodi dengan kode ${input.kodeProdi} tidak ditemukan`);

    return prisma.dosen.create({
      data: {
        ...input,
        tglLahir: new Date(input.tglLahir),
      },
    });
  },

  async update(kodedsn: string, input: UpdateDosenInput) {
    const existing = await prisma.dosen.findUnique({ where: { kodedsn } });
    if (!existing) throw new Error(`Dosen dengan kode ${kodedsn} tidak ditemukan`);

    if (input.kodeProdi) {
      const prodi = await prisma.prodi.findUnique({ where: { kodeProdi: input.kodeProdi } });
      if (!prodi) throw new Error(`Prodi dengan kode ${input.kodeProdi} tidak ditemukan`);
    }

    return prisma.dosen.update({
      where: { kodedsn },
      data: {
        ...input,
        tglLahir: input.tglLahir ? new Date(input.tglLahir) : undefined,
      },
    });
  },

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
