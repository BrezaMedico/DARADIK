export { REGION_HIERARCHY } from './indonesiaRegions';

export interface InvoiceLineItem {
  name: string;
  qty: string;
  unitPrice: number;
  subtotal: number;
}

export interface BospRealizationItem {
  id: string;
  code: string;
  name: string;
  unitSummary: string;
  amount: number;
  category: string;
  aiCategoryPath: string;
  date: string;
  stage: 'Tahap 1' | 'Tahap 2';
  allocation: string;
  iconType: 'fan' | 'paint' | 'book' | 'projector' | 'sanitation' | 'desk';
  keywords: string[];
  invoice: {
    number: string;
    vendorName: string;
    vendorAddress: string;
    npwp: string;
    date: string;
    treasurerName: string;
    principalName: string;
    lineItems: InvoiceLineItem[];
  };
  geotag: {
    lat: string;
    lng: string;
    roomLabel: string;
    uploadedAt: string;
    inspectorNote: string;
    conditionStatus: string;
  };
}

export interface BudgetComposition {
  id: string;
  label: string;
  percentage: number;
  amount: number;
  color: string;
  description: string;
}

export interface SchoolYearHistory {
  year: string;
  isCurrentYear: boolean;
  totalBosp: number;
  tahap1: {
    amount: number;
    period: string;
    status: string;
    disbursedDate: string;
  };
  tahap2: {
    amount: number;
    period: string;
    status: string;
    disbursedDate: string;
  };
  compositions: BudgetComposition[];
  items: BospRealizationItem[];
}

export interface SchoolData {
  id: string;
  name: string;
  npsn: string;
  sampleNisn: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  address: string;
  status: string;
  studentCount: number;
  perStudentEstimate: number;
  totalBosp: number;
  tahap1: {
    amount: number;
    period: string;
    status: string;
    disbursedDate: string;
  };
  tahap2: {
    amount: number;
    period: string;
    status: string;
    disbursedDate: string;
  };
  compositions: BudgetComposition[];
  items: BospRealizationItem[];
  history?: Record<string, SchoolYearHistory>;
}

/**
 * Item Realisasi Pengadaan BOSP Resmi SMK TI BAZMA (90 Siswa)
 * Pagu Anggaran Rp 151.200.000 (Rp 1.680.000 per siswa / tahun)
 */
