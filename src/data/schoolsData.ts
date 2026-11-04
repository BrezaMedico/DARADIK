import { REGION_HIERARCHY } from './indonesiaRegions';
export { REGION_HIERARCHY };

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

export type SchoolOwnershipType = 'Negeri' | 'Swasta';
export type SchoolEducationLevel = 'SMA' | 'SMK';

export interface BudgetComposition {
  id: string;
  label: string;
  percentage: number;
  amount: number;
  color: string;
  description: string;
  regulationRule?: string;
  complianceStatus?: string;
}

export interface SchoolYearHistory {
  year: string;
  isCurrentYear: boolean;
  studentCount?: number;
  perStudentEstimate?: number;
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
  tahap1Compositions?: BudgetComposition[];
  tahap2Compositions?: BudgetComposition[];
  items: BospRealizationItem[];
}

export interface SchoolData {
  id: string;
  name: string;
  npsn: string;
  sampleNisn: string;
  principalName?: string;
  treasurerName?: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  address: string;
  status: string;
  schoolType?: SchoolOwnershipType;
  educationLevel?: SchoolEducationLevel;
  jenjang: SchoolEducationLevel | string;
  maxHonorariumLimit?: number;
  regionCostZone?: string;
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
  tahap1Compositions?: BudgetComposition[];
  tahap2Compositions?: BudgetComposition[];
  items: BospRealizationItem[];
  history?: Record<string, SchoolYearHistory>;
  imageUrl?: string;
}

/**
 * Item Realisasi Pengadaan BOSP Resmi SMK TI BAZMA (90 Siswa)
 * Pagu Anggaran Rp 151.200.000 (Rp 1.680.000 per siswa / tahun)
 */
export const BAZMA_BOSP_ITEMS: BospRealizationItem[] = [
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
      principalName: 'Ahmad Dahlan, S.Ag (Kepala Sekolah)',
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
      principalName: 'Ahmad Dahlan, S.Ag (Kepala Sekolah)',
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
      principalName: 'Ahmad Dahlan, S.Ag (Kepala Sekolah)',
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
      principalName: 'Ahmad Dahlan, S.Ag (Kepala Sekolah)',
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
      principalName: 'Ahmad Dahlan, S.Ag (Kepala Sekolah)',
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
      principalName: 'Ahmad Dahlan, S.Ag (Kepala Sekolah)',
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
      principalName: 'Ahmad Dahlan, S.Ag (Kepala Sekolah)',
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
];

/**
 * Komposisi Global RKAS SMK TI BAZMA (TA 2026) — Sesuai Juknis Permendikdasmen 2026
 * SMK Swasta (Batas Maksimal Honor Guru/Tendik Swasta: 40%, Perpustakaan Min. 10%, Sarpras Maks. 20%)
 */
export const BAZMA_GLOBAL_COMPOSITIONS_2026: BudgetComposition[] = [
  {
    id: 'comp-global-1',
    label: 'Pengembangan Perpustakaan & Buku / Modul Ajar',
    percentage: 15,
    amount: 22680000,
    color: '#2E6496',
    regulationRule: 'Minimal 10%',
    complianceStatus: 'Sesuai Juknis (≥ 10%)',
    description:
      'Pengadaan buku teks utama Kurikulum Nasional, modul praktikum kejuruan SIJA (Cloud & Linux), serta langganan literasi perpustakaan digital 90 siswa.',
  },
  {
    id: 'comp-global-2',
    label: 'Pemeliharaan Sarana dan Prasarana Sekolah',
    percentage: 18,
    amount: 27216000,
    color: '#4B83B1',
    regulationRule: 'Maksimal 20%',
    complianceStatus: 'Sesuai Juknis (≤ 20%)',
    description:
      'Perbaikan sanitasi & air bersih asrama siswa, peremajaan 30 set meja kursi lab komputer, serta pemasangan kipas angin & exhaust fan ruang server.',
  },
  {
    id: 'comp-global-3',
    label: 'Pembayaran Honor Guru & Tendik (Sekolah Swasta)',
    percentage: 32,
    amount: 48384000,
    color: '#66A3BF',
    regulationRule: 'Maksimal 40% (Sekolah Swasta)',
    complianceStatus: 'Sesuai Batas Swasta (≤ 40%)',
    description:
      'Honorarium bulanan guru produktif TI non-ASN dan tenaga kependidikan terdaftar Dapodik sesuai ketentuan maksimal 40% bagi sekolah swasta.',
  },
  {
    id: 'comp-global-4',
    label: 'Komponen Lainnya (Praktikum, Daya & Jasa, Asesmen)',
    percentage: 35,
    amount: 52920000,
    color: '#8CBCCF',
    regulationRule: 'Sesuai kebutuhan dan ketentuan',
    complianceStatus: 'Sesuai RKAS Sekolah',
    description:
      'Langganan internet dedicated fiber optik 100 Mbps (12 bulan), perangkat switch gigabit & proyektor lab, pelaksanaan ANBK/UKK, PPDB bebas pungutan, dan pembinaan ekskul.',
  },
];

