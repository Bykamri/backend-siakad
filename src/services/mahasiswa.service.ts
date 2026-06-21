import { prisma } from "../utils/prisma";

interface CreateMahasiswaInput {
  nim: string;
  nama: string;
  tglLahir: string;
  jenisKelamin: "L" | "P";
  statusMhs?: "aktif" | "lulus";
  ijazah?: string;
  foto?: string;
  prodi: string;
  kodedsnWali: string;
}

type UpdateMahasiswaInput = Partial<Omit<CreateMahasiswaInput, "nim">>;

export const mahasiswaService = {
  async getAll(params: { prodi?: string; statusMhs?: "aktif" | "lulus" }) {
    return prisma.mahasiswa.findMany({
      where: {
        prodi: params.prodi,
        statusMhs: params.statusMhs,
      },
      include: {
        dosenWali: { select: { kodedsn: true, namaDosen: true } },
      },
      orderBy: { nama: "asc" },
    });
  },

  async getByNim(nim: string) {
    const mhs = await prisma.mahasiswa.findUnique({
      where: { nim },
      include: {
        dosenWali: { select: { kodedsn: true, namaDosen: true, prodi: true } },
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

  async create(input: CreateMahasiswaInput) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim: input.nim } });
    if (existing) throw new Error(`NIM ${input.nim} sudah digunakan`);

    const dosenWali = await prisma.dosen.findUnique({ where: { kodedsn: input.kodedsnWali } });
    if (!dosenWali) throw new Error(`Dosen wali dengan kode ${input.kodedsnWali} tidak ditemukan`);

    return prisma.mahasiswa.create({
      data: {
        ...input,
        tglLahir: new Date(input.tglLahir),
      },
    });
  },

  async update(nim: string, input: UpdateMahasiswaInput) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (!existing) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);

    if (input.kodedsnWali) {
      const dosenWali = await prisma.dosen.findUnique({ where: { kodedsn: input.kodedsnWali } });
      if (!dosenWali) throw new Error(`Dosen wali dengan kode ${input.kodedsnWali} tidak ditemukan`);
    }

    return prisma.mahasiswa.update({
      where: { nim },
      data: {
        ...input,
        tglLahir: input.tglLahir ? new Date(input.tglLahir) : undefined,
      },
    });
  },

  async remove(nim: string) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (!existing) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);
    return prisma.mahasiswa.delete({ where: { nim } });
  },
};