export const BAZMA_BOSP_ITEMS: BospRealizationItem[] = [
  {
    id: 'item-bazma-kipas-01',
    code: 'RKAS-02.04.11',
    name: 'Kipas Angin Dinding & Exhaust Fan Lab Komputer (12 Unit)',
    unitSummary: '12 Unit Terpasang',
    amount: 14500000,
    category: 'Peralatan Sekolah (Sarana Prasarana Ruang Lab)',
    aiCategoryPath: 'Peralatan Sekolah > Pendingin & Ventilasi Lab Komputer',
    date: '12 Oktober 2026',
    stage: 'Tahap 2',
    allocation: 'Pemasangan sirkulasi pendingin di Lab Jaringan SIJA 1, Lab SIJA 2, dan Ruang Server Siswa SMK TI BAZMA',
    iconType: 'fan',
    keywords: [
      'kipas',
      'angin',
      'kipas angin',
      'exhaust',
      'gerah',
      'panas',
      'pendingin',
      'sirkulasi',
      'ventilasi',
      'ac lab',
      'dinding',
      'lab komputer',
    ],
    invoice: {
      number: 'INV/BM-BAZMA/2026/10/0192',
      vendorName: 'CV Bintang Mandiri Teknik Bogor (Mitra SIPLah)',
      vendorAddress: 'Jl. Raya Dramaga No. 45, Kab. Bogor, Jawa Barat',
      npwp: '02.948.112.4-403.000',
      date: '12 Oktober 2026',
      treasurerName: 'Rina Marlina, S.E. (Bendahara BOSP)',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd. (Kepala Sekolah)',
      lineItems: [
        {
          name: 'Kipas Angin Dinding Industrial 18 Inch Heavy Duty SNI',
          qty: '8 Unit',
          unitPrice: 1100000,
          subtotal: 8800000,
        },
        {
          name: 'Exhaust Fan Dinding Louver Otomatis Ruang Server Lab',
          qty: '4 Unit',
          unitPrice: 1425000,
          subtotal: 5700000,
        },
      ],
    },
    geotag: {
      lat: '-6.5684',
      lng: '106.6975',
      roomLabel: 'Lab Komputer & Jaringan SIJA — SMK TI BAZMA',
      uploadedAt: '14 Okt 2026 10:15 WIB',
      inspectorNote: '12 unit kipas & exhaust terpasang rapi di Lab SIJA 1 & 2. Berfungsi normal menjaga suhu ruangan server.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik SMK TI BAZMA',
    },
  },
  {
    id: 'item-bazma-switch-02',
    code: 'RKAS-02.04.15',
    name: 'Switch Gigabit 24-Port & Access Point WiFi Lab SIJA',
    unitSummary: '3 Unit Switch & 4 AP',
    amount: 18500000,
    category: 'Peralatan Jaringan & Infrastruktur Praktikum TI',
    aiCategoryPath: 'Infrastruktur TI > Perangkat Jaringan Komputer Lab',
    date: '20 September 2026',
    stage: 'Tahap 2',
    allocation: 'Peremajaan perangkat switch gigabit rackmount dan access point dual-band untuk praktikum 90 siswa kejuruan SIJA',
    iconType: 'projector',
    keywords: [
      'switch',
      'wifi',
      'router',
      'mikrotik',
      'jaringan',
      'internet lab',
      'kabel lan',
      'hub',
      'koneksi',
      'access point',
    ],
    invoice: {
      number: 'INV/NET-ID/2026/09/0841',
      vendorName: 'PT Nusantara Edu Network (SIPLah Kemdikbud)',
      vendorAddress: 'Komp. Ruko Yasmin Sektor 6 No. 12, Kota Bogor',
      npwp: '01.554.891.2-404.000',
      date: '20 September 2026',
      treasurerName: 'Rina Marlina, S.E. (Bendahara BOSP)',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd. (Kepala Sekolah)',
      lineItems: [
        {
          name: 'Managed Switch Gigabit 24-Port 10/100/1000 Rackmount',
          qty: '3 Unit',
          unitPrice: 3800000,
          subtotal: 11400000,
        },
        {
          name: 'Enterprise Access Point WiFi-6 Dual Band Praktikum',
          qty: '4 Unit',
          unitPrice: 1775000,
          subtotal: 7100000,
        },
      ],
    },
    geotag: {
      lat: '-6.5682',
      lng: '106.6978',
      roomLabel: 'Server Rack & Lab Cloud Computing — SMK TI BAZMA',
      uploadedAt: '22 Sep 2026 14:30 WIB',
      inspectorNote: 'Switch dan AP aktif menyuplai bandwidth gigabit untuk seluruh 30 workstation di lab.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik SMK TI BAZMA',
    },
  },
  {
    id: 'item-bazma-modul-03',
    code: 'RKAS-03.01.05',
    name: 'Modul Ajar Praktikum Cloud & Jaringan Siswa SNI',
    unitSummary: '90 Paket Lengkap',
    amount: 22000000,
    category: 'Pengembangan Perpustakaan & Modul Kejuruan',
    aiCategoryPath: 'Kurikulum & Buku > Modul Praktikum Siswa SIJA',
    date: '10 Maret 2026',
    stage: 'Tahap 1',
    allocation: 'Pengadaan 90 paket modul pembelajaran kejuruan Sistem Informatika Jaringan & Aplikasi (SIJA) gratis bagi seluruh siswa',
    iconType: 'book',
    keywords: [
      'buku',
      'modul',
      'lks',
      'praktikum',
      'buku ajar',
      'materi',
      'fotokopi materi',
      'buku teks',
      'perpustakaan',
    ],
    invoice: {
      number: 'INV/PENA-ED/2026/03/0119',
      vendorName: 'Penerbit Edukasi Mandiri Bogor',
      vendorAddress: 'Jl. Padjadjaran No. 88, Kota Bogor, Jawa Barat',
      npwp: '03.212.784.9-403.000',
      date: '10 Maret 2026',
      treasurerName: 'Rina Marlina, S.E. (Bendahara BOSP)',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd. (Kepala Sekolah)',
      lineItems: [
        {
          name: 'Paket Modul Kurikulum Merdeka Kejuruan SIJA Tingkat X, XI, XII',
          qty: '90 Paket',
          unitPrice: 244444,
          subtotal: 22000000,
        },
      ],
    },
    geotag: {
      lat: '-6.5683',
      lng: '106.6974',
      roomLabel: 'Perpustakaan & Ruang Baca — SMK TI BAZMA',
      uploadedAt: '12 Mar 2026 09:10 WIB',
      inspectorNote: '90 paket modul telah didistribusikan langsung ke siswa tanpa pungutan biaya apa pun.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik SMK TI BAZMA',
    },
  },
  {
    id: 'item-bazma-proyektor-04',
    code: 'RKAS-02.04.09',
    name: 'Proyektor Interaktif Lab Komputer & Presentasi',
    unitSummary: '2 Unit Proyektor EPSON',
    amount: 13500000,
    category: 'Peralatan Multimedia Pembelajaran Interaktif',
    aiCategoryPath: 'Peralatan Sekolah > Multimedia & Proyektor Lab',
    date: '25 Februari 2026',
    stage: 'Tahap 1',
    allocation: 'Pemasangan proyektor gantung bracket di Lab SIJA 1 dan Lab SIJA 2 untuk visualisasi koding dan topologi jaringan',
    iconType: 'projector',
    keywords: [
      'proyektor',
      'infocus',
      'layar proyektor',
      'kabel hdmi',
      'lcd',
      'presentasi',
    ],
    invoice: {
      number: 'INV/MULTI-BGR/2026/02/0048',
      vendorName: 'CV Graha Audio Visual Bogor',
      vendorAddress: 'Jl. Raya Tajur No. 102, Kota Bogor',
      npwp: '02.441.890.3-404.000',
      date: '25 Februari 2026',
      treasurerName: 'Rina Marlina, S.E. (Bendahara BOSP)',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd. (Kepala Sekolah)',
      lineItems: [
        {
          name: 'Proyektor EPSON 3LCD 3600 ANSI Lumens + Bracket Gantung Plafon',
          qty: '2 Unit',
          unitPrice: 6750000,
          subtotal: 13500000,
        },
      ],
    },
    geotag: {
      lat: '-6.5684',
      lng: '106.6975',
      roomLabel: 'Lab Komputer SIJA 1 — SMK TI BAZMA',
      uploadedAt: '27 Feb 2026 11:20 WIB',
      inspectorNote: 'Proyektor terpasang kokoh di langit-langit Lab 1 & 2 dengan kabel HDMI tanam.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik SMK TI BAZMA',
    },
  },
  {
    id: 'item-bazma-sanitasi-05',
    code: 'RKAS-05.08.14',
    name: 'Perbaikan Sanitasi & Fasilitas Cuci Tangan Asrama',
    unitSummary: '4 Bilik & 6 Wastafel',
    amount: 12480000,
    category: 'Pemeliharaan Sarana Sanitasi & Higienitas Siswa',
    aiCategoryPath: 'Pemeliharaan Sanitasi > Kamar Mandi & Wastafel',
    date: '15 Mei 2026',
    stage: 'Tahap 1',
    allocation: 'Perbaikan instalasi air bersih, toren, keran, dan wastafel sanitasi gedung asrama santri SMK TI BAZMA',
    iconType: 'sanitation',
    keywords: [
      'toilet',
      'wc',
      'kamar mandi',
      'wastafel',
      'keran',
      'sabun',
      'air bersih',
      'sanitasi',
      'pipa',
      'pompa',
      'toren',
    ],
    invoice: {
      number: 'INV/SAN-BGR/2026/05/0114',
      vendorName: 'CV Berkah Sanitasi Mandiri',
      vendorAddress: 'Jl. Raya Leuwiliang No. 70, Kab. Bogor',
      npwp: '04.119.502.1-403.000',
      date: '15 Mei 2026',
      treasurerName: 'Rina Marlina, S.E. (Bendahara BOSP)',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd. (Kepala Sekolah)',
      lineItems: [
        {
          name: 'Perbaikan Pipa PVC AW, Pompa Air Booster, & Kloset Duduk/Jongkok',
          qty: '4 Bilik',
          unitPrice: 1870000,
          subtotal: 7480000,
        },
        {
          name: 'Wastafel Cuci Tangan Keramik + Keran Sensor Manual SNI',
          qty: '6 Titik',
          unitPrice: 833333,
          subtotal: 5000000,
        },
      ],
    },
    geotag: {
      lat: '-6.5681',
      lng: '106.6976',
      roomLabel: 'Gedung Asrama Siswa — SMK TI BAZMA',
      uploadedAt: '18 Mei 2026 15:40 WIB',
      inspectorNote: 'Pasokan air bersih lancar di 4 bilik kamar mandi dan wastafel asrama siswa.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik SMK TI BAZMA',
    },
  },
  {
    id: 'item-bazma-meja-06',
    code: 'RKAS-05.04.02',
    name: 'Set Meja Kursi Lab Komputer Ergonomis (30 Set)',
    unitSummary: '30 Set Lengkap',
    amount: 15000000,
    category: 'Pemeliharaan & Pengadaan Meubelair Sekolah',
    aiCategoryPath: 'Sarana Ruang Lab > Meja & Kursi Komputer',
    date: '18 Agustus 2026',
    stage: 'Tahap 2',
    allocation: 'Penggantian meja komputer berkerangka besi hollow dan kursi kerja ergonomis untuk kenyamanan koding siswa',
    iconType: 'desk',
    keywords: [
      'meja',
      'kursi',
      'bangku',
      'meja lab',
      'kursi komputer',
      'meubelair',
      'meja kelas',
      'kursi kelas',
    ],
    invoice: {
      number: 'INV/MEBEL-BOS/2026/08/0071',
      vendorName: 'UD Jaya Perkasa Meubel Bogor',
      vendorAddress: 'Jl. Raya Ciampea KM 11, Kab. Bogor',
      npwp: '05.332.901.4-403.000',
      date: '18 Agustus 2026',
      treasurerName: 'Rina Marlina, S.E. (Bendahara BOSP)',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd. (Kepala Sekolah)',
      lineItems: [
        {
          name: 'Meja Komputer Rangka Besi Powder Coating + Kursi Ergonomis',
          qty: '30 Set',
          unitPrice: 500000,
          subtotal: 15000000,
        },
      ],
    },
    geotag: {
      lat: '-6.5684',
      lng: '106.6975',
      roomLabel: 'Lab Komputer SIJA 2 — SMK TI BAZMA',
      uploadedAt: '20 Agu 2026 13:00 WIB',
      inspectorNote: '30 set meja kursi baru telah ditempatkan rapi di Lab SIJA 2.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik SMK TI BAZMA',
    },
  },
  {
    id: 'item-bazma-internet-07',
    code: 'RKAS-06.01.01',
    name: 'Langganan Internet Dedicated Fiber Optik 100 Mbps',
    unitSummary: '12 Bulan Penuh',
    amount: 21600000,
    category: 'Langganan Daya & Jasa (Internet Kejuruan TI)',
    aiCategoryPath: 'Langganan Daya & Jasa > Internet Dedicated 100 Mbps',
    date: '05 Januari 2026',
    stage: 'Tahap 1',
    allocation: 'Akses internet dedicated fiber optik 1:1 untuk mendukung praktikum Cloud, Linux server, dan pembelajaran jarak jauh 90 murid',
    iconType: 'projector',
    keywords: [
      'internet',
      'wifi',
      'kuota',
      'pulsa',
      'langganan internet',
      'indihome',
      'biznet',
      'fiber optik',
      'bandwidth',
    ],
    invoice: {
      number: 'INV/TELCO-BGR/2026/01/0012',
      vendorName: 'PT Telekomunikasi Data Nusantara Bogor',
      vendorAddress: 'Jl. Pajajaran Raya No. 12, Kota Bogor',
      npwp: '01.233.444.5-403.000',
      date: '05 Januari 2026',
      treasurerName: 'Rina Marlina, S.E. (Bendahara BOSP)',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd. (Kepala Sekolah)',
      lineItems: [
        {
          name: 'Langganan Akses Internet Dedicated Fiber Optik 100 Mbps (12 Bulan)',
          qty: '12 Bulan',
          unitPrice: 1800000,
          subtotal: 21600000,
        },
      ],
    },
    geotag: {
      lat: '-6.5682',
      lng: '106.6978',
      roomLabel: 'NOC / Ruang Jaringan Utama — SMK TI BAZMA',
      uploadedAt: '10 Jan 2026 10:00 WIB',
      inspectorNote: 'Kabel fiber optik aktif dan latensi stabil <5ms untuk praktikum cloud siswa.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik SMK TI BAZMA',
    },
  },
];

