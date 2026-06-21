export type Role = "admin" | "dosen" | "mahasiswa";

export interface JwtPayload {
  idUser: number;
  username: string;
  role: Role;
  nim?: string | null;
  kodedsn?: string | null;
}