export const BAZMA_TAHAP1_COMPOSITIONS_2026: BudgetComposition[] = [
  {
    id: 'comp-t1-1',
    label: 'Pengadaan Buku Teks, Modul Ajar SIJA & Perpustakaan',
    percentage: 25,
    amount: 18900000,
    color: '#2E6496',
    regulationRule: 'Pemenuhan Buku Semester Awal',
    complianceStatus: 'Terealisasi Tahap 1',
    description:
      'Distribusi 90 paket modul ajar kejuruan SIJA dan buku referensi wajib Kurikulum Nasional pada semester awal tanpa pungutan biaya.',
  },
  {
    id: 'comp-t1-2',
    label: 'Pembayaran Honorarium Guru & Tendik Non-ASN (Jan–Jun)',
    percentage: 30,
    amount: 22680000,
    color: '#4B83B1',
    regulationRule: 'Batas Swasta ≤ 40%',
    complianceStatus: 'Terealisasi Tahap 1',
    description:
      'Pembayaran honor guru kejuruan dan tenaga administrasi sekolah swasta selama 6 bulan pertama (Januari s.d. Juni 2026).',
  },
  {
    id: 'comp-t1-3',
    label: 'Langganan Internet Dedicated 100 Mbps & Daya/Jasa',
    percentage: 18,
    amount: 13608000,
    color: '#66A3BF',
    regulationRule: 'Operasional Layanan Wajib',
    complianceStatus: 'Terealisasi Tahap 1',
    description:
      'Pembayaran akses internet dedicated fiber optik 100 Mbps untuk lab komputer, listrik sekolah, dan air bersih semester pertama.',
  },
  {
    id: 'comp-t1-4',
    label: 'Pemeliharaan Sanitasi Asrama & Multimedia Proyektor Lab',
    percentage: 15,
    amount: 11340000,
    color: '#8CBCCF',
    regulationRule: 'Sarpras & Multimedia',
    complianceStatus: 'Terealisasi Tahap 1',
    description:
      'Perbaikan 4 bilik sanitasi, pompa air, 6 wastafel cuci tangan asrama, serta instalasi proyektor interaktif Lab SIJA 1 & 2.',
  },
  {
    id: 'comp-t1-5',
    label: 'Pelaksanaan PPDB/SPMB Bebas Pungutan & Kegiatan Ekskul',
    percentage: 12,
    amount: 9072000,
    color: '#A7D0DC',
    regulationRule: 'Wajib Gratis Tanpa Pungutan',
    complianceStatus: 'Terealisasi Tahap 1',
    description:
      'Seleksi penerimaan siswa baru berasrama tanpa biaya pendaftaran, bahan habis pakai praktikum, dan kegiatan kesiswaan semester 1.',
  },
];

export const BAZMA_TAHAP2_COMPOSITIONS_2026: BudgetComposition[] = [
  {
    id: 'comp-t2-1',
    label: 'Pembayaran Honorarium Guru & Tendik Non-ASN (Jul–Des)',
    percentage: 34,
    amount: 25704000,
    color: '#2E6496',
    regulationRule: 'Batas Swasta ≤ 40%',
    complianceStatus: 'Terealisasi Tahap 2',
    description:
      'Pembayaran honorarium guru produktif TI dan tenaga kependidikan semester akhir (Juli s.d. Desember 2026).',
  },
  {
    id: 'comp-t2-2',
    label: 'Perangkat Praktikum Jaringan, ANBK & Uji Kompetensi (UKK)',
    percentage: 22,
    amount: 16632000,
    color: '#4B83B1',
    regulationRule: 'Asesmen & Praktik Kejuruan',
    complianceStatus: 'Terealisasi Tahap 2',
    description:
      'Pengadaan 3 unit Managed Switch Gigabit 24-Port, 4 Access Point WiFi-6, serta penyelenggaraan ANBK dan Uji Kompetensi Keahlian.',
  },
  {
    id: 'comp-t2-3',
    label: 'Pemeliharaan Meubelair Lab & Pendingin Ruangan Server',
    percentage: 21,
    amount: 15876000,
    color: '#66A3BF',
    regulationRule: 'Pemeliharaan Sarpras ≤ 20% Tahunan',
    complianceStatus: 'Terealisasi Tahap 2',
    description:
      'Pengadaan 30 set meja kursi komputer ergonomis serta pemasangan 12 unit kipas angin dinding & exhaust fan di Lab SIJA.',
  },
  {
    id: 'comp-t2-4',
    label: 'Langganan Internet Fiber Optik & Daya/Jasa Semester 2',
    percentage: 14,
    amount: 10584000,
    color: '#8CBCCF',
    regulationRule: 'Operasional Layanan Wajib',
    complianceStatus: 'Terealisasi Tahap 2',
    description:
      'Pembayaran tagihan internet dedicated fiber optik 100 Mbps dan langganan daya listrik selama Juli s.d. Desember 2026.',
  },
  {
    id: 'comp-t2-5',
    label: 'Pengembangan Profesi Guru (GTK), Buku & Ekstrakurikuler',
    percentage: 9,
    amount: 6804000,
    color: '#A7D0DC',
    regulationRule: 'Peningkatan Mutu & Literasi',
    complianceStatus: 'Terealisasi Tahap 2',
    description:
      'Penambahan referensi buku perpustakaan semester ganjil, pelatihan kompetensi guru kejuruan, dan pembinaan lomba koding siswa.',
  },
];

/**
 * Data Utama SMK TI BAZMA (90 Siswa × Rp 1.680.000 = Rp 151.200.000)
 */
