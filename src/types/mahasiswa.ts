export interface CreateMahasiswaInput {
  nim: string;
  nama: string;
  tglLahir: string;
  jenisKelamin: "L" | "P";
  statusMhs?: "aktif" | "lulus";
  ijazah?: string;
  foto?: string;
  kodeProdi: string;
  angkatan: number;
  kodedsnWali?: string;
}
