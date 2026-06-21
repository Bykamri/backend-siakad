import { prisma } from "../utils/prisma";

interface AmbilKrsInput {
  nim: string;
  idJamkelas: number;
  tahunAkademik: string; // contoh: "2025/2026"
  semester: "Ganjil" | "Genap";
}

interface InputNilaiInput {
  idKrs: number;
  nilaiAngka: number;
  nilaiHuruf?: string;
  kodedsnPenilai: string; // dosen yang sedang login & melakukan input nilai
}

export const krsService = {
  // Mahasiswa mengambil matakuliah dengan memilih jam_kelas tertentu.
  // Dosen penilai TIDAK diinput manual — otomatis ikut dosen pengampu
  // jam_kelas tersebut (didapat lewat relasi, bukan kolom terpisah).
  async ambilMatakuliah(input: AmbilKrsInput) {
    const mhs = await prisma.mahasiswa.findUnique({ where: { nim: input.nim } });
    if (!mhs) throw new Error(`Mahasiswa dengan NIM ${input.nim} tidak ditemukan`);

    const jamKelas = await prisma.jamKelas.findUnique({
      where: { idJamkelas: input.idJamkelas },
      include: { matakuliah: true, dosen: true },
    });
    if (!jamKelas) throw new Error(`Jam kelas dengan id ${input.idJamkelas} tidak ditemukan`);

    const sudahAmbil = await prisma.krs.findFirst({
      where: {
        nim: input.nim,
        idJamkelas: input.idJamkelas,
        tahunAkademik: input.tahunAkademik,
        semester: input.semester,
      },
    });
    if (sudahAmbil) {
      throw new Error("Mahasiswa sudah mengambil kelas ini pada periode yang sama");
    }

    const krs = await prisma.krs.create({
      data: {
        nim: input.nim,
        idJamkelas: input.idJamkelas,
        tahunAkademik: input.tahunAkademik,
        semester: input.semester,
      },
      include: {
        jamKelas: {
          include: { matakuliah: true, dosen: { select: { kodedsn: true, namaDosen: true } } },
        },
      },
    });

    return {
      ...krs,
      dosenPenilai: krs.jamKelas.dosen, // disertakan agar jelas siapa yg menilai
    };
  },

  // Daftar KRS milik 1 mahasiswa, lengkap dengan info dosen penilai per matakuliah
  async getByMahasiswa(nim: string) {
    const data = await prisma.krs.findMany({
      where: { nim },
      include: {
        jamKelas: {
          include: {
            matakuliah: true,
            dosen: { select: { kodedsn: true, namaDosen: true } },
          },
        },
      },
      orderBy: [{ tahunAkademik: "desc" }, { semester: "asc" }],
    });

    return data.map((k: typeof data[number]) => ({
      idKrs: k.idKrs,
      matakuliah: k.jamKelas.matakuliah,
      kelas: k.jamKelas.namaKelas,
      dosenPenilai: k.jamKelas.dosen,
      tahunAkademik: k.tahunAkademik,
      semester: k.semester,
      nilaiAngka: k.nilaiAngka,
      nilaiHuruf: k.nilaiHuruf,
    }));
  },

  // Daftar mahasiswa yang HARUS dinilai oleh dosen tertentu —
  // hanya mahasiswa di jam_kelas yang diampu dosen tersebut yang muncul,
  // sesuai aturan "yang menilai hanya 1 dosen di jam yang sama".
  async getMahasiswaUntukDinilai(kodedsn: string, kodemk?: string) {
    return prisma.krs.findMany({
      where: {
        jamKelas: {
          kodedsn,
          kodemk: kodemk,
        },
      },
      include: {
        mahasiswa: { select: { nim: true, nama: true } },
        jamKelas: { include: { matakuliah: true } },
      },
      orderBy: { mahasiswa: { nama: "asc" } },
    });
  },

  // Input nilai — divalidasi bahwa dosen yang login BENAR adalah
  // dosen pengampu jam_kelas yang bersangkutan (bukan dosen lain).
  async inputNilai(input: InputNilaiInput) {
    const krs = await prisma.krs.findUnique({
      where: { idKrs: input.idKrs },
      include: { jamKelas: true },
    });
    if (!krs) throw new Error(`KRS dengan id ${input.idKrs} tidak ditemukan`);

    if (krs.jamKelas.kodedsn !== input.kodedsnPenilai) {
      throw new Error(
        "Anda bukan dosen pengampu jam kelas ini sehingga tidak berhak memberi nilai"
      );
    }

    return prisma.krs.update({
      where: { idKrs: input.idKrs },
      data: {
        nilaiAngka: input.nilaiAngka,
        nilaiHuruf: input.nilaiHuruf,
      },
    });
  },
};