export const SMK_TI_BAZMA: SchoolData = {
  id: 'smk-ti-bazma',
  name: 'SMK TI BAZMA',
  npsn: '70029710',
  sampleNisn: '0081928491',
  principalName: 'Ahmad Dahlan, S.Ag',
  treasurerName: 'Rina Marlina, S.E.',
  provinsi: 'Jawa Barat',
  kabupaten: 'Kab. Bogor',
  kecamatan: 'Ciampea',
  address: 'Kp. Cicadas RT. 001/001, Desa Cicadas, Kec. Ciampea, Kab. Bogor, Jawa Barat',
  status: 'Terdaftar Aktif di Kemendikdasmen',
  schoolType: 'Swasta',
  educationLevel: 'SMK',
  jenjang: 'SMK',
  maxHonorariumLimit: 40,
  regionCostZone: 'Indeks Kemahalan Wilayah Kab. Bogor, Jawa Barat (SMK)',
  studentCount: 90,
  perStudentEstimate: 1680000,
  totalBosp: 151200000,
  imageUrl: '/smk-ti-bazma.jpg',
  tahap1: {
    amount: 75600000,
    period: 'Jan–Jun',
    status: 'Sudah Cair',
    disbursedDate: '16 Februari 2026',
  },
  tahap2: {
    amount: 75600000,
    period: 'Jul–Des',
    status: 'Sudah Cair',
    disbursedDate: '14 Agustus 2026',
  },
  compositions: BAZMA_GLOBAL_COMPOSITIONS_2026,
  tahap1Compositions: BAZMA_TAHAP1_COMPOSITIONS_2026,
  tahap2Compositions: BAZMA_TAHAP2_COMPOSITIONS_2026,
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
      principalName: 'Ahmad Dahlan, S.Ag',
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
      principalName: 'Ahmad Dahlan, S.Ag',
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
      principalName: 'Ahmad Dahlan, S.Ag',
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
      principalName: 'Ahmad Dahlan, S.Ag',
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
      principalName: 'Ahmad Dahlan, S.Ag',
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
      principalName: 'Ahmad Dahlan, S.Ag',
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
    studentCount: 90,
    perStudentEstimate: 1680000,
    totalBosp: 151200000,
    tahap1: {
      amount: 75600000,
      period: 'Jan–Jun',
      status: 'Sudah Cair',
      disbursedDate: '16 Februari 2026',
    },
    tahap2: {
      amount: 75600000,
      period: 'Jul–Des',
      status: 'Sudah Cair',
      disbursedDate: '14 Agustus 2026',
    },
    compositions: BAZMA_GLOBAL_COMPOSITIONS_2026,
    tahap1Compositions: BAZMA_TAHAP1_COMPOSITIONS_2026,
    tahap2Compositions: BAZMA_TAHAP2_COMPOSITIONS_2026,
    items: BAZMA_BOSP_ITEMS,
  },
  '2025': {
    year: '2025',
    isCurrentYear: false,
    studentCount: 90,
    perStudentEstimate: 1600000,
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
        label: 'Pengembangan Perpustakaan & Buku / Modul Ajar',
        percentage: 15,
        amount: 21600000,
        color: '#2E6496',
        regulationRule: 'Minimal 10%',
        complianceStatus: 'Sesuai Juknis (≥ 10%)',
        description: 'Modul kurikulum merdeka kejuruan, buku perpustakaan, dan bahan praktik siswa.',
      },
      {
        id: 'comp-2025-2',
        label: 'Pemeliharaan Sarana dan Prasarana Sekolah',
        percentage: 18,
        amount: 25920000,
        color: '#4B83B1',
        regulationRule: 'Maksimal 20%',
        complianceStatus: 'Sesuai Juknis (≤ 20%)',
        description: 'Perbaikan pompa sanitasi asrama, pengecatan 3 ruang kelas, dan pemeliharaan jaringan.',
      },
      {
        id: 'comp-2025-3',
        label: 'Pembayaran Honor Guru & Tendik (Sekolah Swasta)',
        percentage: 32,
        amount: 46080000,
        color: '#66A3BF',
        regulationRule: 'Maksimal 40% (Sekolah Swasta)',
        complianceStatus: 'Sesuai Batas Swasta (≤ 40%)',
        description: 'Pembayaran honorarium guru produktif TI non-ASN dan tenaga kependidikan.',
      },
      {
        id: 'comp-2025-4',
        label: 'Komponen Lainnya (Workstation Lab, Daya & Jasa)',
        percentage: 35,
        amount: 50400000,
        color: '#8CBCCF',
        regulationRule: 'Sesuai kebutuhan dan ketentuan',
        complianceStatus: 'Sesuai RKAS Sekolah',
        description: '10 unit workstation PC praktikum, router core mikrotik, dan internet dedicated 100 Mbps selama 12 bulan.',
      },
    ],
    items: BAZMA_BOSP_ITEMS_2025,
  },
};

SMK_TI_BAZMA.history = BAZMA_YEARLY_HISTORY;

const PRINCIPAL_FIRST_NAMES = [
  'Drs. H. Bambang',
  'Hj. Siti',
  'Dr. Hendra',
  'Ir. Agus',
  'Dra. Ratna',
  'H. Dedi',
  'Hj. Nurhayati',
  'Dr. Wahyu',
  'Drs. Mulyadi',
  'Hj. Sri',
  'H. Ridwan',
  'Dr. Eko',
  'Dra. Yuniarti',
  'Ir. Lukman',
  'Drs. Supriyanto',
  'Hj. Dewi',
  'Dr. Asep',
  'H. Taufik',
  'Dra. Rina',
  'Drs. Kurniawan',
  'Hj. Rahmawati',
  'Dr. Fajar',
  'Ir. Syamsul',
  'Dra. Endang',
];

const PRINCIPAL_LAST_NAMES = [
  'Sutrisno, M.Pd.',
  'Aminah, S.Pd., M.M.',
  'Wijaya, M.Pd.',
  'Salim, S.Kom., M.T.',
  'Sari Dewi, M.Pd.',
  'Kusnadi, S.Pd., M.Si.',
  'Pratama, M.Pd.',
  'Santoso, S.Pd., M.M.',
  'Hidayat, M.Pd.',
  'Wahyuni, S.Pd., M.Pd.',
  'Hakim, S.T., M.Pd.',
  'Nugroho, M.Pd.',
  'Lestari, S.Pd., M.M.',
  'Firmansyah, M.Pd.',
  'Setiawan, S.Pd., M.Si.',
  'Handayani, M.Pd.',
  'Maulana, S.Kom., M.Pd.',
  'Ramadhan, M.Pd.',
  'Kartika, S.Pd., M.M.',
];

const TREASURER_NAMES = [
  'Nadia Putri, S.E.',
  'Hendra Gunawan, S.Ak.',
  'Fitriani Rahayu, S.E.',
  'Budi Hartono, S.E.',
  'Maya Sari, S.Ak.',
  'Rizky Pratama, S.E.',
  'Desi Ratnasari, S.E.',
  'Andi Saputra, S.Ak.',
  'Lina Herlina, S.E.',
  'Yudi Kurnia, S.E.',
  'Sari Puspita, S.Ak.',
  'Dian Permata, S.E.',
];

const SWASTA_FOUNDATION_NAMES = [
  'Muhammadiyah',
  'Ma\'arif NU',
  'Bina Nusantara',
  'Terpadu Al-Azhar',
  'Karya Bakti',
  'Harapan Bangsa',
  'Cendekia Mandiri',
  'Tunas Karya',
  'Bhakti Pertiwi',
  'Pasundan',
  'PGRI',
  'Taman Siswa',
];

/**
 * Menghitung Satuan Biaya BOSP Reguler Majemuk per Siswa / Tahun (TA 2026)
 * Disesuaikan secara realistis berdasarkan Provinsi, Kabupaten/Kota (Indeks Kemahalan Wilayah),
 * serta Jenjang Satuan Pendidikan (SMA vs SMK) sesuai Kepmendikdasmen.
 */
