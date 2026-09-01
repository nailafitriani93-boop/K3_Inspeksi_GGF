# Inspeksi K3 - Great Giant Foods

Aplikasi Next.js untuk form inspeksi K3, master data PostgreSQL, monitoring OPEN/CLOSE dengan
deadline SLA 7 hari, dashboard analitik per wilayah, upload foto bukti temuan, dan export
Excel/PDF. Mobile/desktop responsive.

## Kebutuhan
- Node.js 20+
- PostgreSQL 18
- Database: `db_master_data_k3`
- User PostgreSQL yang memiliki akses SELECT/INSERT/UPDATE pada tabel aplikasi.

## Konfigurasi
1. Salin `.env.example` menjadi `.env.local`.
2. Isi `DATABASE_URL`.
3. Jalankan migrasi kolom baru (lihat bagian **Perubahan skema database** di bawah).
4. Jalankan:
```bash
npm install
npx prisma db pull
npx prisma generate
npm run dev
```
5. Buka `http://localhost:3000`.

## Catatan database
Project ini menggunakan Prisma dengan raw SQL (`$queryRaw` / `$queryRawUnsafe`), mengikuti
skema PostgreSQL yang sudah dibuat — bukan membuat database baru via migrasi Prisma.

API master mengasumsikan tabel berikut:
- `master_aktivitas`: `id_aktivitas`, `kode_aktivitas`, `nama_aktivitas`, `aktif`
- `master_grup_temuan`: `id_grup`, `kode_grup`, `nama_grup`, `aktif`
- `master_wilayah`: `id_wilayah`, `nama_wilayah` (boleh berisi variasi penulisan, lihat bawah)
- `master_lokasi`: `id_lokasi`, `nama_lokasi`, `wilayah_id` (FK ke `master_wilayah.id_wilayah`)
- `master_mandor`: `id_mandor`, `nama_mandor`
- `master_pic`: `id_pic`, `nama_pic`, `wilayah_id` (FK ke `master_wilayah.id_wilayah`)
- `temuan_k3`

Jika nama kolom di database Anda berbeda, sesuaikan query pada `app/api/**/route.js`.

## Fix penting: Wilayah 1-7 unik + cascading Lokasi & PIC

**Masalah sebelumnya:** dropdown Wilayah di form menampilkan "Wilayah 1" berulang-ulang
(tidak unik), dan filter Lokasi/PIC tidak selalu ikut wilayah yang dipilih. Penyebabnya:
kode lama mencocokkan `nama_wilayah` sebagai STRING literal, padahal data di
`master_wilayah` sering berisi variasi penulisan ("Wilayah 1", "wilayah01", "WIL - 1", dst)
dan baris duplikat dengan `id_wilayah` berbeda untuk "wilayah" yang sama.

**Perbaikan:** semua endpoint (`/api/master/wilayah`, `/api/master/lokasi`,
`/api/master/pic`, `/api/temuan`) sekarang mengekstrak **angka 1-7** dari `nama_wilayah`
memakai `regexp_replace(nama_wilayah, '[^0-9]', '', 'g')`, lalu memakai angka itu sebagai
kunci unik (`no_wilayah`). Hasilnya:
- Dropdown Wilayah selalu menampilkan maksimal 7 opsi unik: "Wilayah 1" s/d "Wilayah 7".
- Memilih Wilayah otomatis memuat ulang Lokasi & PIC yang benar-benar sesuai wilayah itu
  (query `/api/master/lokasi?noWilayah=N` dan `/api/master/pic?noWilayah=N`).
- Simpan temuan menyimpan `no_wilayah` (1-7) langsung ke `temuan_k3`, sehingga tidak lagi
  bergantung pada `id_wilayah` yang bisa duplikat/ambigu.

## Perubahan skema database (wajib dijalankan)

```sql
-- Kolom status OPEN/CLOSE (jika belum ada dari versi sebelumnya)
ALTER TABLE public.temuan_k3
ADD COLUMN IF NOT EXISTS status_temuan VARCHAR(10) NOT NULL DEFAULT 'OPEN',
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS closed_by VARCHAR(150) NULL;

ALTER TABLE public.temuan_k3
DROP CONSTRAINT IF EXISTS temuan_k3_status_check;
ALTER TABLE public.temuan_k3
ADD CONSTRAINT temuan_k3_status_check CHECK (status_temuan IN ('OPEN','CLOSE'));

-- Kolom baru: nomor wilayah (1-7) + foto bukti temuan/penutupan
ALTER TABLE public.temuan_k3
ADD COLUMN IF NOT EXISTS no_wilayah SMALLINT NULL,
ADD COLUMN IF NOT EXISTS foto_url VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS foto_close_url VARCHAR(255) NULL;

ALTER TABLE public.temuan_k3
DROP CONSTRAINT IF EXISTS temuan_k3_no_wilayah_check;
ALTER TABLE public.temuan_k3
ADD CONSTRAINT temuan_k3_no_wilayah_check CHECK (no_wilayah BETWEEN 1 AND 7);

-- (Opsional tapi disarankan) backfill no_wilayah dari id_wilayah lama
UPDATE public.temuan_k3 t
SET no_wilayah = NULLIF(regexp_replace(mw.nama_wilayah, '[^0-9]', '', 'g'), '')::int
FROM public.master_wilayah mw
WHERE mw.id_wilayah = t.id_wilayah AND t.no_wilayah IS NULL;
```

