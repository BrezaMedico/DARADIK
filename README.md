# DARADIK - Data Realisasi Anggaran Pendidikan

**DARADIK** adalah platform berbasis web yang membantu orang tua, wali murid, dan masyarakat memahami alokasi serta realisasi dana Bantuan Operasional Satuan Pendidikan (BOSP). Platform ini menggabungkan pencarian sekolah, profil & visualisasi anggaran, penelusuran belanja semantik, Kamus Juknis BOSP, fitur **Pemindai Pesan** berbasis OCR dan AI, asisten interaktif **Tanya BOS**, pelaporan anonim terenkripsi, pelacakan tiket, hingga ekspor dokumen resmi dan kuitansi digital.

> **Tim VIOLET · SMK TI BAZMA**

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| Pencarian & Filter Sekolah | Mencari sekolah berdasarkan nama, NPSN, provinsi, kabupaten/kota, jenjang (SD/SMP/SMA/SMK), dan status (Negeri/Swasta) melalui halaman utama maupun `/search`. |
| Profil & Anggaran BOSP | Menampilkan ringkasan pagu dana BOSP tahun berjalan, pencairan Tahap 1 dan Tahap 2, serta diagram komposisi persentase belanja sekolah. |
| Pencarian Belanja Semantik | Menelusuri bukti realisasi pengeluaran sekolah dengan pencocokan kata kunci, sinonim, koreksi ejaan, kategori terkait, serta detail nota dan bukti fisik. |
| Pemindai Pesan | Tersedia di halaman mandiri `/pemindai` (cari sekolah tujuan teratas lalu unggah gambar lewat seret-lepas, `Ctrl+V`, atau cari berkas) maupun di tab Profil Sekolah untuk mengekstrak teks chat/pengumuman via OCR (`Tesseract.js`) + AI dan mengecek indikasi pungli terhadap aturan BOSP. |
| Kamus Juknis BOSP | Menyediakan referensi resmi ketentuan pembiayaan yang ditanggung dana BOSP dan jenis pungutan yang dilarang sesuai Permendikdasmen No. 8 Tahun 2026 & Permendikbud No. 75 Tahun 2016. |
| Pelaporan Anonim & Lacak Lapor | Mengirim laporan dugaan pungutan tanpa akun atau nomor HP, dilindungi enkripsi `AES-256-GCM`, pembersihan metadata EXIF foto bukti, tantangan CAPTCHA matematika `HMAC-SHA256`, tombol pintas `Lacak Lapor`, serta pelacakan tiket & balasan petugas (`160-bit` secret token). |
| Asisten AI Tanya BOS | Widget chatbot interaktif berbasis teks dan suara (`Gemini API`, fallback basis pengetahuan lokal, pengenalan suara, serta Piper TTS opsional) yang mampu menjawab pertanyaan BOSP dan menavigasikan pengguna ke fitur website. |
| Tur Panduan Interaktif | Panduan penggunaan langkah demi langkah untuk halaman utama dan profil sekolah pada tampilan desktop maupun HP (`MobileBottomNav`). |
| Ekspor PDF, Kuitansi PNG & Bukti Fisik | Mengunduh ringkasan anggaran sekolah dalam format **PDF** (`jsPDF`), **Kuitansi Digital `.png`** resolusi 2x via Canvas 2D, serta **Foto Bukti Fisik `.jpg`** ber-watermark koordinat geotagging. |
| Dashboard Admin Dinas | Portal `/admin` untuk administrator Dinas Pendidikan mengelola antrean aduan, membuka bundel bukti privat secara aman, memperbarui status investigasi, mencatat memo internal, dan membalas pelapor. |

## Tech Stack

| Bagian | Teknologi |
|---|---|
| Frontend | React 18, TypeScript, Vite 6 |
| Styling | Tailwind CSS |
| Backend & API | Node.js, Express 5 (`server/server.js`), Vercel Serverless Adapter (`api/index.js`) |
| Database, Auth & Storage | Supabase (PostgreSQL, Row Level Security, Private Storage), Prisma (`prisma/schema.prisma`) |
| OCR, AI & Suara | Tesseract.js, Google Gemini API (`@google/genai`), Piper TTS (`id_ID-news_tts-medium` opsional) |
| Visual & Ikon | Three.js, Lucide React |
| Ekspor Dokumen & Gambar | jsPDF (PDF), HTML5 Canvas 2D (Kuitansi PNG & Watermark Bukti Fisik JPG) |

## Menjalankan Project

### Persyaratan

- Node.js versi 20 atau lebih baru
- npm
- Git

### Instalasi

```bash
git clone https://github.com/BrezaMedico/DARADIK.git
cd DARADIK
npm install
```

### Konfigurasi Environment

Buat file `.env` berdasarkan template yang tersedia:

```bash
cp .env.example .env
```

Pada Windows PowerShell, gunakan:

```powershell
Copy-Item .env.example .env
```

Isi konfigurasi sesuai layanan yang digunakan. Variabel penting meliputi:

- **Supabase Frontend:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Supabase Server & ORM:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- **AI & Backend:** `GEMINI_API_KEY`, `GEMINI_MODEL` (default runtime `gemini-3.5-flash-lite`), `PORT`, `ALLOWED_ORIGINS`
- **Keamanan Laporan & CAPTCHA:** `REPORT_ENCRYPTION_KEY`, `REPORT_ENCRYPTION_ACTIVE_KEY_ID`, `CAPTCHA_SECRET`
- **TTS Lokal (Opsional):** `PIPER_BINARY_PATH`, `PIPER_MODEL_PATH`

