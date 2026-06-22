import { prisma } from "../utils/prisma";
import type { CreateMahasiswaInput } from "../types/mahasiswa";
import { deleteUploadedFileIfExists } from "../utils/upload";

type UpdateMahasiswaInput = Partial<Omit<CreateMahasiswaInput, "nim">>;

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

  // Dosen - daftar 2: mahasiswa yang mengambil jam_kelas yang dia ampu
  // (catatan: implementasi penuh ada di krsService.getMahasiswaUntukDinilai,
  //  method ini hanya dipakai untuk pengecekan "apakah nim X relevan bagi
  //  dosen Y" di endpoint detail GET /mahasiswa/:nim)
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

  // Detail untuk DOSEN WALI: boleh lihat seluruh nilai matakuliah mahasiswa
  // walinya (mirip getByNim, tapi dipisah agar jelas aturan aksesnya beda
  // dari endpoint standar dan mudah disesuaikan formatnya di kemudian hari)
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

  async create(input: CreateMahasiswaInput) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim: input.nim } });
    if (existing) throw new Error(`NIM ${input.nim} sudah digunakan`);

    const prodi = await prisma.prodi.findUnique({ where: { kodeProdi: input.kodeProdi } });
    if (!prodi) throw new Error(`Prodi dengan kode ${input.kodeProdi} tidak ditemukan`);

    if (input.kodedsnWali) {
      const dosenWali = await prisma.dosen.findUnique({ where: { kodedsn: input.kodedsnWali } });
      if (!dosenWali) throw new Error(`Dosen wali dengan kode ${input.kodedsnWali} tidak ditemukan`);
    }

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
      data: {
        ...input,
        tglLahir: input.tglLahir ? new Date(input.tglLahir) : undefined,
      },
    });
  },

  // Upload/ganti foto mahasiswa. File lama (jika ada) otomatis dihapus.
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


  // Upload/ganti scan ijazah (PDF). Biasanya dipakai admin saat mahasiswa
  // lulus, tapi tidak dipaksa cek statusMhs di sini supaya admin tetap
  // bisa upload/koreksi file kapan saja.
  async updateIjazah(nim: string, relativePath: string) {
    const existing = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (!existing) throw new Error(`Mahasiswa dengan NIM ${nim} tidak ditemukan`);

    await deleteUploadedFileIfExists(existing.ijazah);

    return prisma.mahasiswa.update({
      where: { nim },
      data: { ijazah: relativePath },
      select: { nim: true, nama: true, ijazah: true },
    });
  },

  // Dipakai src/index.ts untuk cek kepemilikan saat mahasiswa minta akses
  // GET /uploads/ijazah/<file> -- mencocokkan path file dengan kolom
  // ijazah mahasiswa, return nim pemiliknya (atau null jika tidak ada).
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