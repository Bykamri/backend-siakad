import { prisma } from "../utils/prisma";

interface CreateDosenInput {
  kodedsn: string;
  namaDosen: string;
  tglLahir: string;
  prodi: string;
  statusAktif?: boolean;
  foto?: string;
  jenisKelamin: "L" | "P";
}

type UpdateDosenInput = Partial<Omit<CreateDosenInput, "kodedsn">>;

export const dosenService = {
  async getAll(params: { prodi?: string; statusAktif?: boolean }) {
    return prisma.dosen.findMany({
      where: {
        prodi: params.prodi,
        statusAktif: params.statusAktif,
      },
      orderBy: { namaDosen: "asc" },
    });
  },

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

  async create(input: CreateDosenInput) {
    const existing = await prisma.dosen.findUnique({ where: { kodedsn: input.kodedsn } });
    if (existing) throw new Error(`Kode dosen ${input.kodedsn} sudah digunakan`);

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

    return prisma.dosen.update({
      where: { kodedsn },
      data: {
        ...input,
        tglLahir: input.tglLahir ? new Date(input.tglLahir) : undefined,
      },
    });
  },

  async remove(kodedsn: string) {
    const existing = await prisma.dosen.findUnique({ where: { kodedsn } });
    if (!existing) throw new Error(`Dosen dengan kode ${kodedsn} tidak ditemukan`);

    // FK RESTRICT akan otomatis menolak penghapusan jika dosen masih
    // jadi wali mahasiswa atau pengampu jam_kelas — pesan ditangkap di route.
    return prisma.dosen.delete({ where: { kodedsn } });
  },
};