### Menjalankan Mode Development

```bash
npm run dev
```

Buka alamat yang ditampilkan pada terminal (umumnya **http://localhost:5173**). Vite menangani frontend sekaligus endpoint API lokal (`/api/chat`, `/api/tts`, `/api/scan-vision`, `/api/scan-judge`, `/api/reports/*`) melalui middleware project.

### Build, Preview, dan Production Server

```bash
# Membuat build production ke folder dist
npm run build

# Menjalankan preview hasil build Vite
npm run preview

# Menjalankan server Express production (menyajikan API + folder dist)
npm run server
```

Server Express berjalan pada port `3001` secara default atau mengikuti `PORT` pada environment (termasuk saat deploy ke Render melalui `render.yaml`).

### Pengujian Aplikasi

```bash
# 1. Pengujian 15 skenario keamanan P0-P2 (RLS, enkripsi AES-256-GCM, token, CAPTCHA, rate limit) via PGlite
npm run test:security

# 2. Pengujian 103 kasus rule engine Pemindai Pesan
node tests/scanner/runRuleEngine.mjs --all

# 3. Pengujian integrasi end-to-end server Express & emulator PostgreSQL (17 skenario)
node tests/test_full_verification.mjs
```

## Akses Dashboard Admin

Dashboard pengelola dapat dibuka melalui rute `/admin` pada aplikasi (misalnya `http://localhost:5173/admin`, domain deployment Render Anda + `/admin`, atau `https://daradik.vercel.app/admin`).

**Akun demo untuk penjurian:**

| Kredensial | Nilai |
|---|---|
| Username | `admin` |
| Password | `123` |

Akun tersebut harus terdaftar sebagai administrator aktif pada Supabase yang digunakan oleh deployment. Kredensial ini hanya untuk demonstrasi dan harus diganti sebelum penggunaan operasional.

## Struktur Project

```text
DARADIK/
├── api/                                # Adapter serverless API untuk deployment Vercel
├── prisma/                             # Skema database Prisma (schema.prisma)
├── public/                             # Aset statis, banner Lapor desktop/HP, model 3D, dan widget Tanya BOS
├── scripts/                            # Script pendukung & seeding data sekolah Supabase
├── server/                             # Backend Express, konfigurasi Gemini AI, kriptografi & API laporan, serta TTS
├── src/
│   ├── app/                            # Inisialisasi aplikasi, routing URL, dan pengaturan state utama
│   ├── components/                     # Header, navigasi HP, modal kuitansi/geotag, tur panduan, dan UI bersama
│   ├── data/                           # Data referensi sekolah, wilayah, dan kamus aturan BOSP
│   ├── features/                       # Fitur utama (landing, school-search, school-profile, wa-scanner, kamus-bosp, anonymous-report, live-tracking, dinas-dashboard)
│   ├── services/                       # Integrasi klien Supabase dan API layanan backend
│   ├── styles/                         # Token tipografi, desain responsif, dan animasi CSS
│   ├── types/                          # Definisi tipe TypeScript
│   └── utils/                          # Ekspor PDF, Kuitansi PNG Canvas 2D, terbilang, pencarian semantik, dan enkripsi klien
├── supabase/                           # Migrasi hardening keamanan database Supabase
├── tests/                              # Suite pengujian scanner (rule engine), security (PGlite), dan verifikasi end-to-end
├── .env.example                        # Template konfigurasi environment
├── package.json                        # Dependency dan script npm
├── render.yaml                         # Konfigurasi Web Service deployment Render
├── vercel.json                         # Konfigurasi routing & build Vercel
├── supabase_schema.sql                 # Skema database utama Supabase
├── supabase_reports_migration.sql      # Skema migrasi sistem laporan anonim
└── vite.config.ts                      # Konfigurasi Vite dan middleware API lokal
```

## Progress Pengembangan

**Status: Selesai untuk versi prototipe lomba.**

Seluruh fitur utama telah diimplementasikan dan diverifikasi, meliputi landing page, pencarian sekolah, profil & visualisasi anggaran, pencarian belanja semantik, Pemindai Pesan (OCR + AI) baik di halaman `/pemindai` maupun profil sekolah, Kamus Juknis BOSP, chatbot Tanya BOS, pelaporan anonim terenkripsi, pelacakan tiket, tur panduan interaktif desktop/HP, dashboard admin, serta ekspor PDF & kuitansi PNG.

## Catatan Prototipe

- Data sekolah, anggaran, transaksi, dan bukti pendukung pada versi demonstrasi masih menggunakan data simulasi dan belum seluruhnya terverifikasi melalui sistem resmi.
- Hasil OCR dan AI pada **Pemindai Pesan** merupakan **indikasi awal**, bukan bukti hukum final, sehingga tetap memerlukan pemeriksaan petugas.
- Dashboard admin merupakan prototipe pengelolaan laporan dan belum terintegrasi langsung dengan sistem resmi Dinas Pendidikan.
- Versi ini ditujukan untuk demonstrasi dan penilaian lomba, belum untuk menangani laporan nyata atau bukti sensitif secara operasional.

---

**Repository:** https://github.com/BrezaMedico/DARADIK