/**
 * Data Utama SMK TI BAZMA (90 Murid)
 * Didesain tunggal untuk mempermudah penilaian juri.
 */
export const SMK_TI_BAZMA: SchoolData = {
  id: 'smk-ti-bazma',
  name: 'SMK TI BAZMA',
  npsn: '69994998',
  sampleNisn: '0081928491',
  provinsi: 'Jawa Barat',
  kabupaten: 'Kab. Bogor',
  kecamatan: 'Ciampea',
  address: 'Jl. Cikampak Cicadas RT 01/RW 01, Kp. Cirangkong, Cibatok II, Kec. Ciampea / Cibungbulang, Kab. Bogor, Jawa Barat 16630',
  status: 'Terdaftar Aktif di Kemdikbudristek',
  studentCount: 90,
  perStudentEstimate: 1680000,
  totalBosp: 151200000,
  tahap1: {
    amount: 75600000,
    period: 'Jan–Jun',
    status: 'Sudah Cair',
    disbursedDate: '14 Februari 2026',
  },
  tahap2: {
    amount: 75600000,
    period: 'Jul–Des',
    status: 'Belum Cair',
    disbursedDate: 'Menunggu Penyaluran',
  },
  compositions: [
    {
      id: 'comp-1',
      label: 'Peralatan Lab TI & Fasilitas Kelas',
      percentage: 40,
      amount: 60480000,
      color: '#2E6496',
      description: 'Pendingin lab komputer, switch gigabit, proyektor interaktif, dan perbaikan sarana sanitasi asrama 90 siswa.',
    },
    {
      id: 'comp-2',
      label: 'Modul Kejuruan & Praktikum SIJA/RPL',
      percentage: 35,
      amount: 52920000,
      color: '#66A3BF',
      description: 'Pengadaan modul praktikum cloud computing, linux sysadmin, buku kurikulum nasional, dan sertifikasi keahlian siswa.',
    },
    {
      id: 'comp-3',
      label: 'Langganan Internet & Operasional Sekolah',
      percentage: 25,
      amount: 37800000,
      color: '#8CBCCF',
      description: 'Langganan internet dedicated fiber optik 100 Mbps, bahan praktik habis pakai (kabel UTP/konektor), dan administrasi ARKAS.',
    },
  ],
  items: BAZMA_BOSP_ITEMS,
};

