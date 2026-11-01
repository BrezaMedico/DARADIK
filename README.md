# DARADIK — Data Transparansi Dana Pendidikan

> **DARADIK** adalah platform keterbukaan dana pendidikan yang menyajikan rincian alokasi BOSP Tahap 1 dan 2 dalam format visual yang mudah dipahami orang tua murid tanpa istilah akuntansi yang rumit. Dilengkapi deteksi cerdas berbasis AI untuk mencocokkan pengumuman iuran di grup WhatsApp kelas dengan anggaran resmi, platform ini menyediakan jalur pelaporan 100% anonim dan aman dari risiko diskriminasi sekolah.

---

## Tech Stack

Proyek ini dibangun menggunakan arsitektur modern berbasis TypeScript dan komponen reaktif di sisi klien:

- **Frontend Core**: [React 18](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/) — Fondasi aplikasi berbasis komponen dengan keamanan tipe data yang ketat.
- **Build Tool**: [Vite](https://vitejs.dev/) — Bundler cepat untuk proses development dan kompilasi produksi yang efisien.
- **Styling & Desain**: [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling dengan tema warna civic khusus (*Plus Jakarta Sans* untuk teks isi dan *Space Grotesk* untuk struktur heading).
- **Ikonografi**: [Lucide React](https://lucide.dev/) — Set ikon vektor yang konsisten di seluruh antarmuka.
- **Grafis 3D Interaktif**: [Three.js](https://threejs.org/) — Merender mockup 3D ponsel cerdas di seksi hero landing page dengan rotasi entrance dan efek parallax sentuh/mouse.
- **Optical Character Recognition (OCR)**: [Tesseract.js](https://github.com/naptha/tesseract.js/) — Menjalankan pembacaan teks otomatis langsung di browser untuk menganalisis screenshot obrolan grup WhatsApp sekolah.
- **Generator Dokumen**: [jsPDF](https://github.com/parallax/jsPDF) — Mencetak berkas laporan resmi ringkasan BOSP langsung ke format PDF ukuran A4 yang rapi dan terukur.
- **Backend & Integrasi Data**: [Supabase](https://supabase.com/) — Sinkronisasi data sekolah dan arsip laporan publik, dengan fallback otomatis ke database lokal jika koneksi offline.

---

## Cara Menjalankan Project

Ikuti langkah-langkah berikut untuk menjalankan DARADIK di komputer lokal:

### 1. Prasyarat Sistem
Pastikan komputer kamu sudah terpasang:
- **Node.js** (minimal versi 18 atau lebih baru)
- **npm** (biasanya otomatis terpasang bersama Node.js) atau package manager lain (yarn/pnpm)
- **Git**

### 2. Clone Repository
Unduh salinan repositori ini ke direktori lokal:

```bash
git clone https://github.com/BrezaMedico/DARADIK.git
cd DARADIK
```

### 3. Install Dependency
Pasang semua pustaka yang dibutuhkan oleh proyek:

```bash
npm install
```

### 4. Konfigurasi Environment (Opsional)
Aplikasi sudah dilengkapi data lokal bawaan (*seed fallback*) sehingga langsung berjalan tanpa pengaturan database rumit. Namun, jika ingin menghubungkan dengan instance Supabase milikmu sendiri, buat berkas `.env` di folder root dan isi:

```env
VITE_SUPABASE_URL=https://proyek-kamu.supabase.co
VITE_SUPABASE_ANON_KEY=kunci-anon-kamu
```

### 5. Jalankan Development Server
Mulai server pengembang lokal:

```bash
npm run dev
```

Buka peramban (browser) dan akses alamat yang ditampilkan di terminal, biasanya di `http://localhost:5173`.

### 6. Build Produksi & Preview
Untuk menguji hasil kompilasi akhir sebelum diunggah ke hosting:

```bash
# Kompilasi berkas produksi ke folder /dist
npm run build

# Menjalankan preview lokal dari folder /dist
npm run preview
```

---

## Progress Saat Ini

Berikut ringkasan perkembangan pengerjaan fitur di dalam aplikasi DARADIK:

### Selesai Dikembangkan (Ready)
1. **Landing Page Utama**:
   - Hero banner dengan 3D interactive phone canvas (animasi 1 putaran masuk dan respons terhadap kursor).
   - Pencarian sekolah instan berdasarkan NPSN, nama sekolah, dan filter hierarki wilayah (Provinsi, Kabupaten/Kota, Kecamatan).
   - Video perkenalan alur kerja platform dengan pemutar terintegrasi.
   - Efek transisi masuk cekung (*concave perspective entrance*) yang halus dan tidak menumpuk.
   - Footer modern yang langsung terhubung ke halaman-halaman aktif di aplikasi.

2. **Profil Transparansi Sekolah**:
   - Ringkasan total pagu anggaran BOSP per tahun (dengan histori perbandingan tahun anggaran).
   - Status pencairan dana bertahap (Tahap 1 Semester Ganjil & Tahap 2 Semester Genap).
   - Visualisasi diagram donat untuk porsi belanja komponen RKAS.
   - Ekspor ringkasan dokumen resmi dalam format **PDF A4** dengan tata letak rapi, angka rata kanan (*right-aligned*), dan tanpa tabrakan batas margin.

3. **Validasi Belanja & Bukti Fisik SIPLah**:
   - Pencarian semantik kebutuhan belanja sekolah berbasis kata kunci alami (*semantic item search*).
   - Modal detail nota digital resmi (nomor nota SIPLah, NPWP penyedia, faktur pajak, dan kode verifikasi QR).
   - Modal geotagging fisik untuk memverifikasi foto dan koordinat barang di dalam ruangan kelas.

4. **Pemindai Iuran Grup WhatsApp (AI & OCR)**:
   - Fitur unggah screenshot chat WhatsApp paguyuban/komite kelas.
   - Pemrosesan OCR lokal via Tesseract.js untuk mendeteksi nominal uang, rekening tujuan, dan kata kunci pungutan tidak wajar.
   - Pengecekan silang otomatis dengan komponen anggaran BOSP sekolah.
   - Tombol eskalasi langsung untuk membawa bukti temuan ke formulir laporan anonim.

5. **Saluran Laporan Whistleblowing 100% Anonim**:
   - Formulir pengaduan publik tanpa kewajiban login, nomor telepon, atau data identitas pelapor.
   - Pilihan kategori pelanggaran (pungutan liar, pemotongan dana bantuan, mark-up belanja, dll).
   - Lampiran bukti dukung (gambar atau berkas).
   - Pembuatan kode tiket lacak unik secara otomatis (misal: `DRD-8821-X9`).

6. **Pelacakan Tiket Laporan (Live Tracking)**:
   - Pencarian status tindak lanjut aduan menggunakan kode tiket.
   - Tahapan alur investigasi yang transparan (*Diterima*, *Verifikasi*, *Investigasi*, *Tindak Lanjut*).
   - Ruang diskusi pesan terenkripsi dua arah dengan petugas verifikator secara anonim.

7. **Kamus Juknis BOSP**:
   - Referensi aturan resmi mengenai 12 komponen belanja yang diperbolehkan serta daftar larangan penggunaan dana BOSP.
   - Fitur pencarian cepat istilah dan regulasi pendidikan.

---

### Sedang Disiapkan & Rencana Lanjutan (Next Roadmap)
- [ ] **Koneksi API Nasional**: Integrasi langsung dengan API terbuka Dapodik dan SIPLah Kemendikbudristek untuk pembaruan data ribuan sekolah secara otomatis.
- [ ] **Notifikasi Lapor Terjadwal**: Opsi penerimaan pembaruan status tiket aduan melalui kanal bot pesan atau webhook terenkripsi tanpa membocorkan identitas pengguna.
- [ ] **Dashboard Wilayah Terbuka**: Rangkuman statistik agregat persebaran transparansi dana sekolah per kabupaten dan provinsi.

---

## Lisensi & Kontribusi

Proyek ini dikembangkan untuk mendorong keterbukaan informasi publik dan akuntabilitas tata kelola dana pendidikan di Indonesia. Kontribusi, perbaikan kode, dan saran fitur sangat terbuka melalui *pull request* maupun *issue tracker*.

