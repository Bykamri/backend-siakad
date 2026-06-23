import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join, normalize } from "node:path";
import { put, del } from "@vercel/blob";

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
 * (src/index.ts). Di Vercel (filesystem read-only), pemanggilan ini
 * menghasilkan warning tapi tidak crash -- upload sudah dialihkan ke
 * Vercel Blob melalui process.env.VERCEL.
 */
export async function ensureUploadDirs(): Promise<void> {
  if (process.env.VERCEL) return;

  const dirs = [UPLOAD_ROOT, ...Object.values(UPLOAD_SUBDIR).map((sub) => join(UPLOAD_ROOT, sub))];

  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true });
    } catch (err) {
      console.warn(`⚠️  Gagal membuat folder upload "${dir}":`, err);
    }
  }
}

/**
 * Simpan file upload ke Vercel Blob (production) atau disk lokal (dev).
 *
 * Production (VERCEL env set): menyimpan ke Vercel Blob dan mengembalikan
 * URL CDN penuh, contoh: "https://xxx.vercel-storage.com/foto-dosen/abc_123.jpg".
 *
 * Development: menyimpan ke uploads/<subdir>/ dan mengembalikan path
 * relatif, contoh: "foto-dosen/abc_1234567890.jpg".
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

  const safeId = idForFilename.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${safeId}_${Date.now()}.${ext}`;
  const blobPath = `${subdir}/${filename}`;

  if (process.env.VERCEL) {
    const blob = await put(blobPath, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  // Local filesystem fallback
  const dir = join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), buffer);
  return blobPath;
}

/**
 * Hapus file lama saat foto/ijazah diganti dengan yang baru.
 * Mendukung dua format path yang disimpan di DB:
 *   - URL penuh (https://...) → hapus dari Vercel Blob
 *   - Path relatif (foto-dosen/...) → hapus dari disk lokal
 */
export async function deleteUploadedFileIfExists(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return;
  try {
    if (pathOrUrl.startsWith("http")) {
      await del(pathOrUrl);
    } else {
      await unlink(join(UPLOAD_ROOT, pathOrUrl));
    }
  } catch {
    // File mungkin sudah tidak ada -- abaikan
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
