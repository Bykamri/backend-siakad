export interface CreateDosenInput {
  kodedsn: string;
  namaDosen: string;
  tglLahir: string;
  kodeProdi: string;
  statusAktif?: boolean;
  foto?: string;
  jenisKelamin: "L" | "P";
}