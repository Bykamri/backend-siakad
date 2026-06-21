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

## Alur autentikasi & role

Ada 3 role: `admin`, `dosen`, `mahasiswa`. Setiap role login lewat endpoint
yang sama (`POST /auth/login`), tapi hak aksesnya berbeda:

| Resource | admin | dosen | mahasiswa |
|---|---|---|---|
| Lihat semua dosen/matakuliah | ✅ | ✅ | ✅ |
| Lihat semua mahasiswa | ✅ | ✅ | ❌ (hanya diri sendiri) |
| Tambah/edit/hapus dosen, mahasiswa, matakuliah, jam kelas | ✅ | ❌ | ❌ |
| Ambil matakuliah (KRS) | ✅ (atas nama mhs) | ❌ | ✅ (diri sendiri) |
| Input nilai | ❌ | ✅ (hanya kelas yang ia ampu) | ❌ |

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
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"andi.pratama","password":"rahasia123"}'

# Ambil matakuliah (pakai token dari login)
curl -X POST http://localhost:3000/krs/ambil \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"nim":"21041001","idJamkelas":1,"tahunAkademik":"2025/2026","semester":"Ganjil"}'

# Dosen input nilai
curl -X PATCH http://localhost:3000/krs/1/nilai \
  -H "Authorization: Bearer <TOKEN_DOSEN>" \
  -H "Content-Type: application/json" \
  -d '{"nilaiAngka":88.5,"nilaiHuruf":"A"}'
```

## Catatan validasi

Semua route, service, dan logika bisnis dalam project ini sudah diuji
end-to-end terhadap database MariaDB yang real (bukan hanya ditulis manual
tanpa dicoba) — termasuk validasi: dosen penilai otomatis sesuai jam_kelas,
penolakan dosen yang bukan pengampu saat input nilai, dan trigger DB untuk
konsistensi role pada tabel `users`.