export function computeRegionalBospUnitCost(
  provinsi: string,
  kabupaten: string,
  level: SchoolEducationLevel
): { perStudentRate: number; zoneLabel: string } {
  if (kabupaten === 'Kab. Bogor' && level === 'SMK') {
    return {
      perStudentRate: 1680000,
      zoneLabel: `Indeks Kemahalan Wilayah ${kabupaten}, ${provinsi} (${level})`,
    };
  }

  let kabHash = 0;
  for (let i = 0; i < kabupaten.length; i++) {
    kabHash = (kabHash * 31 + kabupaten.charCodeAt(i)) % 1000;
  }

  const isKepulauanOrRemote =
    /Kepulauan|Natuna|Anambas|Mentawai|Nias|Simeulue|Sangihe|Talaud|Sitaro|Rote|Sabu|Sumba|Alor|Lembata|Maluku|Aru|Tanimbar|Buru|Seram|Halmahera|Sula|Morotai|Taliabu|Raja Ampat|Biak|Yapen|Waropen|Supiori|Mamberamo|Pegunungan|Puncak|Intan Jaya|Nduga|Yahukimo|Asmat|Boven Digoel|Mappi|Merauke/i.test(
      kabupaten
    );

  const isJavaBali =
    /Jawa|Banten|Jakarta|Yogyakarta|Bali/i.test(provinsi);
  const isSumatra =
    /Aceh|Sumatera|Riau|Jambi|Bengkulu|Lampung|Bangka Belitung/i.test(provinsi);
  const isKalimantanSulawesiNtb =
    /Kalimantan|Sulawesi|Gorontalo|Nusa Tenggara Barat/i.test(provinsi);
  const isNttMaluku =
    /Nusa Tenggara Timur|Maluku/i.test(provinsi);
  const isPapua = /Papua/i.test(provinsi);

  let baseSma = 1550000;
  let baseSmk = 1660000;

  if (isPapua) {
    baseSma = 2180000 + (kabHash % 6) * 50000;
    baseSmk = 2360000 + (kabHash % 6) * 50000;
  } else if (isNttMaluku) {
    baseSma = 1920000 + (kabHash % 6) * 40000;
    baseSmk = 2100000 + (kabHash % 6) * 40000;
  } else if (isKalimantanSulawesiNtb) {
    baseSma = 1720000 + (kabHash % 6) * 30000;
    baseSmk = 1880000 + (kabHash % 6) * 30000;
  } else if (isSumatra) {
    baseSma = 1620000 + (kabHash % 6) * 30000;
    baseSmk = 1780000 + (kabHash % 6) * 30000;
  } else if (isJavaBali) {
    baseSma = 1510000 + (kabHash % 6) * 20000;
    baseSmk = 1620000 + (kabHash % 6) * 20000;
  }

  if (isKepulauanOrRemote && !isPapua) {
    baseSma += 140000;
    baseSmk += 160000;
  }

  const perStudentRate = level === 'SMK' ? baseSmk : baseSma;
  return {
    perStudentRate,
    zoneLabel: `Satuan Biaya BOSP ${kabupaten}, ${provinsi} (${level})`,
  };
}

/**
 * Menghasilkan 3 Tab Komposisi Penggunaan Dana (Global, Tahap 1, Tahap 2)
 * yang patuh terhadap Permendikdasmen 2026 dan berbeda sesuai Negeri/Swasta, SMA/SMK, dan Daerah.
 */
