# dbakademik API

Backend REST API untuk sistem akademik (matakuliah, dosen, mahasiswa, KRS)
dibangun dengan **Bun + ElysiaJS + Prisma 7** (MySQL/MariaDB).

## Stack

- **Bun** — runtime & package manager
- **ElysiaJS** — web framework
- **Prisma 7** (rust-free, `engineType = "client"`) — ORM, dengan driver
  adapter `@prisma/adapter-mariadb` (pure JS, tidak butuh native binary)
- **JWT** (`@elysiajs/jwt`) — autentikasi
- **bcryptjs** — hashing password
- **Swagger** (`@elysiajs/swagger`) — dokumentasi API otomatis di `/docs`

## Struktur folder

```
prisma/
  schema.prisma          # skema database (mirror dari dbakademik_schema.sql)
src/
  index.ts               # entry point
  middleware/auth.ts      # JWT guard + role guard
  routes/                 # route per resource
  services/               # business logic per resource
  types/auth.ts           # tipe JWT payload
  utils/
    prisma.ts             # singleton Prisma Client (driver adapter mariadb)
    password.ts           # hash & verify password
prisma.config.ts          # konfigurasi Prisma 7
.env.example               # contoh environment variable
```

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Siapkan database

Jalankan dulu `dbakademik_schema.sql` (file yang sudah dibuat sebelumnya) di
MySQL/MariaDB Anda:

```bash
mysql -u root -p < dbakademik_schema.sql
```

Buat juga user database (jangan pakai root untuk aplikasi):

```sql
CREATE USER 'dbakademik_user'@'localhost' IDENTIFIED BY 'password_kuat_anda';
GRANT ALL PRIVILEGES ON dbakademik.* TO 'dbakademik_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Konfigurasi environment

```bash
cp .env.example .env
```

Edit `.env` sesuai kredensial database Anda:

```env
DATABASE_URL="mysql://dbakademik_user:password_kuat_anda@localhost:3306/dbakademik"
DB_HOST=localhost
DB_PORT=3306
DB_USER=dbakademik_user
DB_PASSWORD=password_kuat_anda
DB_NAME=dbakademik
JWT_SECRET="ganti_dengan_secret_acak_yang_panjang"
PORT=3000
```

### 4. Generate Prisma Client

> ⚠️ **PENTING**: langkah ini WAJIB dijalankan di komputer/server Anda yang
> punya akses internet normal ke `binaries.prisma.sh`. Proses ini hanya
> butuh dilakukan sekali (atau setiap kali `schema.prisma` diubah).

```bash
bun run prisma:generate
```

Ini akan membuat folder `generated/prisma/` yang dipakai oleh
`src/utils/prisma.ts`.

### 5. Jalankan server

```bash
bun run dev      # mode watch, auto-restart saat file berubah
# atau
bun run start    # mode production
```

Server jalan di `http://localhost:3000`, dokumentasi Swagger di
`http://localhost:3000/docs`.

> Setiap endpoint di Swagger diawali label role pada bagian summary, contoh
> `[Admin]`, `[Dosen]`, `[Admin, Dosen, Mahasiswa]`, atau `[Publik]` —
> menunjukkan role mana yang boleh mengakses endpoint tersebut. Jika lebih
> dari satu role tercantum, baca bagian description di bawah summary untuk
> melihat perbedaan data/akses antar role pada endpoint yang sama.

## Alur autentikasi & role

Ada 3 role: `admin`, `dosen`, `mahasiswa`.

- **Mahasiswa** mendaftar sendiri lewat `POST /auth/register` (selalu jadi
  role mahasiswa; NIM, angkatan, dan username di-generate otomatis).
- **Admin** dan **Dosen** dibuatkan akunnya oleh admin lewat
  `POST /auth/register-staff`.
- Semua role login lewat endpoint yang sama: `POST /auth/login`.

