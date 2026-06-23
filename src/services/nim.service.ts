import { prisma } from "../utils/prisma";
import type { Prisma } from "../../generated/prisma/client";

/**
 * Generate NIM mahasiswa baru.
 *
 * Format NIM (8 digit): '1' + kodeProdi (2 digit) + angkatan (2 digit
 * terakhir tahun) + nomorUrut (3 digit, GLOBAL per kodeProdi, tidak
 * reset tiap tahun).
 *
 * Contoh: kodeProdi '41' (Fakultas Teknik='4', prodi ke-1), angkatan
 * 2026, mahasiswa ke-1 di prodi tersebut -> NIM = '14126001'.
 *
 * Angkatan ditentukan dari TANGGAL REGISTER (bukan tahun saat ini secara
 * mentah): daftar bulan Januari-Juni -> angkatan tahun ini; daftar bulan
 * Juli-Desember -> angkatan tahun depan (tahun ajaran baru dimulai
 * pertengahan tahun).
 */
export function hitungAngkatan(tanggalDaftar: Date = new Date()): number {
  const bulan = tanggalDaftar.getMonth() + 1;
  const tahun = tanggalDaftar.getFullYear();
  return bulan >= 7 ? tahun + 1 : tahun;
}
/**
 * Hitung nomor urut berikutnya untuk kodeProdi tertentu, dengan COUNT
 * sederhana (nomor urut = jumlah mahasiswa existing di prodi itu + 1).
 * Dipanggil di DALAM transaksi Prisma (tx) oleh authService.register
 * supaya aman dari race condition saat 2 pendaftaran terjadi bersamaan
 * (lihat retry logic di authService).
 */
export async function hitungNomorUrutBerikutnya(
  tx: Prisma.TransactionClient,
  kodeProdi: string
): Promise<number> {
  const jumlah = await tx.mahasiswa.count({ where: { kodeProdi } });
  return jumlah + 1;
}

export function formatNim(kodeProdi: string, angkatan: number, nomorUrut: number): string {
  const angkatan2digit = angkatan.toString().slice(-2);
  const nomorUrut3digit = nomorUrut.toString().padStart(3, "0");
  return `1${kodeProdi}${angkatan2digit}${nomorUrut3digit}`;
}