export function buildSchoolCompositions(
  totalBosp: number,
  tahap1Amount: number,
  tahap2Amount: number,
  schoolType: SchoolOwnershipType,
  educationLevel: SchoolEducationLevel,
  kabupaten: string,
  seq: number
): {
  globalCompositions: BudgetComposition[];
  tahap1Compositions: BudgetComposition[];
  tahap2Compositions: BudgetComposition[];
} {
  // 1. GLOBAL (1 Tahun) — Sesuai Juknis Permendikdasmen 2026:
  // - Pengembangan perpustakaan / buku: Minimal 10% (kita alokasikan 12% s.d. 18%)
  // - Pemeliharaan sarana dan prasarana: Maksimal 20% (kita alokasikan 13% s.d. 19%)
  // - Pembayaran honor sekolah negeri: Maksimal 20% (kita alokasikan 12% s.d. 19%)
  // - Pembayaran honor sekolah swasta: Maksimal 40% (kita alokasikan 26% s.d. 37%)
  // - Komponen lainnya: Sisa persentase (Sesuai kebutuhan dan ketentuan)
  const perpustakaanPct = 12 + (seq % 7); // 12% - 18% (≥ 10%)
  const sarprasPct = 13 + ((seq * 3) % 7); // 13% - 19% (≤ 20%)
  const honorPct =
    schoolType === 'Swasta'
      ? 26 + ((seq * 5) % 12) // 26% - 37% (≤ 40%)
      : 12 + ((seq * 5) % 8); // 12% - 19% (≤ 20%)
  const lainnyaPct = 100 - perpustakaanPct - sarprasPct - honorPct;

  const amtPerpus = Math.round((totalBosp * perpustakaanPct) / 100);
  const amtSarpras = Math.round((totalBosp * sarprasPct) / 100);
  const amtHonor = Math.round((totalBosp * honorPct) / 100);
  const amtLainnya = totalBosp - amtPerpus - amtSarpras - amtHonor;

  const labOrClassDesc =
    educationLevel === 'SMK'
      ? 'laboratorium praktik kejuruan, bengkel kerja,'
      : 'laboratorium IPA/komputer, ruang multimedia,';

  const globalCompositions: BudgetComposition[] = [
    {
      id: `global-perpus-${seq}`,
      label: 'Pengembangan Perpustakaan & Buku Ajar',
      percentage: perpustakaanPct,
      amount: amtPerpus,
      color: '#2E6496',
      regulationRule: 'Minimal 10%',
      complianceStatus: `Sesuai Juknis (${perpustakaanPct}% ≥ 10%)`,
      description: `Pengadaan buku teks utama Kurikulum Nasional, buku pengayaan, modul pembelajaran ${educationLevel}, dan layanan literasi perpustakaan di ${kabupaten}.`,
    },
    {
      id: `global-sarpras-${seq}`,
      label: 'Pemeliharaan Sarana dan Prasarana Sekolah',
      percentage: sarprasPct,
      amount: amtSarpras,
      color: '#4B83B1',
      regulationRule: 'Maksimal 20%',
      complianceStatus: `Sesuai Juknis (${sarprasPct}% ≤ 20%)`,
      description: `Pemeliharaan ringan ruang kelas, perbaikan sanitasi/toilet siswa, meubelair meja kursi, serta ${labOrClassDesc} satuan pendidikan.`,
    },
    {
      id: `global-honor-${seq}`,
      label:
        schoolType === 'Swasta'
          ? 'Pembayaran Honor Guru & Tendik (Sekolah Swasta)'
          : 'Pembayaran Honor Guru & Tendik (Sekolah Negeri)',
      percentage: honorPct,
      amount: amtHonor,
      color: '#66A3BF',
      regulationRule:
        schoolType === 'Swasta'
          ? 'Maksimal 40% (Sekolah Swasta)'
          : 'Maksimal 20% (Sekolah Negeri)',
      complianceStatus:
        schoolType === 'Swasta'
          ? `Sesuai Batas Swasta (${honorPct}% ≤ 40%)`
          : `Sesuai Batas Negeri (${honorPct}% ≤ 20%)`,
      description:
        schoolType === 'Swasta'
          ? 'Pembayaran honorarium bulanan guru non-ASN dan tenaga kependidikan terdaftar Dapodik sesuai plafon maksimal 40% bagi sekolah swasta.'
          : 'Pembayaran honorarium guru non-ASN dan tenaga administrasi terdaftar Dapodik sesuai plafon maksimal 20% bagi sekolah negeri.',
    },
    {
      id: `global-lainnya-${seq}`,
      label:
        educationLevel === 'SMK'
          ? 'Komponen Lainnya (Praktikum Kejuruan, Daya & Jasa, Asesmen)'
          : 'Komponen Lainnya (Kegiatan Pembelajaran, Daya & Jasa, Asesmen)',
      percentage: lainnyaPct,
      amount: amtLainnya,
      color: '#8CBCCF',
      regulationRule: 'Sesuai kebutuhan dan ketentuan',
      complianceStatus: 'Sesuai RKAS Sekolah',
      description: `Pelaksanaan kegiatan pembelajaran & ekstrakurikuler, asesmen nasional (ANBK) & evaluasi, langganan listrik/air/internet sekolah, PPDB/SPMB bebas pungutan, dan pengembangan profesi guru.`,
    },
  ];

  // 2. TAHAP 1 (Jan–Jun, 50% Pagu)
  const t1PerpusPct = Math.min(30, perpustakaanPct + 7 + (seq % 4));
  const t1HonorPct = honorPct;
  const t1DayaJasaPct = 15 + (seq % 5);
  const t1PpdbPembelajaranPct = 12 + ((seq * 2) % 5);
  const t1SarprasPct = Math.max(
    8,
    100 - t1PerpusPct - t1HonorPct - t1DayaJasaPct - t1PpdbPembelajaranPct
  );

  const t1Amt1 = Math.round((tahap1Amount * t1PerpusPct) / 100);
  const t1Amt2 = Math.round((tahap1Amount * t1HonorPct) / 100);
  const t1Amt3 = Math.round((tahap1Amount * t1DayaJasaPct) / 100);
  const t1Amt4 = Math.round((tahap1Amount * t1PpdbPembelajaranPct) / 100);
  const t1Amt5 = tahap1Amount - t1Amt1 - t1Amt2 - t1Amt3 - t1Amt4;

  const tahap1Compositions: BudgetComposition[] = [
    {
      id: `t1-buku-${seq}`,
      label: 'Pengadaan Buku Teks Utama, Modul Ajar & Perpustakaan',
      percentage: t1PerpusPct,
      amount: t1Amt1,
      color: '#2E6496',
      regulationRule: 'Fokus Buku Semester Awal',
      complianceStatus: 'Terealisasi Tahap 1',
      description: `Pemenuhan buku paket siswa, modul pembelajaran ${educationLevel}, dan koleksi perpustakaan pada semester awal (Januari–Juni).`,
    },
    {
      id: `t1-honor-${seq}`,
      label: `Pembayaran Honorarium Guru & Tendik (Jan–Jun)`,
      percentage: t1HonorPct,
      amount: t1Amt2,
      color: '#4B83B1',
      regulationRule:
        schoolType === 'Swasta' ? 'Batas Swasta ≤ 40%' : 'Batas Negeri ≤ 20%',
      complianceStatus: 'Terealisasi Tahap 1',
      description: `Pembayaran honor bulanan pendidik dan tenaga kependidikan selama 6 bulan pertama pada sekolah ${schoolType.toLowerCase()}.`,
    },
    {
      id: `t1-daya-${seq}`,
      label: 'Langganan Listrik, Air Bersih & Internet Pembelajaran',
      percentage: t1DayaJasaPct,
      amount: t1Amt3,
      color: '#66A3BF',
      regulationRule: 'Layanan Daya & Jasa',
      complianceStatus: 'Terealisasi Tahap 1',
      description: `Pembayaran tagihan listrik, air bersih, dan langganan bandwidth internet sekolah wilayah ${kabupaten} selama Januari–Juni.`,
    },
    {
      id: `t1-ppdb-${seq}`,
      label: 'Pelaksanaan PPDB/SPMB Gratis & Kegiatan Ekstrakurikuler',
      percentage: t1PpdbPembelajaranPct,
      amount: t1Amt4,
      color: '#8CBCCF',
      regulationRule: 'Wajib Bebas Pungutan',
      complianceStatus: 'Terealisasi Tahap 1',
      description: `Pembiayaan penuh panitia PPDB/SPMB tanpa memungut biaya dari calon peserta didik baru serta pembinaan ekstrakurikuler semester genap.`,
    },
    {
      id: `t1-sarpras-${seq}`,
      label: 'Pemeliharaan Sanitasi Sekolah & Multimedia Kelas',
      percentage: t1SarprasPct,
      amount: t1Amt5,
      color: '#A7D0DC',
      regulationRule: 'Pemeliharaan Sarpras',
      complianceStatus: 'Terealisasi Tahap 1',
      description: `Perbaikan fasilitas toilet/wastafel siswa, pengadaan proyektor kelas, serta alat tulis administrasi kegiatan sekolah.`,
    },
  ];

  // 3. TAHAP 2 (Jul–Des, 50% Pagu)
  const t2HonorPct = honorPct;
  const t2AsesmenPraktikPct =
    educationLevel === 'SMK' ? 23 + (seq % 5) : 20 + (seq % 5);
  const t2SarprasPct = Math.min(24, sarprasPct + 3);
  const t2DayaJasaPct = 13 + (seq % 4);
  const t2ProfesiGtkPct = Math.max(
    7,
    100 - t2HonorPct - t2AsesmenPraktikPct - t2SarprasPct - t2DayaJasaPct
  );

  const t2Amt1 = Math.round((tahap2Amount * t2HonorPct) / 100);
  const t2Amt2 = Math.round((tahap2Amount * t2AsesmenPraktikPct) / 100);
  const t2Amt3 = Math.round((tahap2Amount * t2SarprasPct) / 100);
  const t2Amt4 = Math.round((tahap2Amount * t2DayaJasaPct) / 100);
  const t2Amt5 = tahap2Amount - t2Amt1 - t2Amt2 - t2Amt3 - t2Amt4;

  const tahap2Compositions: BudgetComposition[] = [
    {
      id: `t2-honor-${seq}`,
      label: 'Pembayaran Honorarium Guru & Tendik (Jul–Des)',
      percentage: t2HonorPct,
      amount: t2Amt1,
      color: '#2E6496',
      regulationRule:
        schoolType === 'Swasta' ? 'Batas Swasta ≤ 40%' : 'Batas Negeri ≤ 20%',
      complianceStatus: 'Terealisasi Tahap 2',
      description: `Pembayaran honorarium guru dan tenaga kependidikan semester akhir (Juli–Desember) sesuai ketentuan sekolah ${schoolType.toLowerCase()}.`,
    },
    {
      id: `t2-asesmen-${seq}`,
      label:
        educationLevel === 'SMK'
          ? 'Praktikum Kejuruan, ANBK & Uji Kompetensi (UKK)'
          : 'Pelaksanaan ANBK, Evaluasi Ujian & Praktikum Lab',
      percentage: t2AsesmenPraktikPct,
      amount: t2Amt2,
      color: '#4B83B1',
      regulationRule: 'Asesmen & Pembelajaran',
      complianceStatus: 'Terealisasi Tahap 2',
      description:
        educationLevel === 'SMK'
          ? 'Bahan praktik kejuruan siswa, pemeliharaan alat bengkel/lab, pelaksanaan Asesmen Nasional (ANBK), dan Uji Kompetensi Keahlian.'
          : 'Penyelenggaraan Asesmen Nasional Berbasis Komputer (ANBK), ujian akhir semester, cetak rapor, dan bahan praktikum laboratorium IPA/komputer.',
    },
    {
      id: `t2-sarpras-${seq}`,
      label: 'Pemeliharaan Ruang Kelas, Meubelair & Ventilasi',
      percentage: t2SarprasPct,
      amount: t2Amt3,
      color: '#66A3BF',
      regulationRule: 'Sarpras ≤ 20% Tahunan',
      complianceStatus: 'Terealisasi Tahap 2',
      description: `Penggantian meja kursi belajar yang rusak, pengecatan ringan ruang kelas, serta pemasangan kipas angin/ventilasi ruangan.`,
    },
    {
      id: `t2-daya-${seq}`,
      label: 'Langganan Daya, Internet & Administrasi Semester 2',
      percentage: t2DayaJasaPct,
      amount: t2Amt4,
      color: '#8CBCCF',
      regulationRule: 'Layanan Daya & Jasa',
      complianceStatus: 'Terealisasi Tahap 2',
      description: `Pembayaran tagihan listrik, air, langganan internet sekolah, dan pelaporan buku kas umum ARKAS semester kedua.`,
    },
    {
      id: `t2-gtk-${seq}`,
      label: 'Pengembangan Profesi Guru (GTK) & Literasi Buku',
      percentage: t2ProfesiGtkPct,
      amount: t2Amt5,
      color: '#A7D0DC',
      regulationRule: 'Mutu Guru & Literasi',
      complianceStatus: 'Terealisasi Tahap 2',
      description: `Pelatihan kompetensi guru, kegiatan komunitas belajar, penambahan referensi perpustakaan, dan lomba akademik siswa.`,
    },
  ];

  return {
    globalCompositions,
    tahap1Compositions,
    tahap2Compositions,
  };
}