/**
 * Arsip Realisasi Pengadaan BOSP Resmi SMK TI BAZMA Tahun Lalu (TA 2025)
 */
export const BAZMA_BOSP_ITEMS_2025: BospRealizationItem[] = [
  {
    id: 'item-2025-komputer-01',
    code: 'RKAS-2025-02.04',
    name: 'Workstation Komputer Praktikum Lab SIJA (10 Unit)',
    unitSummary: '10 Unit Terpasang',
    amount: 42000000,
    category: 'Peralatan Sekolah & Fasilitas Lab Komputer',
    aiCategoryPath: 'Infrastruktur TI > Komputer Workstation Lab',
    date: '15 Agustus 2025',
    stage: 'Tahap 2',
    allocation: 'Pengadaan workstation koding dan sistem operasi Linux untuk praktikum 90 siswa kejuruan',
    iconType: 'projector',
    keywords: ['komputer', 'pc', 'workstation', 'lab komputer', 'praktikum', 'sija'],
    invoice: {
      number: 'INV/TECH-BGR/2025/08/0411',
      vendorName: 'PT Multi Informatika Nusantara Bogor',
      vendorAddress: 'Jl. Pajajaran No. 44, Kota Bogor',
      npwp: '01.882.333.1-403.000',
      date: '15 Agustus 2025',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd.',
      lineItems: [
        {
          name: 'PC Desktop Core i5 SSD 512GB RAM 16GB Lab Workstation',
          qty: '10 Unit',
          unitPrice: 4200000,
          subtotal: 42000000,
        },
      ],
    },
    geotag: {
      lat: '-6.5684',
      lng: '106.6975',
      roomLabel: 'Lab Komputer SIJA 1 — SMK TI BAZMA',
      uploadedAt: '18 Agu 2025 11:00 WIB',
      inspectorNote: '10 unit PC telah diinstalasi OS Debian dan siap untuk praktikum siswa.',
      conditionStatus: 'Terverifikasi Fisik & Geotagging Dapodik',
    },
  },
  {
    id: 'item-2025-modul-02',
    code: 'RKAS-2025-03.01',
    name: 'Buku Teks & Modul Kurikulum Nasional Siswa',
    unitSummary: '90 Paket Modul',
    amount: 20000000,
    category: 'Pengembangan Bahan Ajar & Modul Siswa',
    aiCategoryPath: 'Kurikulum & Buku > Modul Praktikum Siswa',
    date: '10 Maret 2025',
    stage: 'Tahap 1',
    allocation: 'Penyediaan modul materi ajar kejuruan gratis bagi seluruh 90 siswa SMK TI BAZMA',
    iconType: 'book',
    keywords: ['buku', 'modul', 'materi', 'buku teks', 'perpustakaan', 'kurikulum'],
    invoice: {
      number: 'INV/EDUKASI-BGR/2025/03/0091',
      vendorName: 'Penerbit Mitra Edukasi Bogor',
      vendorAddress: 'Jl. Raya Tajur No. 12, Kota Bogor',
      npwp: '02.441.222.9-404.000',
      date: '10 Maret 2025',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd.',
      lineItems: [
        {
          name: 'Paket Modul Kurikulum SMK Kejuruan SIJA Lengkap',
          qty: '90 Paket',
          unitPrice: 222222,
          subtotal: 20000000,
        },
      ],
    },
    geotag: {
      lat: '-6.5683',
      lng: '106.6974',
      roomLabel: 'Perpustakaan & Ruang Baca — SMK TI BAZMA',
      uploadedAt: '12 Mar 2025 10:15 WIB',
      inspectorNote: 'Buku teks telah didistribusikan ke seluruh siswa tanpa dipungut biaya.',
      conditionStatus: 'Terverifikasi Fisik & Geotagging Dapodik',
    },
  },
  {
    id: 'item-2025-router-03',
    code: 'RKAS-2025-02.05',
    name: 'Router Gateway Core Mikrotik & Rack Server Asrama',
    unitSummary: '2 Unit Router Core',
    amount: 14800000,
    category: 'Perangkat Jaringan & Komunikasi Data',
    aiCategoryPath: 'Infrastruktur TI > Router Core Jaringan',
    date: '22 September 2025',
    stage: 'Tahap 2',
    allocation: 'Pembaruan router gateway bandwidth management untuk akses internet asrama siswa',
    iconType: 'projector',
    keywords: ['router', 'mikrotik', 'gateway', 'wifi', 'jaringan', 'internet'],
    invoice: {
      number: 'INV/NET-2025/09/0112',
      vendorName: 'CV Jaringan Mandiri Bogor',
      vendorAddress: 'Jl. Padjadjaran No. 56, Kota Bogor',
      npwp: '03.111.444.2-403.000',
      date: '22 September 2025',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd.',
      lineItems: [
        {
          name: 'MikroTik Cloud Core Router CCR2004-16G-2S+',
          qty: '2 Unit',
          unitPrice: 7400000,
          subtotal: 14800000,
        },
      ],
    },
    geotag: {
      lat: '-6.5682',
      lng: '106.6978',
      roomLabel: 'Ruang Server NOC — SMK TI BAZMA',
      uploadedAt: '25 Sep 2025 14:00 WIB',
      inspectorNote: 'Router core aktif dan manajemen bandwidth internet berjalan optimal.',
      conditionStatus: 'Terverifikasi Fisik & Geotagging Dapodik',
    },
  },
  {
    id: 'item-2025-internet-04',
    code: 'RKAS-2025-06.01',
    name: 'Langganan Internet Dedicated Fiber Optik 100 Mbps (TA 2025)',
    unitSummary: '12 Bulan Penuh',
    amount: 21600000,
    category: 'Langganan Daya & Jasa Internet',
    aiCategoryPath: 'Langganan Daya & Jasa > Internet Dedicated',
    date: '05 Januari 2025',
    stage: 'Tahap 1',
    allocation: 'Akses broadband fiber optik 1:1 untuk pembelajaran digital dan praktikum siswa selama 12 bulan',
    iconType: 'projector',
    keywords: ['internet', 'wifi', 'fiber optik', 'langganan internet', 'bandwidth'],
    invoice: {
      number: 'INV/TELCO-2025/01/008',
      vendorName: 'PT Telekomunikasi Data Nusantara Bogor',
      vendorAddress: 'Jl. Pajajaran Raya No. 12, Kota Bogor',
      npwp: '01.233.444.5-403.000',
      date: '05 Januari 2025',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd.',
      lineItems: [
        {
          name: 'Akses Internet Dedicated 100 Mbps (12 Bulan TA 2025)',
          qty: '12 Bulan',
          unitPrice: 1800000,
          subtotal: 21600000,
        },
      ],
    },
    geotag: {
      lat: '-6.5682',
      lng: '106.6978',
      roomLabel: 'NOC / Ruang Jaringan — SMK TI BAZMA',
      uploadedAt: '10 Jan 2025 09:30 WIB',
      inspectorNote: 'Layanan internet dedicated 100 Mbps aktif sepanjang tahun 2025.',
      conditionStatus: 'Terverifikasi Fisik & Geotagging Dapodik',
    },
  },
  {
    id: 'item-2025-sanitasi-05',
    code: 'RKAS-2025-05.08',
    name: 'Perbaikan Saluran Air Bersih & Pompa Asrama Siswa',
    unitSummary: '6 Titik Sanitasi',
    amount: 11200000,
    category: 'Pemeliharaan Sarana Sanitasi & Higienitas',
    aiCategoryPath: 'Pemeliharaan Sanitasi > Pompa & Kamar Mandi',
    date: '20 Mei 2025',
    stage: 'Tahap 1',
    allocation: 'Perbaikan instalasi pipa air bersih dan penggantian pompa air otomatis gedung asrama santri',
    iconType: 'sanitation',
    keywords: ['toilet', 'wc', 'kamar mandi', 'air bersih', 'sanitasi', 'pompa'],
    invoice: {
      number: 'INV/SAN-2025/05/0074',
      vendorName: 'CV Berkah Sanitasi Mandiri',
      vendorAddress: 'Jl. Raya Leuwiliang No. 70, Kab. Bogor',
      npwp: '04.119.502.1-403.000',
      date: '20 Mei 2025',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd.',
      lineItems: [
        {
          name: 'Pompa Air Booster Otomatis & Pemipaan PVC SNI',
          qty: '2 Paket',
          unitPrice: 5600000,
          subtotal: 11200000,
        },
      ],
    },
    geotag: {
      lat: '-6.5681',
      lng: '106.6976',
      roomLabel: 'Gedung Asrama Siswa — SMK TI BAZMA',
      uploadedAt: '22 Mei 2025 15:00 WIB',
      inspectorNote: 'Debit air bersih lancar mengalir ke seluruh kamar mandi asrama.',
      conditionStatus: 'Terverifikasi Fisik & Geotagging Dapodik',
    },
  },
  {
    id: 'item-2025-cat-06',
    code: 'RKAS-2025-05.02',
    name: 'Pengecatan & Pemeliharaan Ruang Kelas Belajar',
    unitSummary: '3 Ruang Kelas',
    amount: 9800000,
    category: 'Pemeliharaan Gedung & Ruang Belajar',
    aiCategoryPath: 'Pemeliharaan Gedung > Pengecatan Ruang Kelas',
    date: '14 Juli 2025',
    stage: 'Tahap 2',
    allocation: 'Pengecatan ulang dinding ruang kelas teori dan lab komputer agar bersih dan nyaman untuk kegiatan belajar',
    iconType: 'paint',
    keywords: ['cat', 'cat kelas', 'pengecatan', 'cat tembok', 'ruang kelas', 'pemeliharaan'],
    invoice: {
      number: 'INV/CAT-2025/07/0033',
      vendorName: 'Toko Cat & Bangunan Ciampea Indah',
      vendorAddress: 'Jl. Raya Ciampea No. 28, Kab. Bogor',
      npwp: '05.212.890.1-403.000',
      date: '14 Juli 2025',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Kom., M.Pd.',
      lineItems: [
        {
          name: 'Cat Tembok Interior Anti-Jamur & Alat Kuas/Roll',
          qty: '12 Pail',
          unitPrice: 816666,
          subtotal: 9800000,
        },
      ],
    },
    geotag: {
      lat: '-6.5683',
      lng: '106.6975',
      roomLabel: 'Ruang Kelas Teori & Lab — SMK TI BAZMA',
      uploadedAt: '17 Jul 2025 13:20 WIB',
      inspectorNote: 'Dinding kelas telah dicat rapi dan bersih.',
      conditionStatus: 'Terverifikasi Fisik & Geotagging Dapodik',
    },
  },
];

