import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "temuan");

const ALLOWED_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 8 * 1024 * 1024; // 8MB, sudah dikompresi di sisi klien sebelumnya

/**
 * Menyimpan foto dari data URL (base64) ke public/uploads/temuan
 * dan mengembalikan path relatif publik (mis. /uploads/temuan/xxxx.jpg)
 * @param {string} dataUrl "data:image/jpeg;base64,...."
 */
export async function simpanFotoBase64(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;

  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) throw new Error("Format foto tidak valid");

  const mime = match[1].toLowerCase();
  const ext = ALLOWED_MIME[mime];
  if (!ext) throw new Error("Tipe foto tidak didukung (gunakan JPG/PNG/WEBP)");

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) throw new Error("Ukuran foto terlalu besar (maks 8MB)");
  if (buffer.length === 0) throw new Error("File foto kosong");

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  await fs.writeFile(filePath, buffer);

  return `/uploads/temuan/${fileName}`;
}

/**
 * Menghapus file foto lama saat temuan diganti fotonya / dihapus.
 * @param {string} fotoUrl "/uploads/temuan/xxxx.jpg"
 */
export async function hapusFoto(fotoUrl) {
  if (!fotoUrl || !fotoUrl.startsWith("/uploads/temuan/")) return;
  try {
    const filePath = path.join(process.cwd(), "public", fotoUrl);
    await fs.unlink(filePath);
  } catch {
    // abaikan jika file sudah tidak ada
  }
}