export function customizeBospItemsForSchool(
  baseItems: BospRealizationItem[],
  schoolName: string,
  principalName: string,
  treasurerName: string,
  scaleFactor = 1,
  educationLevel: SchoolEducationLevel = 'SMK',
  kabupaten = 'Kab. Bogor'
): BospRealizationItem[] {
  if (schoolName === 'SMK TI BAZMA') return baseItems;
  return baseItems.map((item) => {
    const scaledAmount =
      scaleFactor === 1
        ? item.amount
        : Math.max(2500000, Math.round((item.amount * scaleFactor) / 100000) * 100000);

    const adaptedName =
      educationLevel === 'SMA'
        ? item.name
            .replace(/Lab SIJA/g, 'Lab Komputer & IPA')
            .replace(/Kejuruan SIJA/g, 'Kurikulum Merdeka SMA')
            .replace(/Asrama/g, 'Sekolah')
        : item.name.replace(/Asrama/g, 'Sekolah');

    const adaptedAllocation = item.allocation
      .replace(/SMK TI BAZMA/g, schoolName)
      .replace(/Lab SIJA 1 dan Lab SIJA 2/g, educationLevel === 'SMA' ? 'Lab Komputer dan Lab IPA' : 'Lab Praktik 1 dan Lab Praktik 2')
      .replace(/Sistem Informatika Jaringan & Aplikasi \(SIJA\)/g, educationLevel === 'SMA' ? 'Mata Pelajaran Wajib & Peminatan SMA' : 'Kompetensi Keahlian Kejuruan');

    const adaptedLineItems = item.invoice.lineItems.map((li, idx, arr) => {
      if (scaleFactor === 1) return li;
      const ratio = li.subtotal / item.amount;
      const newSub =
        idx === arr.length - 1
          ? scaledAmount -
            arr
              .slice(0, -1)
              .reduce((acc, cur) => acc + Math.round((scaledAmount * (cur.subtotal / item.amount)) / 10000) * 10000, 0)
          : Math.round((scaledAmount * ratio) / 10000) * 10000;
      return {
        ...li,
        name:
          educationLevel === 'SMA'
            ? li.name.replace(/Kejuruan SIJA/g, 'SMA Kurikulum Nasional')
            : li.name,
        subtotal: newSub,
      };
    });

    return {
      ...item,
      name: adaptedName,
      amount: scaledAmount,
      allocation: adaptedAllocation,
      invoice: {
        ...item.invoice,
        vendorAddress: `${kabupaten}`,
        principalName,
        treasurerName,
        lineItems: adaptedLineItems,
      },
      geotag: {
        ...item.geotag,
        roomLabel: item.geotag.roomLabel
          .replace(/SMK TI BAZMA/g, schoolName)
          .replace(/Lab SIJA/g, educationLevel === 'SMA' ? 'Lab Komputer' : 'Lab Kejuruan')
          .replace(/Gedung Asrama Siswa/g, 'Gedung Utama Siswa'),
        conditionStatus: item.geotag.conditionStatus.replace(
          /SMK TI BAZMA/g,
          schoolName
        ),
      },
    };
  });
}