Jika constraint/kolom tersebut sudah ada, tidak perlu dijalankan lagi (semua pakai
`IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS` supaya aman dijalankan ulang).

## Upload foto
Foto dikompres di browser (maks lebar 1280px, JPEG) lalu dikirim sebagai base64 ke
`POST /api/temuan`. Server menyimpan file ke `public/uploads/temuan/` dan menyimpan path
relatifnya ke kolom `foto_url`. Folder ini butuh disk yang persisten (cocok untuk deploy
di VPS/VM dengan `npm run start`; **tidak** cocok untuk platform serverless read-only
seperti Vercel — pindahkan ke object storage seperti S3/MinIO bila deploy ke sana).

## Deadline / SLA close 7 hari
`lib/deadline.js` menghitung deadline = `tanggal_temuan + 7 hari` secara otomatis (tidak
perlu kolom tambahan di database). Setiap response API temuan menyertakan field:
- `deadline` — tanggal batas tindak lanjut
- `sisaHari` — sisa hari (negatif jika sudah lewat)
- `overdue` — `true` jika status masih OPEN dan sudah melewati deadline
- `urgensi` — `aman` | `mendesak` (≤2 hari) | `overdue` | `selesai`

## Fitur
- Form inspeksi K3 dengan dropdown Wilayah 1-7 (unik) + Lokasi & PIC otomatis mengikuti
  wilayah yang dipilih
- Upload foto bukti temuan (wajib), dikompres otomatis di browser
- Searchable dropdown master data
- Dashboard: Total/Open/Close/Close Rate, jumlah terlambat (>7 hari)
- Pie chart OPEN vs CLOSE, grafik per bulan, grafik per wilayah (1-7), grafik per grup temuan
- Daftar temuan OPEN dengan badge status deadline (aman/mendesak/terlambat)
- Filter Data Temuan berdasarkan status, wilayah, dan rentang tanggal
- Update status temuan OPEN -> CLOSE
- Export data temuan ke **Excel (.xlsx)** dan **PDF** (dengan filter status/wilayah/tanggal)
- Export ringkasan Dashboard ke **Excel** (multi-sheet: Ringkasan, Per Wilayah, Per Grup,
  Temuan OPEN) dan **PDF**
- Mobile/desktop responsive

## Endpoint API baru/berubah
- `GET /api/master/wilayah` — 7 wilayah unik `{ no_wilayah, nama_wilayah, id_wilayah }`
- `GET /api/master/lokasi?noWilayah=1..7`
- `GET /api/master/pic?noWilayah=1..7`
- `POST /api/temuan` — field `no_wilayah` (bukan lagi `id_wilayah` dari klien) + `foto_base64`
- `GET /api/temuan?status=&noWilayah=&from=&to=` — sertakan `deadline/sisaHari/overdue`
- `GET /api/dashboard/by-wilayah` — rekap open/close per wilayah
- `GET /api/dashboard/oldest-open?limit=` — sertakan info deadline, diurutkan paling mendesak
- `GET /api/export?from=&to=&status=&noWilayah=&format=xlsx|pdf`
- `GET /api/dashboard/export?from=&to=&format=xlsx|pdf`


## Perbaikan versi ini

- Wilayah 1-7 ditampilkan unik dan menjadi filter utama untuk Lokasi/PIC.
- Setelah wilayah dipilih, **semua lokasi** yang terhubung ke seluruh record `master_wilayah`
  dengan nomor wilayah tersebut akan dimuat; lokasi/PIC lama langsung dikosongkan agar tidak
  salah wilayah.
- Server memvalidasi kembali bahwa `id_lokasi` dan `id_pic` benar-benar cocok dengan wilayah
  yang dipilih sebelum data disimpan.
- Koordinat GPS dicoba otomatis ketika form dibuka, dengan tombol GPS manual sebagai fallback.
- Latitude + longitude otomatis dibuat menjadi link Google Maps pada form, Data Temuan,
  Dashboard, Excel, dan PDF.
- Draft form (kecuali foto) disimpan sementara di browser agar refresh tidak menghapus isian
  yang belum disimpan. Setelah berhasil tersimpan, draft dibersihkan.
- Dashboard memakai periode yang sama untuk kartu, grafik bulanan, per wilayah, grup, dan
  daftar OPEN sehingga tidak terjadi angka yang berbeda antar bagian.
- Export mendukung **1 Hari**, **Jangka Waktu**, dan **Bulanan**, plus Semua Data untuk
  dashboard. Export hanya membaca/filter data; tidak menghapus atau mengubah data PostgreSQL.
- Export Excel menambahkan kolom Google Maps dan koordinat. Export PDF juga membawa informasi
  lokasi/koordinat.
- Ditambahkan `database/fix_k3.sql` untuk menambah kolom yang diperlukan, backfill wilayah,
  constraint status, dan index performa tanpa menghapus data.
