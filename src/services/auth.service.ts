import { prisma } from "../utils/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { Prisma } from "../../generated/prisma/client";
import type { JenisKelamin } from "../../generated/prisma/client";

interface RegisterMahasiswaInput {
  namaLengkap: string;
  tglLahir: string;
  jenisKelamin: JenisKelamin;
  namaProdi: string; // nama prodi bebas, contoh: "Teknik Informatika"
  password: string;
}

interface LoginInput {
  username: string;
  password: string;
}

// Batas percobaan ulang jika nomor urut NIM bentrok (race condition saat
// dua pendaftaran terjadi nyaris bersamaan untuk prodi & angkatan yang sama)
const MAX_NIM_RETRY = 5;

export const authService = {
  async register(input: RegisterMahasiswaInput) {
    const { namaLengkap, tglLahir, jenisKelamin, namaProdi, password } = input;

    // 1. Cari prodi LANGSUNG dari database berdasarkan namanya.
    //    Tidak ada lagi tabel translasi manual (TRANSLASI_PRODI) yang harus
    //    di-update setiap kali ada prodi baru -- sumber kebenarannya cuma
    //    satu, yaitu tabel `prodi`. Kolom `nama_prodi` memakai collation
    //    utf8mb4_unicode_ci di MariaDB sehingga pencocokan otomatis
    //    case-insensitive ("teknik informatika" == "Teknik Informatika").
    const namaProdiClean = namaProdi.trim().replace(/\s+/g, " ");
    const prodi = await prisma.prodi.findFirst({
      where: { namaProdi: namaProdiClean },
    });

    if (!prodi) {
      throw new Error(
        `Program studi '${namaProdi}' tidak ditemukan. Periksa kembali penulisan nama prodi.`
      );
    }

    const { kodeProdi, kodeFakultas, urutanProdi } = prodi;

    // 2. Kalkulasi tahun angkatan (tahun ajaran baru dimulai bulan Juli)
    const now = new Date();
    const month = now.getMonth() + 1;
    let yearNum = now.getFullYear();
    if (month >= 7) {
      yearNum += 1;
    }
    const angkatan = yearNum.toString().slice(-2);

    // Prefix NIM: 1 + Kode Fakultas + Urutan Prodi + Angkatan
    // (nomor urut 3 digit terakhir ditambahkan saat generate, lihat di bawah)
    const nimPrefix = `1${kodeFakultas}${urutanProdi}${angkatan}`;

    const hashed = await hashPassword(password);

    // 3. Generate & simpan NIM. Diberi retry karena nomor urut dihitung
    //    dengan membaca data lalu menulis (read-then-write) -- kalau dua
    //    request register masuk nyaris bersamaan untuk prodi & angkatan yang
    //    sama, keduanya bisa menghitung urutan yang sama dan NIM bentrok
    //    (unique constraint). Saat itu terjadi, hitung ulang & coba lagi.
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_NIM_RETRY; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          // Hitung urutan HANYA dari mahasiswa dengan prefix NIM yang sama
          // (prodi + angkatan yang sama) -- nomor urut otomatis reset setiap
          // tahun ajaran baru, tidak terus menumpuk dari tahun-tahun sebelumnya.
          const countMhs = await tx.mahasiswa.count({
            where: { nim: { startsWith: nimPrefix } },
          });
          const urutan = (countMhs + 1).toString().padStart(3, "0");
          const nim = `${nimPrefix}${urutan}`;

          const mhs = await tx.mahasiswa.create({
            data: {
              nim,
              nama: namaLengkap,
              tglLahir: new Date(tglLahir),
              jenisKelamin,
              kodeProdi,
              user: {
                create: {
                  username: nim,
                  password: hashed,
                  role: "mahasiswa",
                },
              },
            },
            include: {
              user: {
                select: {
                  idUser: true,
                  username: true,
                  role: true,
                  createdAt: true,
                },
              },
            },
          });

          return mhs.user;
        });
      } catch (err) {
        // P2002 = unique constraint violation -> kemungkinan besar NIM bentrok,
        // coba hitung & generate ulang. Error lain langsung dilempar ke caller.
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    console.error("Gagal generate NIM unik setelah beberapa kali percobaan:", lastError);
    throw new Error("Gagal membuat NIM, silakan coba daftar ulang.");
  },

  async login({ username, password }: LoginInput) {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.isActive) {
      throw new Error("Kredensial tidak ditemukan atau akun Anda tidak aktif");
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      throw new Error("Password yang Anda masukkan salah");
    }

    await prisma.user.update({
      where: { idUser: user.idUser },
      data: { lastLogin: new Date() },
    });

    return {
      idUser: user.idUser,
      username: user.username,
      role: user.role,
      nim: user.nim,
      kodedsn: user.kodedsn,
    };
  },
};