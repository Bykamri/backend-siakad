import { prisma } from "../utils/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { hitungAngkatan, hitungNomorUrutBerikutnya, formatNim } from "./nim.service";
import { Prisma } from "../../generated/prisma/client";
import type { JenisKelamin } from "../../generated/prisma/client";
import type { RegisterMahasiswaInput, LoginInput } from "../types/auth";


// Batas percobaan ulang jika nomor urut NIM bentrok (race condition saat
// dua pendaftaran terjadi nyaris bersamaan untuk prodi yang sama)
const MAX_NIM_RETRY = 5;

export const authService = {
  // Registrasi mandiri -- SELALU role mahasiswa.
  // NIM & angkatan di-generate otomatis, username = NIM, dosen wali
  // dikosongkan dulu (NULL) sampai di-assign admin secara manual.
  async registerMahasiswa(input: RegisterMahasiswaInput) {
    const { namaLengkap, tglLahir, jenisKelamin, kodeProdi, password } = input;

    const prodi = await prisma.prodi.findUnique({ where: { kodeProdi } });
    if (!prodi) {
      throw new Error(`Program studi dengan kode ${kodeProdi} tidak ditemukan`);
    }

    const angkatan = hitungAngkatan(new Date());
    const hashed = await hashPassword(password);

    // Generate & simpan NIM dalam transaksi, dengan retry jika terjadi
    // race condition (dua pendaftaran nyaris bersamaan di prodi yang sama
    // bisa menghitung nomor urut yang sama -> unique constraint NIM bentrok).
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_NIM_RETRY; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const nomorUrut = await hitungNomorUrutBerikutnya(tx, kodeProdi);
          const nim = formatNim(kodeProdi, angkatan, nomorUrut);

          const mhs = await tx.mahasiswa.create({
            data: {
              nim,
              nama: namaLengkap,
              tglLahir: new Date(tglLahir),
              jenisKelamin,
              kodeProdi,
              angkatan,
              kodedsnWali: null,
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
      } catch (err: unknown) {
        // P2002 = unique constraint violation -> kemungkinan besar NIM bentrok,
        // coba hitung & generate ulang. Error lain langsung dilempar ke caller.
        const isUniqueConflict =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

        if (isUniqueConflict) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    console.error("Gagal generate NIM unik setelah beberapa kali percobaan:", lastError);
    throw new Error("Gagal membuat NIM, silakan coba daftar ulang.");
  },

  // Dipakai admin untuk membuat akun ADMIN atau DOSEN (bukan mahasiswa,
  // karena mahasiswa selalu lewat self-register di atas).
  async registerStaff(input: {
    username: string;
    password: string;
    role: "admin" | "dosen";
    kodedsn?: string;
  }) {
    const { username, password, role, kodedsn } = input;

    if (role === "dosen" && !kodedsn) {
      throw new Error("Role dosen wajib menyertakan kodedsn");
    }
    if (role === "dosen" && kodedsn) {
      const dsn = await prisma.dosen.findUnique({ where: { kodedsn } });
      if (!dsn) throw new Error(`Dosen dengan kode ${kodedsn} tidak ditemukan`);
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) throw new Error("Username sudah digunakan");

    const hashed = await hashPassword(password);

    return prisma.user.create({
      data: {
        username,
        password: hashed,
        role,
        kodedsn: role === "dosen" ? kodedsn : null,
      },
      select: {
        idUser: true,
        username: true,
        role: true,
        nim: true,
        kodedsn: true,
        createdAt: true,
      },
    });
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
