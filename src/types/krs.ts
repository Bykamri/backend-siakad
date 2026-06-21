export interface AmbilKrsInput {
  nim: string;
  idJamkelas: number;
  tahunAkademik: string; // contoh: "2025/2026"
  semester: "Ganjil" | "Genap";
}

export interface InputNilaiInput {
  idKrs: number;
  nilaiAngka: number;
  nilaiHuruf?: string;
  kodedsnPenilai: string; // dosen yang sedang login & melakukan input nilai
}
