import { prisma } from "../utils/prisma";

interface CreateMatakuliahInput {
  kodemk: string;
  namamk: string;
  sks: number;
}

type UpdateMatakuliahInput = Partial<Omit<CreateMatakuliahInput, "kodemk">>;

interface CreateJamKelasInput {
  kodemk: string;
  kodedsn: string;
  namaKelas: string;
  hari: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
  jamMulai: string; // "HH:mm"
  jamSelesai: string; // "HH:mm"
  ruangan?: string;
}

export const matakuliahService = {
  async getAll() {
    return prisma.matakuliah.findMany({
      include: {
        jamKelas: {
          include: { dosen: { select: { kodedsn: true, namaDosen: true } } },
        },
      },
      orderBy: { namamk: "asc" },
    });
  },

  async getByKode(kodemk: string) {
    const mk = await prisma.matakuliah.findUnique({
      where: { kodemk },
      include: {
        jamKelas: {
          include: {
            dosen: { select: { kodedsn: true, namaDosen: true } },
            krs: { select: { nim: true } },
          },
        },
      },
    });
    if (!mk) throw new Error(`Matakuliah dengan kode ${kodemk} tidak ditemukan`);
    return mk;
  },

  async create(input: CreateMatakuliahInput) {
    const existing = await prisma.matakuliah.findUnique({ where: { kodemk: input.kodemk } });
    if (existing) throw new Error(`Kode matakuliah ${input.kodemk} sudah digunakan`);
    return prisma.matakuliah.create({ data: input });
  },

  async update(kodemk: string, input: UpdateMatakuliahInput) {
    const existing = await prisma.matakuliah.findUnique({ where: { kodemk } });
    if (!existing) throw new Error(`Matakuliah dengan kode ${kodemk} tidak ditemukan`);
    return prisma.matakuliah.update({ where: { kodemk }, data: input });
  },

  async remove(kodemk: string) {
    const existing = await prisma.matakuliah.findUnique({ where: { kodemk } });
    if (!existing) throw new Error(`Matakuliah dengan kode ${kodemk} tidak ditemukan`);
    return prisma.matakuliah.delete({ where: { kodemk } });
  },
};

export const jamKelasService = {
  // Aturan "maksimal 3 jam kelas per matakuliah" dan "1 dosen hanya 1
  // jam kelas per matakuliah" sudah ditegakkan trigger + unique key di DB.
  // Di sini kita cek dulu di level aplikasi supaya pesan error lebih ramah.
  async create(input: CreateJamKelasInput) {
    const mk = await prisma.matakuliah.findUnique({ where: { kodemk: input.kodemk } });
    if (!mk) throw new Error(`Matakuliah dengan kode ${input.kodemk} tidak ditemukan`);

    const dosen = await prisma.dosen.findUnique({ where: { kodedsn: input.kodedsn } });
    if (!dosen) throw new Error(`Dosen dengan kode ${input.kodedsn} tidak ditemukan`);

    const jumlahKelas = await prisma.jamKelas.count({ where: { kodemk: input.kodemk } });
    if (jumlahKelas >= 3) {
      throw new Error(`Matakuliah ${input.kodemk} sudah memiliki 3 jam kelas (maksimal)`);
    }

    const dosenSudahMengampu = await prisma.jamKelas.findFirst({
      where: { kodemk: input.kodemk, kodedsn: input.kodedsn },
    });
    if (dosenSudahMengampu) {
      throw new Error(`Dosen ${input.kodedsn} sudah mengampu kelas lain di matakuliah ${input.kodemk}`);
    }

    // jamMulai/jamSelesai disimpan sebagai DateTime bertipe Time di DB;
    // gunakan tanggal dummy 1970-01-01 sebagai basis waktu.
    return prisma.jamKelas.create({
      data: {
        kodemk: input.kodemk,
        kodedsn: input.kodedsn,
        namaKelas: input.namaKelas,
        hari: input.hari,
        jamMulai: new Date(`1970-01-01T${input.jamMulai}:00Z`),
        jamSelesai: new Date(`1970-01-01T${input.jamSelesai}:00Z`),
        ruangan: input.ruangan,
      },
    });
  },

  async remove(idJamkelas: number) {
    const existing = await prisma.jamKelas.findUnique({ where: { idJamkelas } });
    if (!existing) throw new Error(`Jam kelas dengan id ${idJamkelas} tidak ditemukan`);
    return prisma.jamKelas.delete({ where: { idJamkelas } });
  },
};