export function buildSchoolYearlyHistory(
  schoolName: string,
  principalName: string,
  treasurerName: string,
  options?: {
    studentCount?: number;
    perStudentEstimate?: number;
    totalBosp?: number;
    schoolType?: SchoolOwnershipType;
    educationLevel?: SchoolEducationLevel;
    kabupaten?: string;
    seq?: number;
  }
): Record<string, SchoolYearHistory> {
  if (schoolName === 'SMK TI BAZMA') return BAZMA_YEARLY_HISTORY;

  const studentCount = options?.studentCount || 360;
  const perStudentEstimate = options?.perStudentEstimate || 1680000;
  const totalBosp = options?.totalBosp || studentCount * perStudentEstimate;
  const tahap1Amount = Math.round(totalBosp * 0.5);
  const tahap2Amount = totalBosp - tahap1Amount;
  const schoolType = options?.schoolType || 'Negeri';
  const educationLevel = options?.educationLevel || 'SMA';
  const kabupaten = options?.kabupaten || 'Kab. Bogor';
  const seq = options?.seq || 1;

  const scaleFactor = totalBosp / SMK_TI_BAZMA.totalBosp;
  const { globalCompositions, tahap1Compositions, tahap2Compositions } =
    buildSchoolCompositions(
      totalBosp,
      tahap1Amount,
      tahap2Amount,
      schoolType,
      educationLevel,
      kabupaten,
      seq
    );

  const prevPerStudent = Math.max(1450000, perStudentEstimate - 60000);
  const prevTotalBosp = studentCount * prevPerStudent;
  const prevTahap1 = Math.round(prevTotalBosp * 0.5);
  const prevTahap2 = prevTotalBosp - prevTahap1;
  const prevComp = buildSchoolCompositions(
    prevTotalBosp,
    prevTahap1,
    prevTahap2,
    schoolType,
    educationLevel,
    kabupaten,
    seq + 3
  );

  return {
    '2026': {
      year: '2026',
      isCurrentYear: true,
      studentCount,
      perStudentEstimate,
      totalBosp,
      tahap1: {
        amount: tahap1Amount,
        period: 'Jan–Jun',
        status: 'Sudah Cair',
        disbursedDate: `${10 + (seq % 12)} Februari 2026`,
      },
      tahap2: {
        amount: tahap2Amount,
        period: 'Jul–Des',
        status: 'Sudah Cair',
        disbursedDate: `${11 + (seq % 14)} Agustus 2026`,
      },
      compositions: globalCompositions,
      tahap1Compositions,
      tahap2Compositions,
      items: customizeBospItemsForSchool(
        BAZMA_BOSP_ITEMS,
        schoolName,
        principalName,
        treasurerName,
        scaleFactor,
        educationLevel,
        kabupaten
      ),
    },
    '2025': {
      year: '2025',
      isCurrentYear: false,
      studentCount,
      perStudentEstimate: prevPerStudent,
      totalBosp: prevTotalBosp,
      tahap1: {
        amount: prevTahap1,
        period: 'Jan–Jun',
        status: 'Sudah Cair',
        disbursedDate: '18 Februari 2025',
      },
      tahap2: {
        amount: prevTahap2,
        period: 'Jul–Des',
        status: 'Sudah Cair',
        disbursedDate: '11 Agustus 2025',
      },
      compositions: prevComp.globalCompositions,
      tahap1Compositions: prevComp.tahap1Compositions,
      tahap2Compositions: prevComp.tahap2Compositions,
      items: customizeBospItemsForSchool(
        BAZMA_BOSP_ITEMS_2025,
        schoolName,
        principalName,
        treasurerName,
        prevTotalBosp / 144000000,
        educationLevel,
        kabupaten
      ),
    },
  };
}

/**
 * Membangun daftar sekolah terstruktur untuk seluruh Provinsi, Kabupaten/Kota, dan Kecamatan.
 * - Setiap kecamatan memiliki sekolah Negeri (SMKN 1 & SMAN 1) serta sekolah Swasta (SMKS / SMAS).
 * - Besaran dana BOSP per siswa disesuaikan dengan daerah (Indeks Kemahalan Wilayah Kab/Kota & Provinsi) dan jenjang (SMA/SMK).
 * - Jumlah siswa tiap sekolah berbeda-beda, dan Total BOSP 1 Tahun = Jumlah Siswa × Dana per Siswa.
 * - Komposisi Global, Tahap 1, dan Tahap 2 menyesuaikan jenis sekolah (Negeri maks. 20% honor, Swasta maks. 40% honor).
 */