| Resource | admin | dosen | mahasiswa |
|---|---|---|---|
| Lihat semua dosen | ✅ | ❌ (hanya diri sendiri) | ❌ (hanya dosen wali + dosen pengampu matakuliah yang diambil) |
| Lihat semua mahasiswa | ✅ | ❌ (hanya mahasiswa wali / yang diampu, lewat 2 endpoint terpisah) | ❌ (hanya diri sendiri) |
| Tambah/edit/hapus dosen, mahasiswa, matakuliah, jam kelas | ✅ | ❌ | ❌ |
| Ambil matakuliah (KRS) | ✅ (atas nama mhs) | ❌ | ✅ (diri sendiri) |
| Input nilai | ❌ | ✅ (hanya kelas yang ia ampu) | ❌ |

### Detail endpoint dosen & mahasiswa per role

**Dosen melihat mahasiswa** — 2 daftar terpisah (tidak digabung):
- `GET /mahasiswa/wali` — mahasiswa yang ia jadi dosen wali. Lewat
  `GET /mahasiswa/:nim` untuk salah satu dari mereka, dosen wali boleh
  lihat **seluruh nilai matakuliah** mahasiswa tersebut.
- `GET /mahasiswa/diampu` — mahasiswa yang mengambil jam_kelas yang ia
  ampu (untuk keperluan penilaian).

**Mahasiswa melihat dosen** — dibatasi pada:
- Dosen wali-nya sendiri.
- Dosen yang mengampu jam_kelas dari matakuliah yang sedang/pernah
  diambil (lewat KRS).
- `GET /dosen/:kodedsn` untuk dosen di luar 2 kategori itu akan ditolak
  (403), dan responsnya hanya berisi `kodedsn` + `namaDosen` (bukan
  detail lengkap seperti prodi/status aktif/daftar mahasiswa wali).

**Dosen wali vs dosen pengampu (bukan wali)**: dosen yang BUKAN dosen
wali seorang mahasiswa tidak bisa mengakses `GET /mahasiswa/:nim` mahasiswa
itu sekalipun mahasiswa itu ada di kelas yang ia ampu — untuk kebutuhan
penilaian, dosen pengampu menggunakan `GET /mahasiswa/diampu` yang
menampilkan data secukupnya untuk proses penilaian.

## Logika kunci: generate NIM otomatis saat registrasi

Saat mahasiswa mendaftar mandiri (`POST /auth/register`), sistem **tidak**
meminta NIM secara manual. NIM (8 digit) dibentuk otomatis:

```
NIM = '1' + kodeProdi (2 digit) + angkatan (2 digit terakhir) + nomorUrut (3 digit)
```

- `kodeProdi`: 2 digit = 1 digit kode fakultas + 1 digit urutan prodi
  dalam fakultas itu (contoh: Fakultas Teknik = `4`, Teknik Informatika
  prodi ke-1 di fakultas itu → kodeProdi = `41`).
- `angkatan`: ditentukan dari **tanggal registrasi** — daftar bulan
  Januari–Juni → angkatan tahun ini; daftar bulan Juli–Desember →
  angkatan tahun depan.
- `nomorUrut`: urut global per `kodeProdi`, **tidak reset** setiap tahun.

Contoh: mendaftar Maret 2026 di prodi `41`, mahasiswa pertama di prodi
itu → NIM = `14126001`.

`username` akun login mahasiswa otomatis = NIM tersebut (mahasiswa hanya
mengisi password saat register). Kolom `kodedsnWali` dikosongkan (`NULL`)
saat register — admin yang akan assign dosen wali secara manual lewat
`PATCH /mahasiswa/:nim`.

> **Catatan**: karena `kodedsnWali` nullable, jika seorang dosen wali
> dihapus dari sistem (`DELETE /dosen/:kodedsn`), mahasiswa yang
> diwalikannya **tidak ikut gagal terhapus** — kolom `kodedsnWali`
> mahasiswa tersebut otomatis menjadi `NULL` (`ON DELETE SET NULL`),
> dan admin perlu assign dosen wali baru. Ini berbeda dari relasi
> `jam_kelas -> dosen` yang tetap `RESTRICT` (dosen pengampu tidak bisa
> dihapus selama masih mengampu kelas, demi menjaga riwayat akademik).

