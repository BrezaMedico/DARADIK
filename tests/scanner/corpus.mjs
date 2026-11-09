// Korpus uji AI Scanner WhatsApp.
// expect: 'pungli'  -> statusType harus 'danger'
//         'bukan'   -> statusType harus 'safe' atau 'neutral'
// Sekolah uji: SMK TI BAZMA (RKAS memuat buku, kertas/ATK, sanitasi, meja-kursi, kipas, internet, proyektor).

export const CORPUS = [
  // ───────────────────────── PUNGLI: duplikasi dana BOSP ─────────────────────────
  { id: 'P01', expect: 'pungli', cat: 'duplikasi-bosp', text: 'PENGUMUMAN KEPADA BAPAK/IBU ORANG TUA WALI MURID\n\nDalam rangka meningkatkan kenyamanan proses belajar mengajar di kelas, kami dari pihak Komite Kelas bermaksud mengadakan pengadaan kipas angin untuk menunjang kenyamanan siswa selama kegiatan pembelajaran berlangsung.\n\nSehubungan dengan hal tersebut, kami mengharapkan partisipasi Bapak/Ibu dalam pengadaan 2 unit kipas angin dengan estimasi biaya sebesar Rp75.000 per siswa.\n\nAdapun pembayaran dapat dilakukan melalui bendahara kelas paling lambat tanggal 15 November 2026.' },
  { id: 'P02', expect: 'pungli', cat: 'duplikasi-bosp', text: 'Bapak/Ibu wali murid, untuk ganti meja dan kursi kelas yg rusak, tiap anak urunan 100rb ya. Setor ke bu Rina hari senin.' },
  { id: 'P03', expect: 'pungli', cat: 'duplikasi-bosp', text: 'Info: pembelian buku paket Kurikulum Merdeka semester ini Rp 185.000 per siswa, mohon dilunasi sebelum PTS.' },
  { id: 'P04', expect: 'pungli', cat: 'duplikasi-bosp', text: 'Mohon bantuan ortu utk beli kertas HVS dan tinta printer buat ujian anak2, @Rp 30.000. Transfer ke rek bendahara kelas.' },
  { id: 'P05', expect: 'pungli', cat: 'duplikasi-bosp', text: 'Ibu2 bapak2, toilet siswa perlu perbaikan keran dan pipa. Kita patungan Rp 40.000 per anak ya, dikumpulkan ke ketua kelas.' },
  { id: 'P06', expect: 'pungli', cat: 'duplikasi-bosp', text: 'Untuk pembelian proyektor LCD kelas XI, setiap siswa dikenakan iuran Rp 120.000. Batas pembayaran akhir bulan.' },
  { id: 'P07', expect: 'pungli', cat: 'duplikasi-bosp', text: 'Iuran wifi sekolah bulan ini 20rb/anak ya, tolong dibayar via bendahara komite.' },
  { id: 'P08', expect: 'pungli', cat: 'duplikasi-bosp', text: 'Assalamualaikum. AC kelas rusak, servis dan cuci AC biayanya kita bagi rata semua orang tua Rp 55.000/siswa. Mohon segera transfer.' },
  { id: 'P09', expect: 'pungli', cat: 'duplikasi-bosp', text: 'Dana BOS belum cukup untuk cat ulang kelas, jadi wali murid diminta iuran pengecatan Rp 60 ribu per anak.' },
  { id: 'P10', expect: 'pungli', cat: 'duplikasi-bosp', text: 'Iuran kebersihan kelas (sapu, pel, sabun) Rp 15.000 per bulan per siswa, dibayar tiap tanggal 5.' },
  { id: 'P11', expect: 'pungli', cat: 'duplikasi-bosp', text: 'Kami dari komite kelas mau beli spidol, penghapus papan tulis, dan kertas HVS buat kelas. Per anak 25rb. Terima kasih.' },
  { id: 'P12', expect: 'pungli', cat: 'duplikasi-bosp', text: 'kipas anginnya rusak 2 bu, kita beli baru ya, 1 anak 50rb. bayar ke bendahara paling lambat jumat' },

  // ───────────────────────── PUNGLI: paksaan terselubung ─────────────────────────
  { id: 'P20', expect: 'pungli', cat: 'terselubung', text: 'Sumbangan sukarela untuk pengembangan sekolah, minimal Rp 200.000 per siswa. Paling lambat dibayar akhir bulan ini ya Bapak/Ibu.' },
  { id: 'P21', expect: 'pungli', cat: 'terselubung', text: 'Hasil rapat komite menyepakati sumbangan pengembangan Rp 500.000 per siswa. Sifatnya sukarela, namun mohon dibayarkan sebelum 30 November. Bagi yang belum akan kami hubungi.' },
  { id: 'P22', expect: 'pungli', cat: 'terselubung', text: 'Infaq gedung sesuai kemampuan, tapi tidak boleh kurang dari 150 ribu. Terima kasih atas pengertiannya.' },
  { id: 'P23', expect: 'pungli', cat: 'terselubung', text: 'Dana partisipasi orang tua tahun ajaran baru: Rp 750.000/anak. Mohon segera dilunasi, nama yang belum bayar akan kami rekap dan dilaporkan ke kepala sekolah.' },
  { id: 'P24', expect: 'pungli', cat: 'terselubung', text: 'Bapak Ibu, tidak ada paksaan ya, tapi seluruh wali murid sudah setuju iuran 100rb per anak, jadi hanya tinggal bapak/ibu yang belum setor. Mohon segera.' },
  { id: 'P25', expect: 'pungli', cat: 'terselubung', text: 'Dimohon kerelaan Bapak/Ibu untuk menyumbang Rp 300.000 per siswa utk program sekolah unggulan. Daftar nama penyumbang akan dibacakan di rapat.' },
  { id: 'P26', expect: 'pungli', cat: 'terselubung', text: 'Kesepakatan paguyuban: dana gotong royong Rp 250.000 tiap siswa. Tidak wajib tapi yg tidak ikut harap menghadap wali kelas.' },
  { id: 'P27', expect: 'pungli', cat: 'terselubung', text: 'Sodaqoh jariyah pembangunan musholla sekolah, bapak ibu diharapkan berpartisipasi Rp 100.000/siswa, setor ke wali kelas hari Kamis.' },
  { id: 'P28', expect: 'pungli', cat: 'terselubung', text: 'wajib ya bapak ibu, uang kas insidentil 80rb per anak, jgn sampe telat. makasih' },
  { id: 'P29', expect: 'pungli', cat: 'terselubung', text: 'Uang terima kasih untuk panitia jalur masuk (seikhlasnya tapi biasanya wali murid lain memberi Rp 2 juta). Titip ke bu Tuti.' },
  { id: 'P30', expect: 'pungli', cat: 'terselubung', text: 'Study tour ke Bali wajib diikuti seluruh siswa, biaya Rp 2.800.000. DP Rp 1 juta paling lambat 10 Desember.' },

  // ───────────────────────── PUNGLI: sanksi akademik ─────────────────────────
  { id: 'P40', expect: 'pungli', cat: 'sanksi', text: 'Siswa yang belum melunasi iuran komite tidak boleh ikut ujian semester dan kartu ujian ditahan sampai lunas.' },
  { id: 'P41', expect: 'pungli', cat: 'sanksi', text: 'Rapor semester ganjil belum bisa diambil bagi yang masih ada tunggakan. Mohon diselesaikan dulu ya bapak/ibu.' },
  { id: 'P42', expect: 'pungli', cat: 'sanksi', text: 'Ijazah ditahan sampai uang gedung dan tunggakan SPP lunas. Silakan menebus ijazah di tata usaha.' },
  { id: 'P43', expect: 'pungli', cat: 'sanksi', text: 'Anak2 yg blm bayar iuran 100rb disuruh pulang dulu dr kelas sama wali kelas hari ini 😔' },
  { id: 'P44', expect: 'pungli', cat: 'sanksi', text: 'Nama-nama siswa yang belum membayar iuran akan kami umumkan di grup dan ditempel di mading sekolah.' },
  { id: 'P45', expect: 'pungli', cat: 'sanksi', text: 'Untuk ambil kartu peserta PAS harus menunjukkan bukti lunas iuran Rp 175.000. Tanpa bukti lunas tidak diberi kartu.' },

  // ───────────────────────── PUNGLI: struktural ─────────────────────────
  { id: 'P50', expect: 'pungli', cat: 'struktural', text: 'Uang pangkal siswa baru tahun ajaran 2026/2027 sebesar Rp 3.500.000, wajib dilunasi saat daftar ulang.' },
  { id: 'P51', expect: 'pungli', cat: 'struktural', text: 'Tagihan komite bulanan Rp 150.000 per siswa, jatuh tempo tanggal 10 setiap bulan. Keterlambatan dikenai denda Rp 5.000/hari.' },
  { id: 'P52', expect: 'pungli', cat: 'struktural', text: 'Biaya daftar ulang kelas XI Rp 450.000 sudah termasuk formulir dan kartu pelajar. Pembayaran ke bendahara sekolah.' },
  { id: 'P53', expect: 'pungli', cat: 'struktural', text: 'Pembangunan gedung baru butuh dana, tiap orang tua diwajibkan membayar dana pembangunan Rp 1.000.000.' },

  // ───────────────────────── PUNGLI: komersialisasi ─────────────────────────
  { id: 'P60', expect: 'pungli', cat: 'komersial', text: 'LKS semester 2 wajib dibeli di koperasi sekolah, harga Rp 95.000 per paket. Tidak boleh beli di luar.' },
  { id: 'P61', expect: 'pungli', cat: 'komersial', text: 'Seragam batik dan kain seragam dibeli lewat sekolah ya, satu paket Rp 650.000. Syarat daftar ulang.' },
  { id: 'P62', expect: 'pungli', cat: 'komersial', text: 'Biaya legalisir ijazah dan SKHU Rp 50.000 per lembar, bayar di TU.' },
  { id: 'P63', expect: 'pungli', cat: 'komersial', text: 'Remedial ulangan: siswa membayar Rp 25.000 per mata pelajaran agar bisa ikut remedial dan nilai diperbaiki.' },
  { id: 'P64', expect: 'pungli', cat: 'komersial', text: 'Uang les tambahan wajib untuk kelas XII Rp 200.000/bulan, siswa yang tidak ikut les nilainya bisa dipertimbangkan.' },
  { id: 'P65', expect: 'pungli', cat: 'komersial', text: 'Biaya cetak rapor dan pembuatan kartu pelajar Rp 35.000, harap dibayar ke wali kelas.' },
  { id: 'P66', expect: 'pungli', cat: 'komersial', text: 'Foto copy soal ujian tiap siswa dikenakan Rp 20.000, dikumpulkan lewat ketua kelas sebelum PTS.' },

  // ───────────────────────── BUKAN pungli: informasi umum ─────────────────────────
  { id: 'B01', expect: 'bukan', cat: 'informasi', text: 'Selamat pagi Bapak/Ibu, mengingatkan rapat orang tua siswa kelas X besok Sabtu pukul 09.00 WIB di aula sekolah. Mohon hadir tepat waktu. Terima kasih.' },
  { id: 'B02', expect: 'bukan', cat: 'informasi', text: 'Pengumuman: hari Senin tanggal 17 Agustus libur nasional. Kegiatan belajar mengajar kembali normal hari Selasa.' },
  { id: 'B03', expect: 'bukan', cat: 'informasi', text: 'Jadwal Penilaian Tengah Semester dimulai 3 Desember. Anak-anak mohon belajar yang rajin dan membawa alat tulis sendiri.' },
  { id: 'B04', expect: 'bukan', cat: 'informasi', text: 'di lab' },
  { id: 'B05', expect: 'bukan', cat: 'informasi', text: 'okkk' },
  { id: 'B06', expect: 'bukan', cat: 'informasi', text: 'Besok pramuka ya, anak-anak pakai seragam pramuka lengkap yang sudah dimiliki dan bawa tongkat pribadi.' },
  { id: 'B07', expect: 'bukan', cat: 'informasi', text: 'Pembagian rapor dilaksanakan Sabtu 20 Desember pukul 08.00. Bapak/Ibu wali murid diharap mengambil langsung ke wali kelas.' },
  { id: 'B08', expect: 'bukan', cat: 'informasi', text: 'Mohon maaf Bapak Ibu, ananda Rafi hari ini izin sakit demam. Terima kasih Bu guru.' },
  { id: 'B09', expect: 'bukan', cat: 'informasi', text: 'Tugas prakarya minggu depan: membuat kerajinan dari barang bekas. Bahan menggunakan barang bekas di rumah masing-masing, tidak perlu membeli.' },
  { id: 'B10', expect: 'bukan', cat: 'informasi', text: 'Reminder: besok anak-anak membawa botol minum dan bekal sendiri karena kantin tutup.' },

  // ───────────────────────── BUKAN pungli: sukarela murni ─────────────────────────
  { id: 'B20', expect: 'bukan', cat: 'sukarela', text: 'Bapak/Ibu, salah satu orang tua murid kelas X sedang berduka. Bagi yang berkenan memberi santunan seikhlasnya, silakan, tanpa nominal ditentukan dan tidak ada paksaan sama sekali.' },
  { id: 'B21', expect: 'bukan', cat: 'sukarela', text: 'Penggalangan donasi untuk korban banjir bersifat sukarela, berapa pun nominalnya sangat berarti. Tidak ada kewajiban dan tidak ada batas waktu.' },
  { id: 'B22', expect: 'bukan', cat: 'sukarela', text: 'Kas kelas sukarela ya, seikhlasnya saja, yang tidak ikut tidak masalah sama sekali. Untuk keperluan fotokopi tugas kelompok kalau ada.' },
  { id: 'B23', expect: 'bukan', cat: 'sukarela', text: 'Ibu-ibu, mau patungan beli kado buat bu Ani yang mau pensiun? Seikhlasnya aja, boleh ikut boleh tidak 🙏' },
  { id: 'B24', expect: 'bukan', cat: 'sukarela', text: 'Bukber kelas diadakan oleh panitia wali murid secara sukarela. Yang ingin ikut urunan silakan sesuai kemampuan, yang berhalangan tidak apa-apa dan tidak ada sanksi apapun.' },

  // ───────────────────────── BUKAN pungli: gratis & transparansi ─────────────────────────
  { id: 'B30', expect: 'bukan', cat: 'transparansi', text: 'Pemberitahuan: sekolah TIDAK memungut biaya apapun untuk buku paket, ujian, dan kartu pelajar. Semua dibiayai dana BOS. Jika ada pihak yang meminta pembayaran, segera laporkan ke kepala sekolah.' },
  { id: 'B31', expect: 'bukan', cat: 'transparansi', text: 'Laporan penggunaan dana BOSP semester 1: pengadaan buku Rp 21.600.000, perawatan sanitasi Rp 11.200.000, kipas angin Rp 9.800.000. Seluruhnya dibiayai BOSP tanpa membebani orang tua.' },
  { id: 'B32', expect: 'bukan', cat: 'transparansi', text: 'Waspada pungli! Sekolah negeri dilarang memungut biaya wajib dari siswa. Bapak/Ibu yang mengalami pungutan dapat melapor lewat DARADIK secara anonim.' },
  { id: 'B33', expect: 'bukan', cat: 'transparansi', text: 'Informasi PIP: bantuan Program Indonesia Pintar Rp 1.800.000 akan dicairkan langsung ke rekening siswa penerima. Tidak ada biaya apapun, hati-hati penipuan yang mengatasnamakan sekolah.' },
  { id: 'B34', expect: 'bukan', cat: 'transparansi', text: 'Bapak Ibu, kipas angin dan meja kursi baru sudah dipasang di kelas dari dana BOS, orang tua tidak perlu membayar apapun. Mohon dijaga bersama-sama.' },

  // ───────────────────────── BUKAN pungli: pertanyaan & percakapan ─────────────────────────
  { id: 'B40', expect: 'bukan', cat: 'percakapan', text: 'Bu, maaf mau tanya, apakah benar ada iuran kipas angin di kelas? Setahu saya sudah dibiayai BOS kan?' },
  { id: 'B41', expect: 'bukan', cat: 'percakapan', text: 'Bapak ibu, jangan mau kalau ada yang minta uang kipas, itu sudah dari dana BOS. Kalau ada yang maksa kita laporkan bersama.' },
  { id: 'B42', expect: 'bukan', cat: 'percakapan', text: 'Alhamdulillah anak saya dapat juara 1 lomba cerdas cermat 🎉 terima kasih bu guru atas bimbingannya' },
  { id: 'B43', expect: 'bukan', cat: 'percakapan', text: 'Mama Rafi, tadi saya sudah transfer Rp 150.000 ke rekening kamu untuk arisan keluarga kemarin ya.' },
  { id: 'B44', expect: 'bukan', cat: 'percakapan', text: 'Kegiatan outing class bersifat opsional dan murni inisiatif orang tua. Tidak diwajibkan, tidak ada nominal tetap, tidak ada tenggat, dan tidak berpengaruh pada nilai maupun hak siswa.' },
];

