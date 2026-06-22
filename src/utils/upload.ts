import { mkdir, unlink } from "node:fs/promises";
import { join, normalize } from "node:path";

// Semua file upload (foto dosen, foto mahasiswa, ijazah) disimpan di
// folder uploads/ pada root project, dipisah per kategori. Folder ini
// di-gitignore -- isinya hasil runtime, bukan source code yang dicommit.
export const UPLOAD_ROOT = join(process.cwd(), "uploads");

export const UPLOAD_SUBDIR = {
  fotoDosen: "foto-dosen",
  fotoMahasiswa: "foto-mahasiswa",
  ijazah: "ijazah",
} as const;

export type UploadSubdir = (typeof UPLOAD_SUBDIR)[keyof typeof UPLOAD_SUBDIR];

const IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PDF_MIME_EXT: Record<string, string> = {
  "application/pdf": "pdf",
};

export const FOTO_MIME_TYPES = Object.keys(IMAGE_MIME_EXT);
export const IJAZAH_MIME_TYPES = Object.keys(PDF_MIME_EXT);

const ALL_MIME_EXT: Record<string, string> = { ...IMAGE_MIME_EXT, ...PDF_MIME_EXT };

/**
 * Pastikan UPLOAD_ROOT dan semua subdir (foto-dosen, foto-mahasiswa,
 * ijazah) sudah ada di disk. Dipanggil SEKALI saat server start
 * (src/index.ts), supaya folder sudah siap sebelum request upload
 * pertama datang -- tidak menunggu lazy-create di saveUploadedFile.
 *
 * CATATAN PENTING (serverless/Vercel):
 * Filesystem di Vercel serverless bersifat READ-ONLY (kecuali /tmp)
 * dan EPHEMERAL (hilang tiap cold start). Fungsi ini sengaja TIDAK
 * melempar error jika mkdir gagal -- hanya mencatat warning -- supaya
 * tidak mematikan boot server saat dijalankan di lingkungan seperti
 * itu. Untuk deployment Vercel, upload SEHARUSNYA sudah dialihkan ke
 * Vercel Blob (@vercel/blob), bukan disk lokal.
 */
export async function ensureUploadDirs(): Promise<void> {
  const dirs = [UPLOAD_ROOT, ...Object.values(UPLOAD_SUBDIR).map((sub) => join(UPLOAD_ROOT, sub))];

  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true });
    } catch (err) {
      console.warn(
        `⚠️  Gagal membuat folder upload "${dir}" (filesystem mungkin read-only, ` +
          `misal di lingkungan serverless). Upload lokal tidak akan berfungsi ` +
          `sampai ini diperbaiki atau dialihkan ke storage eksternal seperti Vercel Blob.`,
        err
      );
    }
  }
}

/**
 * Simpan file upload (Web API File dari body Elysia, lewat t.File()) ke
 * disk, di dalam uploads/<subdir>/. Nama file dibuat dari id (nim /
 * kodedsn) + timestamp supaya unik, sekaligus gampang dikenali asal
 * pemiliknya saat debugging.
 *
 * Return: path RELATIF (terhadap UPLOAD_ROOT) yang disimpan ke kolom
 * foto/ijazah di DB, contoh: "foto-mahasiswa/14126001_1771234567890.jpg".
 */
export async function saveUploadedFile(
  file: File,
  subdir: UploadSubdir,
  idForFilename: string
): Promise<string> {
  const ext = ALL_MIME_EXT[file.type];
  if (!ext) {
    throw new Error(`Tipe file '${file.type}' tidak didukung`);
  }

  const dir = join(UPLOAD_ROOT, subdir);
  // Tetap dipanggil di sini juga (idempotent) sebagai jaga-jaga jika
  // ensureUploadDirs() belum/gagal dijalankan saat startup, atau folder
  // sempat terhapus manual selagi server berjalan.
  await mkdir(dir, { recursive: true });

  const safeId = idForFilename.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${safeId}_${Date.now()}.${ext}`;
  const fullPath = join(dir, filename);

  await Bun.write(fullPath, file);

  return `${subdir}/${filename}`;
}

/**
 * Hapus file lama (jika ada) saat foto/ijazah diganti dengan yang baru,
 * supaya tidak menumpuk file yatim di disk. Dipanggil dari service layer
 * SEBELUM kolom DB di-update ke path yang baru.
 */
export async function deleteUploadedFileIfExists(relativePath: string | null | undefined) {
  if (!relativePath) return;
  try {
    await unlink(join(UPLOAD_ROOT, relativePath));
  } catch {
    // File mungkin sudah tidak ada di disk -- abaikan, bukan kegagalan
    // yang perlu menggagalkan request upload yang baru.
  }
}

/**
 * Resolve path relatif (dari URL/DB) menjadi path absolut di dalam
 * UPLOAD_ROOT, dengan proteksi path traversal (../). Dipakai route
 * static file serving di src/index.ts. Return null jika path mencoba
 * keluar dari UPLOAD_ROOT.
 */
export function resolveUploadPath(relativePath: string): string | null {
  const fullPath = normalize(join(UPLOAD_ROOT, relativePath));
  if (!fullPath.startsWith(UPLOAD_ROOT)) return null;
  return fullPath;
}