export const BAZMA_YEARLY_HISTORY: Record<string, SchoolYearHistory> = {
  '2026': {
    year: '2026',
    isCurrentYear: true,
    totalBosp: 151200000,
    tahap1: {
      amount: 75600000,
      period: 'Jan–Jun',
      status: 'Sudah Cair',
      disbursedDate: '14 Februari 2026',
    },
    tahap2: {
      amount: 75600000,
      period: 'Jul–Des',
      status: 'Belum Cair',
      disbursedDate: 'Menunggu Penyaluran',
    },
    compositions: [
      {
        id: 'comp-1',
        label: 'Peralatan Lab TI & Fasilitas Kelas',
        percentage: 40,
        amount: 60480000,
        color: '#2E6496',
        description: 'Pendingin lab komputer, switch gigabit, proyektor interaktif, dan perbaikan sarana sanitasi asrama 90 siswa.',
      },
      {
        id: 'comp-2',
        label: 'Modul Kejuruan & Praktikum SIJA/RPL',
        percentage: 35,
        amount: 52920000,
        color: '#66A3BF',
        description: 'Pengadaan modul praktikum cloud computing, linux sysadmin, buku kurikulum nasional, dan sertifikasi keahlian siswa.',
      },
      {
        id: 'comp-3',
        label: 'Langganan Internet & Operasional Sekolah',
        percentage: 25,
        amount: 37800000,
        color: '#8CBCCF',
        description: 'Langganan internet dedicated fiber optik 100 Mbps, bahan praktik habis pakai (kabel UTP/konektor), dan administrasi ARKAS.',
      },
    ],
    items: BAZMA_BOSP_ITEMS,
  },
  '2025': {
    year: '2025',
    isCurrentYear: false,
    totalBosp: 144000000,
    tahap1: {
      amount: 72000000,
      period: 'Jan–Jun',
      status: 'Sudah Cair',
      disbursedDate: '18 Februari 2025',
    },
    tahap2: {
      amount: 72000000,
      period: 'Jul–Des',
      status: 'Sudah Cair',
      disbursedDate: '11 Agustus 2025',
    },
    compositions: [
      {
        id: 'comp-2025-1',
        label: 'Pengadaan Komputer & Infrastruktur Lab',
        percentage: 45,
        amount: 64800000,
        color: '#2E6496',
        description: '10 unit workstation PC praktikum, router gateway core mikrotik, dan UPS backup daya lab.',
      },
      {
        id: 'comp-2025-2',
        label: 'Bahan Ajar & Modul Siswa',
        percentage: 30,
        amount: 43200000,
        color: '#66A3BF',
        description: 'Modul kurikulum merdeka kejuruan, buku perpustakaan, dan bahan praktik siswa.',
      },
      {
        id: 'comp-2025-3',
        label: 'Langganan Internet & Pemeliharaan Sarana',
        percentage: 25,
        amount: 36000000,
        color: '#8CBCCF',
        description: 'Internet dedicated 100 Mbps selama 12 bulan, perbaikan pompa sanitasi, dan pengecatan ruang kelas.',
      },
    ],
    items: BAZMA_BOSP_ITEMS_2025,
  },
};

