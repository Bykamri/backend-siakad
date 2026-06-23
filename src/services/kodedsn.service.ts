import type { Prisma } from "../../generated/prisma/client";

/**
 * Generate kodedsn dosen baru.
 *
 * Format kodedsn (5 digit): kodeProdi (2 digit) + nomorUrut (3 digit, padded).
 * Contoh: kodeProdi '11' (Teknik Informatika), dosen ke-1 -> kodedsn = '11001'.
 *
 * Nomor urut dihitung GLOBAL per kodeProdi (tidak reset).
 * Dipanggil di dalam transaksi Prisma supaya aman dari race condition.
 */
export async function hitungNomorUrutDosenBerikutnya(
  tx: Prisma.TransactionClient,
  kodeProdi: string
): Promise<number> {
  const jumlah = await tx.dosen.count({ where: { kodeProdi } });
  return jumlah + 1;
}

export function formatKodedsn(kodeProdi: string, nomorUrut: number): string {
  return `${kodeProdi}${nomorUrut.toString().padStart(3, "0")}`;
}