## Logika kunci: dosen penilai otomatis

Tabel `krs` **tidak menyimpan kolom dosen penilai secara langsung**. Saat
mahasiswa mengambil matakuliah (`POST /krs/ambil`), mereka memilih
`idJamkelas` tertentu (kelas A/B/C). Dosen penilai didapat lewat relasi:

```
krs -> jam_kelas -> dosen
```

Saat dosen input nilai (`PATCH /krs/:idKrs/nilai`), service akan mengecek
apakah `kodedsn` dosen yang login sama dengan `kodedsn` di `jam_kelas` milik
KRS tersebut. Jika tidak cocok, request ditolak (403) — ini menegakkan
aturan "yang menilai hanya 1 dosen yang mengampu di jam yang sama".

## Contoh pemakaian endpoint utama

```bash
# Lihat daftar prodi (publik, untuk pilihan di form register)
curl http://localhost:3000/prodi

# Registrasi mandiri mahasiswa (role otomatis: mahasiswa, NIM auto-generate)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"namaLengkap":"Andi Pratama","tglLahir":"2003-05-10","jenisKelamin":"L","kodeProdi":"41","password":"rahasia123"}'

# Login (username mahasiswa = NIM hasil generate di atas)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"14126001","password":"rahasia123"}'

# Ambil matakuliah (pakai token dari login)
curl -X POST http://localhost:3000/krs/ambil \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"nim":"14126001","idJamkelas":1,"tahunAkademik":"2025/2026","semester":"Ganjil"}'

# Dosen input nilai
curl -X PATCH http://localhost:3000/krs/1/nilai \
  -H "Authorization: Bearer <TOKEN_DOSEN>" \
  -H "Content-Type: application/json" \
  -d '{"nilaiAngka":88.5,"nilaiHuruf":"A"}'

# Dosen lihat daftar mahasiswa wali-nya
curl http://localhost:3000/mahasiswa/wali -H "Authorization: Bearer <TOKEN_DOSEN>"

# Dosen lihat daftar mahasiswa yang ia ampu (untuk dinilai)
curl http://localhost:3000/mahasiswa/diampu -H "Authorization: Bearer <TOKEN_DOSEN>"
```

## Catatan validasi

Semua route, service, dan logika bisnis dalam project ini sudah diuji
end-to-end terhadap database MariaDB yang real (bukan hanya ditulis manual
tanpa dicoba), termasuk:

- Generate NIM otomatis (format `1` + kodeProdi + angkatan + nomor urut),
  nomor urut increment global per prodi, dan logika angkatan berdasarkan
  bulan registrasi (Jan-Jun vs Jul-Des).
- Dosen wali kosong (`NULL`) saat self-register, lalu admin assign manual.
- Dosen hanya melihat mahasiswa lewat 2 daftar terpisah (`/mahasiswa/wali`
  dan `/mahasiswa/diampu`) — mahasiswa yang belum di-assign wali tidak
  muncul di daftar wali siapa pun.
- Mahasiswa hanya melihat dosen yang relevan (wali atau pengampu MK yang
  diambil); dosen di luar itu ditolak (403).
- Dosen penilai otomatis sesuai jam_kelas, dan penolakan dosen yang bukan
  pengampu saat input nilai (berbeda dari status dosen wali).
- Trigger DB: maksimal 3 jam_kelas per matakuliah, dan konsistensi role
  pada tabel `users`.
- FK `ON DELETE SET NULL` untuk dosen wali vs `ON DELETE RESTRICT` untuk
  dosen pengampu jam_kelas (lihat catatan di bagian generate NIM di atas).
