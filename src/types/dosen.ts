export interface CreateDosenInput {
  namaDosen: string;
  tglLahir: string;
  kodeProdi: string;
  statusAktif?: boolean;
  foto?: string;
  jenisKelamin: "L" | "P";
  password?: string;
}