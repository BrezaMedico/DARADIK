import type { KamusBospItem } from '@/types/school';

export const KAMUS_BOSP_DATA: {
  allowed: KamusBospItem[];
  prohibited: KamusBospItem[];
} = {
  allowed: [
    {
      title: 'Penerimaan Peserta Didik Baru (PPDB/SPMB)',
      detail:
        'Pendataan, formulir, spanduk, panitia, dan administrasi seleksi. Calon siswa tidak boleh dikenai biaya pendaftaran.',
      ref: 'Rujukan: Permendikdasmen 8/2026, komponen penerimaan peserta didik baru',
    },
    {
      title: 'Buku Pelajaran, Modul & Perpustakaan',
      detail:
        'Buku teks, buku bacaan, bahan ajar, referensi, dan langganan perpustakaan digital. Siswa tidak perlu membeli buku yang sudah disediakan sekolah.',
      ref: 'Rujukan: Permendikdasmen 8/2026, komponen pengembangan perpustakaan',
    },
    {
      title: 'Kegiatan Pembelajaran & Ekstrakurikuler',
      detail:
        'Bahan praktik, alat peraga, pembinaan ekskul, dan keikutsertaan dalam lomba atau kompetisi.',
      ref: 'Rujukan: Permendikdasmen 8/2026, komponen pelaksanaan kegiatan pembelajaran dan ekstrakurikuler',
    },
    {
      title: 'Asesmen & Evaluasi Pembelajaran',
      detail:
        'Penggandaan soal, ulangan, ujian sekolah, asesmen berbasis komputer, serta cetak rapor dan sertifikat.',
      ref: 'Rujukan: Permendikdasmen 8/2026, komponen asesmen/evaluasi pembelajaran',
    },
    {
      title: 'Administrasi Kegiatan Sekolah',
      detail:
        'Alat tulis kantor, fotokopi, cetak dokumen, dan perlengkapan administrasi lain.',
      ref: 'Rujukan: Permendikdasmen 8/2026, komponen administrasi kegiatan sekolah',
    },
    {
      title: 'Pengembangan Profesi Guru & Tenaga Kependidikan',
      detail:
        'Pelatihan, workshop, dan komunitas belajar guru. Ini bukan biaya yang dibebankan ke orang tua.',
      ref: 'Rujukan: Permendikdasmen 8/2026, komponen pengembangan profesi GTK',
    },
    {
      title: 'Langganan Daya & Jasa',
      detail:
        'Listrik, air, telepon, dan internet sekolah, termasuk untuk asesmen berbasis komputer dan server pembelajaran.',
      ref: 'Rujukan: Permendikdasmen 8/2026, komponen langganan daya dan jasa',
    },
    {
      title: 'Pemeliharaan Sarana & Prasarana (termasuk Sanitasi & Toilet)',
      detail:
        'Perbaikan ringan ruang kelas, mebel, toilet, pompa air, wastafel, dan sarana air bersih.',
      ref: 'Rujukan: Permendikdasmen 8/2026, komponen pemeliharaan sarana dan prasarana',
    },
    {
      title: 'Alat Multimedia & Perangkat Pembelajaran',
      detail:
        'Laptop, komputer, proyektor, printer, dan perangkat pendukung pembelajaran.',
      ref: 'Rujukan: Permendikdasmen 8/2026, komponen penyediaan alat multimedia pembelajaran',
    },
    {
      title: 'Honor Guru & Tenaga Kependidikan Non-ASN',
      detail:
        'Dibayarkan dengan syarat dan batas persentase tertentu, termasuk kebijakan relaksasi untuk ASN paruh waktu.',
      ref: 'Rujukan: Permendikdasmen 8/2026 dan SE Mendikdasmen No. 6/2026',
    },
    {
      title: 'Khusus SMK: Peralatan Praktik, Lab & Uji Kompetensi (UKK)',
      detail:
        'Bahan praktik, pemeliharaan peralatan lab dan bengkel, serta penyelenggaraan uji kompetensi, sepanjang masuk komponen yang diatur dalam juknis. Jenjang SMK perlu mencocokkan item ini dengan lampiran jenjangnya.',
      ref: 'Rujukan: Permendikdasmen 8/2026, komponen kegiatan peningkatan kompetensi keahlian',
    },
  ],
  prohibited: [
    {
      title: 'Seragam, Sepatu, Tas & Alat Tulis Pribadi',
      detail: 'Ini kebutuhan pribadi siswa, bukan operasional sekolah.',
      ref: 'Kebutuhan Pribadi Siswa',
    },
    {
      title: 'Pembangunan Gedung & Ruang Baru / Rehabilitasi Berat',
      detail:
        'BOSP hanya untuk pemeliharaan. Pembangunan dan rehabilitasi besar dibiayai APBN/APBD, misalnya melalui DAK Fisik.',
      ref: 'DAK Fisik / APBN / APBD',
    },
    {
      title: 'Wisata, Study Tour & Piknik',
      detail:
        'Kegiatan yang bukan pembelajaran inti tidak masuk komponen BOSP. Jika dilakukan, biayanya patungan sukarela orang tua dan tidak boleh dipaksakan.',
      ref: 'Bukan Pembelajaran Inti (Dilarang Memaksa)',
    },
    {
      title: 'Gaji Guru ASN (PNS/PPPK Penuh Waktu)',
      detail: 'Gaji dibayar dari APBN/APBD, bukan BOSP.',
      ref: 'Belanja Pegawai APBN/APBD',
    },
    {
      title: 'Pinjaman, Investasi & Kegiatan Mencari Bunga',
      detail:
        'Dana BOSP tidak boleh dipinjamkan, disimpan untuk mencari bunga, atau diinvestasikan.',
      ref: 'Larangan Pengelolaan BOSP',
    },
    {
      title: 'Bantuan untuk Pihak Lain, Yayasan atau Kegiatan di Luar Sekolah',
      detail:
        'Dana hanya untuk kebutuhan operasional satuan pendidikan itu sendiri.',
      ref: 'Operasional Satuan Pendidikan Sendiri',
    },
    {
      title: 'Kegiatan yang Sudah Dibiayai Sumber Lain (Dobel Anggaran)',
      detail:
        'Satu kegiatan tidak boleh dibiayai dua kali dari sumber dana yang berbeda.',
      ref: 'Larangan Dobel Anggaran / Tumpang Tindih',
    },
    {
      title: 'Biaya Pribadi dan Kegiatan Mewah',
      detail:
        'Belanja yang tidak ada hubungannya dengan pembelajaran dan tidak masuk RKAS.',
      ref: 'Di Luar RKAS & Pembelajaran',
    },
  ],
};
