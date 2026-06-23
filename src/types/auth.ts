import type { JenisKelamin } from "../../generated/prisma";

export type Role = "admin" | "dosen" | "mahasiswa";

export interface JwtPayload {
  idUser: number;
  username: string;
  role: Role;
  nim?: string | null;
  kodedsn?: string | null;
}

export interface RegisterMahasiswaInput {
  namaLengkap: string;
  tglLahir: string;
  jenisKelamin: JenisKelamin;
  kodeProdi: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}