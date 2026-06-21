import { prisma } from "../utils/prisma";
import type { CreateFakultasInput, CreateProdiInput } from "../types/prodi";

export const fakultasService = {
  async getAll() {
    return prisma.fakultas.findMany({
      include: { prodi: { select: { kodeProdi: true, namaProdi: true } } },
      orderBy: { namaFakultas: "asc" },
    });
  },

  async create(input: CreateFakultasInput) {
    const existing = await prisma.fakultas.findUnique({ where: { kodeFakultas: input.kodeFakultas } });
    if (existing) throw new Error(`Kode fakultas ${input.kodeFakultas} sudah digunakan`);
    return prisma.fakultas.create({ data: input });
  },
};

export const prodiService = {
  // Publik (dipakai form register mahasiswa untuk pilihan prodi)
  async getAll() {
    return prisma.prodi.findMany({
      include: { fakultas: { select: { kodeFakultas: true, namaFakultas: true } } },
      orderBy: { namaProdi: "asc" },
    });
  },

  async create(input: CreateProdiInput) {
    const fakultas = await prisma.fakultas.findUnique({ where: { kodeFakultas: input.kodeFakultas } });
    if (!fakultas) throw new Error(`Fakultas dengan kode ${input.kodeFakultas} tidak ditemukan`);

    const existing = await prisma.prodi.findUnique({ where: { kodeProdi: input.kodeProdi } });
    if (existing) throw new Error(`Kode prodi ${input.kodeProdi} sudah digunakan`);

    return prisma.prodi.create({ data: input });
  },
};