SMK_TI_BAZMA.history = BAZMA_YEARLY_HISTORY;

/**
 * Basis Data Sekolah: Hanya memuat SMK TI BAZMA sesuai instruksi
 * untuk mempermudah juri dalam melihat dan memverifikasi data.
 */
export const SCHOOLS_DATABASE: SchoolData[] = [SMK_TI_BAZMA];

export interface WaScenarioData {
  id: 'scenario-a' | 'scenario-b';
  buttonLabel: string;
  shortTitle: string;
  fileName: string;
  groupName: string;
  timestamp: string;
  statusType: 'danger' | 'safe';
  statusHeader: string;
  ocrQuote: string;
  bospFact: string;
  legalReminder?: string;
  reportCategoryPrefill: string;
  attachmentLabel: string;
  primaryButtonLabel: string;
}

export const WA_SCENARIOS: Record<'scenario-a' | 'scenario-b', WaScenarioData> = {
  'scenario-a': {
    id: 'scenario-a',
    buttonLabel: 'Contoh Screenshot 1: Iuran Kipas & Pendingin Lab SIJA (Tumpang Tindih)',
    shortTitle: 'Skenario A — Tumpang Tindih BOSP',
    fileName: 'Screenshot_Grup_WaliMurid_SMK_BAZMA.jpg',
    groupName: 'Paguyuban Wali Murid SMK TI BAZMA Angkatan X',
    timestamp: 'Hari ini, 08:14 WIB',
    statusType: 'danger',
    statusHeader: 'STATUS AI: TERDETEKSI INDIKASI TUMPANG TINDIH',
    ocrQuote:
      'Assalamualaikum Bapak/Ibu wali santri SMK TI BAZMA, sesuai rapat paguyuban, dimohon transfer iuran kipas angin dan pendingin lab komputer sebesar Rp 50.000/siswa paling lambat Jumat ini ke rek bendahara ya...',
    bospFact:
      'SMK TI BAZMA SUDAH menganggarkan dan mencairkan Rp 14.500.000 pada BOSP Tahap 2 (12 Oktober 2026) untuk pembelian Kipas Angin Dinding & Exhaust Lab Komputer (RKAS-02.04.11).',
    reportCategoryPrefill:
      'Iuran Kipas Angin Lab (Tumpang Tindih dengan Dana BOSP Rp 14.500.000)',
    attachmentLabel: '1 Foto Screenshot WA (Tersensor Otomatis)',
    primaryButtonLabel: 'Kirim Laporan Anonim Sekarang',
  },
  'scenario-b': {
    id: 'scenario-b',
    buttonLabel: 'Contoh Screenshot 2: Kas Acara Outing & Kaos Angkatan (Non-BOSP)',
    shortTitle: 'Skenario B — Tidak Ada di RKAS BOSP',
    fileName: 'Screenshot_Grup_KaosAngkatan.jpg',
    groupName: 'Paguyuban Wali Murid SMK TI BAZMA Angkatan X',
    timestamp: 'Kemarin, 19:20 WIB',
    statusType: 'safe',
    statusHeader: 'STATUS AI: TIDAK ADA DI PENGAJUAN BOSP',
    ocrQuote:
      'Bapak/Ibu wali murid, untuk kaos seragam jalan santai angkatan dan kas santri, ada usulan iuran sukarela Rp 35.000...',
    bospFact:
      'Item ini tidak ditemukan dalam daftar pengajuan anggaran BOSP SMK TI BAZMA tahun berjalan (Tidak tumpang tindih dengan dana BOSP).',
    legalReminder:
      'Pengingat Regulasi: Berdasarkan Permendikbud No. 75 Tahun 2016, kegiatan non-BOSP dilarang bersifat wajib atau mengikat. Jika penarikan ini bersifat memaksa, Anda tetap berhak melaporkannya.',
    reportCategoryPrefill:
      'Laporan Pungutan Mengikat di Luar RKAS (Kaos Angkatan Rp 35.000/siswa)',
    attachmentLabel: '1 Foto Screenshot WA (Tersensor Otomatis)',
    primaryButtonLabel: 'Tetap Laporkan Pungutan Ini',
  },
};