function buildStructuredSchoolsDatabase(): SchoolData[] {
  const schools: SchoolData[] = [SMK_TI_BAZMA];
  let seq = 1;

  for (const [provinsi, kabMap] of Object.entries(REGION_HIERARCHY)) {
    for (const [kabupaten, kecamatanList] of Object.entries(kabMap)) {
      for (const kecamatan of kecamatanList) {
        const foundationName =
          SWASTA_FOUNDATION_NAMES[seq % SWASTA_FOUNDATION_NAMES.length];
        const swastaIsSmk = seq % 2 === 0;

        const schoolTemplates: {
          prefix: string;
          schoolName: string;
          street: string;
          schoolType: SchoolOwnershipType;
          educationLevel: SchoolEducationLevel;
          studentCount: number;
        }[] = [
          {
            prefix: 'SMKN 1',
            schoolName: `SMKN 1 ${kecamatan}`,
            street: `Jl. Pendidikan Kejuruan No. ${(seq % 88) + 10}`,
            schoolType: 'Negeri',
            educationLevel: 'SMK',
            studentCount: 340 + ((seq * 19) % 420), // 340 - 759 siswa
          },
          {
            prefix: 'SMAN 1',
            schoolName: `SMAN 1 ${kecamatan}`,
            street: `Jl. Raya Utama Pendidikan No. ${((seq * 3) % 120) + 15}`,
            schoolType: 'Negeri',
            educationLevel: 'SMA',
            studentCount: 310 + ((seq * 23) % 450), // 310 - 759 siswa
          },
          {
            prefix: swastaIsSmk ? 'SMKS' : 'SMAS',
            schoolName: `${swastaIsSmk ? 'SMKS' : 'SMAS'} ${foundationName} ${kecamatan}`,
            street: `Jl. Yayasan Pendidikan No. ${((seq * 5) % 95) + 8}`,
            schoolType: 'Swasta',
            educationLevel: swastaIsSmk ? 'SMK' : 'SMA',
            studentCount: 120 + ((seq * 17) % 290), // 120 - 409 siswa
          },
        ];

        for (const tpl of schoolTemplates) {
          const npsnNum = 20210000 + seq;
          const nisnNum = 82000000 + seq;
          const schoolName = tpl.schoolName;
          const slug = `${tpl.prefix.toLowerCase().replace(/\s+/g, '-')}-${kecamatan
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')}-${seq}`;

          const firstIdx = (seq * 7) % PRINCIPAL_FIRST_NAMES.length;
          const lastIdx = (seq * 13 + 3) % PRINCIPAL_LAST_NAMES.length;
          const principalName = `${PRINCIPAL_FIRST_NAMES[firstIdx]} ${PRINCIPAL_LAST_NAMES[lastIdx]}`;
          const treasurerName =
            TREASURER_NAMES[(seq * 5) % TREASURER_NAMES.length];

          const { perStudentRate, zoneLabel } = computeRegionalBospUnitCost(
            provinsi,
            kabupaten,
            tpl.educationLevel
          );
          const studentCount = tpl.studentCount;
          const totalBosp = studentCount * perStudentRate;
          const tahap1Amount = Math.round(totalBosp * 0.5);
          const tahap2Amount = totalBosp - tahap1Amount;
          const maxHonorariumLimit = tpl.schoolType === 'Swasta' ? 40 : 20;
          const currentSeq = seq;
          const currentSchoolType = tpl.schoolType;
          const currentEducationLevel = tpl.educationLevel;

          const tahap1Info = {
            amount: tahap1Amount,
            period: 'Jan–Jun',
            status: 'Sudah Cair',
            disbursedDate: `${10 + (currentSeq % 12)} Februari 2026`,
          };
          const tahap2Info = {
            amount: tahap2Amount,
            period: 'Jul–Des',
            status: 'Sudah Cair',
            disbursedDate: `${11 + (currentSeq % 14)} Agustus 2026`,
          };

          let cachedHistory: Record<string, SchoolYearHistory> | null = null;
          const getLazyHistory = (): Record<string, SchoolYearHistory> => {
            if (!cachedHistory) {
              cachedHistory = buildSchoolYearlyHistory(
                schoolName,
                principalName,
                treasurerName,
                {
                  studentCount,
                  perStudentEstimate: perStudentRate,
                  totalBosp,
                  schoolType: currentSchoolType,
                  educationLevel: currentEducationLevel,
                  kabupaten,
                  seq: currentSeq,
                }
              );
            }
            return cachedHistory;
          };

          schools.push({
            id: slug,
            name: schoolName,
            npsn: String(npsnNum),
            sampleNisn: `00${nisnNum}`,
            principalName,
            treasurerName,
            provinsi,
            kabupaten,
            kecamatan,
            address: `${tpl.street}, Kec. ${kecamatan}, ${kabupaten}, ${provinsi}`,
            status: `Sekolah ${currentSchoolType} • Terdaftar Aktif di Kemendikdasmen`,
            schoolType: currentSchoolType,
            educationLevel: currentEducationLevel,
            jenjang: currentEducationLevel,
            maxHonorariumLimit,
            regionCostZone: zoneLabel,
            studentCount,
            perStudentEstimate: perStudentRate,
            totalBosp,
            tahap1: tahap1Info,
            tahap2: tahap2Info,
            get compositions() {
              return getLazyHistory()['2026'].compositions;
            },
            get tahap1Compositions() {
              return getLazyHistory()['2026'].tahap1Compositions;
            },
            get tahap2Compositions() {
              return getLazyHistory()['2026'].tahap2Compositions;
            },
            get items() {
              return getLazyHistory()['2026'].items;
            },
            get history() {
              return getLazyHistory();
            },
          });

          seq++;
        }
      }
    }
  }

  return schools;
}

export const SCHOOLS_DATABASE: SchoolData[] = buildStructuredSchoolsDatabase();

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

export interface KamusBospItem {
  title: string;
  detail: string;
  ref: string;
}

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

export const formatRupiah = (amount: number): string => {
  return 'Rp ' + amount.toLocaleString('id-ID');
};