export const KAMUS_BOSP_DATA = {
  allowed: [
    {
      title: 'Peralatan Praktikum Kejuruan & Lab Komputer',
      detail: 'Wajib dibiayai dana BOSP untuk pemeliharaan server, switch gigabit, router mikrotik, kipas pendingin ruang lab, dan meja kursi ergonomis praktikum.',
      ref: 'Juknis BOSP SMK Komponen 02 & 05',
    },
    {
      title: 'Buku Modul Kejuruan & Perpustakaan Digital',
      detail: 'Wajib dibiayai BOSP untuk penyediaan modul ajar cloud computing, jaringan komputer, buku kurikulum nasional tanpa memungut uang buku dari wali murid.',
      ref: 'Permendikbudristek No. 63/2023 Pasal 24',
    },
    {
      title: 'Langganan Internet Dedicated Fiber Optik Sekolah',
      detail: 'Pembayaran langganan internet kecepatan tinggi untuk mendukung praktikum koding, ujian berbasis komputer, dan server pembelajaran daring.',
      ref: 'Juknis BOSP Reguler Komponen 06 & 08',
    },
    {
      title: 'Pemeliharaan Sanitasi & Asrama Satuan Pendidikan',
      detail: 'Perbaikan sarana air bersih, pompa toren, perbaikan kamar mandi dan wastafel cuci tangan untuk kenyamanan siswa belajar.',
      ref: 'Juknis BOSP Reguler Komponen 05',
    },
    {
      title: 'Pelaksanaan Uji Kompetensi Keahlian (UKK)',
      detail: 'Penyelenggaraan ujian kompetensi sertifikasi kejuruan, bahan praktik siswa, dan honorarium asesor eksternal terdaftar.',
      ref: 'Permendikbudristek No. 63/2023 Pasal 39',
    },
  ],
  prohibited: [
    {
      title: 'Memungut Iuran untuk Fasilitas yang Sudah Dibiayai BOSP',
      detail: 'Dilarang keras memungut uang patungan dari wali murid untuk pembelian kipas angin lab, modul buku, switch internet, atau sanitasi yang dananya sudah cair di BOSP.',
      ref: 'Indikasi Pungutan Liar / Tumpang Tindih Anggaran',
    },
    {
      title: 'Pungutan Wajib Berkedok Sumbangan Sukarela',
      detail: 'Komite Sekolah maupun Paguyuban dilarang menarik pungutan yang menentukan nominal tetap dan batas waktu pembayaran yang mengikat bagi siswa.',
      ref: 'Permendikbud No. 75 Tahun 2016 Pasal 10 & 12',
    },
    {
      title: 'Menjual Modul Pembelajaran / LKS Secara Memaksa',
      detail: 'Pendidik dan satuan pendidikan dilarang membebankan biaya pembelian modul wajib atau bahan ajar fotokopi kepada orang tua murid.',
      ref: 'PP No. 17 Tahun 2010 Pasal 181',
    },
    {
      title: 'Menahan Ijazah atau Hak Ujian Siswa',
      detail: 'Sekolah dilarang mengaitkan hak ujian, kelulusan, atau penerimaan rapor siswa dengan kewajiban pelunasan iuran paguyuban komite.',
      ref: 'Standar Pelayanan Minimal Pendidikan Nasional',
    },
  ],
};

export const formatRupiah = (amount: number): string => {
  return 'Rp ' + amount.toLocaleString('id-ID');
};
