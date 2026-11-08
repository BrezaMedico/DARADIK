import {
  REGION_HIERARCHY,
  REGIONAL_BOSP_DATA,
  REGIONAL_BOSP_BY_KABUPATEN,
  RegionalBospRate,
} from './indonesiaRegions';
export {
  REGION_HIERARCHY,
  REGIONAL_BOSP_DATA,
  REGIONAL_BOSP_BY_KABUPATEN,
};
export type { RegionalBospRate };

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
  photoUrl?: string;
}

export type SchoolOwnershipType = 'Negeri' | 'Swasta';
export type SchoolEducationLevel = 'SD' | 'SMP' | 'SMA' | 'SMK';

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
  imageUrl?: string;
}

/**
 * Item Realisasi Pengadaan BOSP Universal (Relevan untuk SD, SMP, SMA, SMK)
 * Memuat barang-barang umum operasional sekolah yang mudah dipahami orang tua siswa.
 * Seluruh harga mengacu pada standar e-Katalog / SIPLah Kemendikdasmen.
 */
export const BAZMA_BOSP_ITEMS: BospRealizationItem[] = [
  {
    id: 'item-buku-literasi-01',
    code: 'RKAS-03.01.05',
    name: 'Buku Teks Pelajaran & Bahan Literasi Siswa',
    unitSummary: '160 Paket Buku',
    amount: 21600000,
    category: 'Pengembangan Perpustakaan & Buku Ajar Siswa',
    aiCategoryPath: 'Kurikulum & Buku > Buku Teks & Literasi Sekolah',
    date: '24 Februari 2026',
    stage: 'Tahap 1',
    allocation: 'Penyediaan buku teks utama Kurikulum Merdeka dan buku literasi bacaan siswa gratis untuk seluruh murid.',
    iconType: 'book',
    keywords: [
      'buku',
      'buku paket',
      'buku teks',
      'buku cetak',
      'literasi',
      'modul',
      'lks',
      'kurikulum merdeka',
      'perpustakaan',
      'bacaan',
      'materi',
      'pelajaran',
      'kamus',
    ],
    invoice: {
      number: 'INV/EDUKASI-BOS/2026/02/0042',
      vendorName: 'Penerbit & Percetakan Edukasi Bangsa (SIPLah)',
      vendorAddress: 'Jl. Pemuda No. 45, Kab. Bogor, Jawa Barat',
      npwp: '01.884.221.7-403.000',
      date: '24 Februari 2026',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Ag',
      lineItems: [
        {
          name: 'Paket Buku Teks Utama Kurikulum Merdeka Terakreditasi',
          qty: '120 Paket',
          unitPrice: 135000,
          subtotal: 16200000,
        },
        {
          name: 'Buku Pengayaan Literasi & Referensi Perpustakaan Siswa',
          qty: '40 Paket',
          unitPrice: 135000,
          subtotal: 5400000,
        },
      ],
    },
    geotag: {
      lat: '-6.5683',
      lng: '106.6974',
      roomLabel: 'Perpustakaan & Ruang Sumber Belajar',
      uploadedAt: '26 Feb 2026 10:15 WIB',
      inspectorNote: 'Buku telah didistribusikan ke rak perpustakaan dan dibagikan langsung kepada siswa tanpa pungutan biaya.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik',
    },
    photoUrl: 'https://eteimuixvdbcnzokckff.supabase.co/storage/v1/object/public/bosp-evidence/bukti-fisik/bukti-perpustakaan-buku-paket.jpg',
  },
  {
    id: 'item-atk-kertas-02',
    code: 'RKAS-04.02.01',
    name: 'Kertas HVS & ATK Penilaian / Ujian Evaluasi Siswa',
    unitSummary: '80 Rim HVS & Paket ATK Ujian',
    amount: 8400000,
    category: 'Pelaksanaan Kegiatan Asesmen & Pembelajaran',
    aiCategoryPath: 'Operasional Pembelajaran > Kertas & Alat Tulis Kantor',
    date: '12 Maret 2026',
    stage: 'Tahap 1',
    allocation: 'Penyediaan kertas HVS, penggandaan naskah asesmen formatif/sumatif, dan perlengkapan ujian evaluasi belajar siswa.',
    iconType: 'book',
    keywords: [
      'kertas',
      'hvs',
      'atk',
      'alat tulis',
      'ujian',
      'penilaian',
      'fotokopi',
      'soal',
      'tinta printer',
      'spidol',
      'penghapus',
      'map',
      'pulpen',
      'pensil',
      'asesmen',
    ],
    invoice: {
      number: 'INV/ATK-SEKOLAH/2026/03/0118',
      vendorName: 'Toko Alat Tulis Sarana Eduka (Mitra SIPLah)',
      vendorAddress: 'Jl. Raya Pajajaran No. 28, Kota Bogor',
      npwp: '02.441.312.9-404.000',
      date: '12 Maret 2026',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Ag',
      lineItems: [
        {
          name: 'Kertas HVS Ukuran F4 & A4 75/80 gram SNI (80 Rim)',
          qty: '80 Rim',
          unitPrice: 65000,
          subtotal: 5200000,
        },
        {
          name: 'Tinta Printer Penggandaan Lembar Soal & Perlengkapan Ujian',
          qty: '1 Paket',
          unitPrice: 3200000,
          subtotal: 3200000,
        },
      ],
    },
    geotag: {
      lat: '-6.5681',
      lng: '106.6976',
      roomLabel: 'Ruang Tata Usaha & Penggandaan Soal',
      uploadedAt: '14 Mar 2026 11:30 WIB',
      inspectorNote: 'Persediaan kertas HVS dan tinta tersimpan di lemari logistik untuk keperluan ujian siswa.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik',
    },
    photoUrl: 'https://eteimuixvdbcnzokckff.supabase.co/storage/v1/object/public/bosp-evidence/bukti-fisik/bukti-asesmen-kertas-hvs.jpg',
  },
  {
    id: 'item-sanitasi-toilet-03',
    code: 'RKAS-05.08.14',
    name: 'Perawatan Sanitasi, Keran Air & Toilet Siswa',
    unitSummary: '4 Bilik Toilet & 6 Titik Keran Wastafel',
    amount: 11200000,
    category: 'Pemeliharaan Sarana dan Prasarana Sekolah',
    aiCategoryPath: 'Pemeliharaan Fasilitas > Sanitasi & Air Bersih',
    date: '15 April 2026',
    stage: 'Tahap 1',
    allocation: 'Perbaikan instalasi saluran air bersih, kran cuci tangan, dan perawatan toilet siswa agar bersih, higienis, dan sehat.',
    iconType: 'sanitation',
    keywords: [
      'toilet',
      'wc',
      'kamar mandi',
      'sanitasi',
      'wastafel',
      'keran',
      'kran',
      'air',
      'air bersih',
      'pipa',
      'paralon',
      'toren',
      'tandon',
      'sabun',
      'kebersihan',
      'kloset',
      'pompa',
      'saluran air',
    ],
    invoice: {
      number: 'INV/SAN-KARYA/2026/04/0091',
      vendorName: 'CV Tirta Abadi Sanitasi (Mitra SIPLah)',
      vendorAddress: 'Jl. Raya Dramaga No. 71, Kab. Bogor',
      npwp: '04.119.502.1-403.000',
      date: '15 April 2026',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Ag',
      lineItems: [
        {
          name: 'Perbaikan Instalasi Pipa PVC, Kloset, dan Pintu Bilik Toilet Siswa',
          qty: '4 Bilik',
          unitPrice: 1750000,
          subtotal: 7000000,
        },
        {
          name: 'Wastafel Cuci Tangan Keramik & Keran Air Stainless Steel SNI',
          qty: '6 Unit',
          unitPrice: 700000,
          subtotal: 4200000,
        },
      ],
    },
    geotag: {
      lat: '-6.5682',
      lng: '106.6975',
      roomLabel: 'Area Toilet & Sanitasi Siswa',
      uploadedAt: '18 Apr 2026 14:00 WIB',
      inspectorNote: 'Seluruh keran air mengalir lancar, saluran pembuangan bersih, dan fasilitas cuci tangan berfungsi baik.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik',
    },
    photoUrl: 'https://eteimuixvdbcnzokckff.supabase.co/storage/v1/object/public/bosp-evidence/bukti-fisik/bukti-sarpras-sanitasi-wastafel.jpg',
  },
  {
    id: 'item-meja-kursi-04',
    code: 'RKAS-05.04.02',
    name: 'Pengadaan Meja & Kursi Belajar Siswa',
    unitSummary: '30 Pasang Meja Kursi Siswa',
    amount: 16500000,
    category: 'Pemeliharaan Sarana dan Prasarana Sekolah',
    aiCategoryPath: 'Sarana Ruang Kelas > Meja Kursi Belajar',
    date: '18 Mei 2026',
    stage: 'Tahap 1',
    allocation: 'Penggantian meja dan kursi belajar yang rusak di ruang kelas untuk memastikan kenyamanan siswa saat mengikuti pelajaran.',
    iconType: 'desk',
    keywords: [
      'meja',
      'kursi',
      'bangku',
      'meja belajar',
      'kursi belajar',
      'mebel',
      'perabot',
      'meja kelas',
      'kursi kelas',
      'ruang kelas',
      'lemari kelas',
    ],
    invoice: {
      number: 'INV/KARYA-MEBEL/2026/05/0133',
      vendorName: 'UD Karya Sentosa (SIPLah Kemdikbud)',
      vendorAddress: 'Jl. Raya Ciampea KM 12, Kab. Bogor',
      npwp: '05.332.901.4-403.000',
      date: '18 Mei 2026',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Ag',
      lineItems: [
        {
          name: 'Set Meja dan Kursi Belajar Siswa Rangka Besi Kokoh Standar SNI',
          qty: '30 Set',
          unitPrice: 550000,
          subtotal: 16500000,
        },
      ],
    },
    geotag: {
      lat: '-6.5684',
      lng: '106.6975',
      roomLabel: 'Ruang Belajar Kelas Siswa',
      uploadedAt: '21 Mei 2026 10:20 WIB',
      inspectorNote: '30 pasang meja kursi baru telah tertata rapi di dalam ruang kelas dan siap digunakan siswa.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik',
    },
    photoUrl: 'https://eteimuixvdbcnzokckff.supabase.co/storage/v1/object/public/bosp-evidence/bukti-fisik/bukti-sarpras-meja-kursi-kelas.jpg',
  },
  {
    id: 'item-kipas-angin-05',
    code: 'RKAS-02.04.11',
    name: 'Kipas Angin Dinding Ruang Belajar Siswa',
    unitSummary: '12 Unit Kipas Dinding Terpasang',
    amount: 9600000,
    category: 'Pemeliharaan Sarana dan Prasarana Sekolah',
    aiCategoryPath: 'Sarana Ruang Kelas > Sirkulasi Udara & Kipas Dinding',
    date: '25 Agustus 2026',
    stage: 'Tahap 2',
    allocation: 'Pemasangan kipas angin dinding di ruang kelas agar sirkulasi udara lancar dan suasana belajar tidak panas/gerah.',
    iconType: 'fan',
    keywords: [
      'kipas',
      'kipas angin',
      'angin',
      'pendingin',
      'sirkulasi',
      'ventilasi',
      'exhaust',
      'gerah',
      'panas',
      'udara',
      'ac',
      'kipas dinding',
      'ruang kelas',
    ],
    invoice: {
      number: 'INV/ELEKTRONIK-BOS/2026/08/0056',
      vendorName: 'Toko Elektronik Makmur Jaya (Mitra SIPLah)',
      vendorAddress: 'Jl. Raya Leuwiliang No. 89, Kab. Bogor',
      npwp: '02.948.112.4-403.000',
      date: '25 Agustus 2026',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Ag',
      lineItems: [
        {
          name: 'Kipas Angin Dinding Wall Fan 16-18 Inch Garansi Resmi SNI',
          qty: '12 Unit',
          unitPrice: 800000,
          subtotal: 9600000,
        },
      ],
    },
    geotag: {
      lat: '-6.5684',
      lng: '106.6976',
      roomLabel: 'Dinding Ruang Belajar Kelas Siswa',
      uploadedAt: '28 Agu 2026 13:45 WIB',
      inspectorNote: 'Semua unit kipas angin dinding telah dipasang kuat dengan kabel instalasi rapi dan berputar normal.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik',
    },
    photoUrl: 'https://eteimuixvdbcnzokckff.supabase.co/storage/v1/object/public/bosp-evidence/bukti-fisik/bukti-sarpras-kipas-angin-dinding.jpg',
  },
  {
    id: 'item-internet-wifi-06',
    code: 'RKAS-06.01.01',
    name: 'Langganan Akses Internet & WiFi Sekolah',
    unitSummary: '12 Bulan Penuh Operasional',
    amount: 18000000,
    category: 'Langganan Daya dan Jasa Sekolah',
    aiCategoryPath: 'Daya & Jasa > Langganan Internet Sekolah',
    date: '01 September 2026',
    stage: 'Tahap 2',
    allocation: 'Penyediaan kuota dan akses internet stabil untuk kelancaran Asesmen Nasional (ANBK), Dapodik, dan pembelajaran digital.',
    iconType: 'projector',
    keywords: [
      'internet',
      'wifi',
      'kuota',
      'pulsa',
      'jaringan',
      'koneksi',
      'lan',
      'anbk',
      'dapodik',
      'fiber optik',
      'modem',
      'router',
      'langganan internet',
      'daya dan jasa',
    ],
    invoice: {
      number: 'INV/TELCO-SEKOLAH/2026/09/0210',
      vendorName: 'PT Telekomunikasi Jaringan Nusantara (SIPLah)',
      vendorAddress: 'Jl. Raya Pajajaran No. 12, Kota Bogor',
      npwp: '01.233.444.5-403.000',
      date: '01 September 2026',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Ag',
      lineItems: [
        {
          name: 'Langganan Akses Internet Dedicated Sekolah (12 Bulan)',
          qty: '12 Bulan',
          unitPrice: 1500000,
          subtotal: 18000000,
        },
      ],
    },
    geotag: {
      lat: '-6.5682',
      lng: '106.6978',
      roomLabel: 'Ruang Server & Pusat WiFi Sekolah',
      uploadedAt: '03 Sep 2026 10:10 WIB',
      inspectorNote: 'Router dan sinyal WiFi aktif mencakup area ruang guru dan ruang kelas untuk kebutuhan asesmen.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik',
    },
    photoUrl: 'https://eteimuixvdbcnzokckff.supabase.co/storage/v1/object/public/bosp-evidence/bukti-fisik/bukti-jasa-internet-wifi-router.jpg',
  },
  {
    id: 'item-proyektor-lcd-07',
    code: 'RKAS-02.04.09',
    name: 'Proyektor LCD & Layar Pembelajaran Kelas',
    unitSummary: '2 Set Proyektor & Layar Gantung',
    amount: 13800000,
    category: 'Penyediaan Alat Multimedia Pembelajaran',
    aiCategoryPath: 'Sarana Pembelajaran > Proyektor Multimedia',
    date: '25 September 2026',
    stage: 'Tahap 2',
    allocation: 'Pengadaan proyektor dan layar display visual untuk media presentasi materi pelajaran dan pemutaran video edukasi.',
    iconType: 'projector',
    keywords: [
      'proyektor',
      'projector',
      'infocus',
      'lcd',
      'layar',
      'layar proyektor',
      'presentasi',
      'multimedia',
      'hdmi',
      'video pembelajaran',
      'media ajar',
      'alat peraga',
    ],
    invoice: {
      number: 'INV/VISUAL-EDU/2026/09/0077',
      vendorName: 'CV Sarana Multi Visual Bogor (Mitra SIPLah)',
      vendorAddress: 'Jl. Raya Tajur No. 104, Kota Bogor',
      npwp: '02.441.890.3-404.000',
      date: '25 September 2026',
      treasurerName: 'Rina Marlina, S.E.',
      principalName: 'Ahmad Dahlan, S.Ag',
      lineItems: [
        {
          name: 'Proyektor EPSON 3LCD 3600 Lumens + Bracket Gantung Plafon',
          qty: '2 Unit',
          unitPrice: 5900000,
          subtotal: 11800000,
        },
        {
          name: 'Layar Proyektor Gantung Manual Tripod/Wall 70 Inch SNI',
          qty: '2 Unit',
          unitPrice: 1000000,
          subtotal: 2000000,
        },
      ],
    },
    geotag: {
      lat: '-6.5684',
      lng: '106.6975',
      roomLabel: 'Ruang Kelas Multimedia Siswa',
      uploadedAt: '28 Sep 2026 11:30 WIB',
      inspectorNote: 'Proyektor dan layar display terpasang kokoh, pencahayaan jelas untuk presentasi belajar siswa.',
      conditionStatus: 'Terverifikasi Fisik & Titik Geotagging Dapodik',
    },
    photoUrl: 'https://eteimuixvdbcnzokckff.supabase.co/storage/v1/object/public/bosp-evidence/bukti-fisik/bukti-multimedia-proyektor-lcd.jpg',
  },
];

/**
 * Komposisi Global RKAS SMK TI BAZMA (TA 2026) — Sesuai Juknis Permendikdasmen 2026
 * Terintegrasi penuh 100% secara matematis dengan daftar realisasi pembelanjaan barang BOSP.
 */
export const BAZMA_GLOBAL_COMPOSITIONS_2026: BudgetComposition[] = [
  {
    id: 'comp-global-1',
    label: 'Pengembangan Perpustakaan & Buku Pelajaran',
    percentage: 13,
    amount: 21600000,
    color: '#2E6496',
    description:
      'Buku teks utama Kurikulum Merdeka dan buku literasi bacaan siswa gratis.',
  },
  {
    id: 'comp-global-2',
    label: 'Pemeliharaan Sarana dan Prasarana Sekolah',
    percentage: 22,
    amount: 37300000,
    color: '#4B83B1',
    description:
      'Perawatan sanitasi toilet, pengadaan meja kursi belajar siswa, dan kipas angin dinding kelas.',
  },
  {
    id: 'comp-global-3',
    label: 'Pembayaran Honor Guru & Tendik (Sekolah Swasta)',
    percentage: 32,
    amount: 54720000,
    color: '#66A3BF',
    description:
      'Honorarium bulanan pendidik dan tenaga kependidikan non-ASN terdaftar.',
  },
  {
    id: 'comp-global-4',
    label: 'Multimedia, Internet, Asesmen & Operasional KBM',
    percentage: 33,
    amount: 57380000,
    color: '#8CBCCF',
    description:
      'Langganan internet WiFi sekolah, proyektor LCD kelas, kertas ATK ujian, dan operasional KBM.',
  },
];

export const BAZMA_TAHAP1_COMPOSITIONS_2026: BudgetComposition[] = [
  {
    id: 'comp-t1-1',
    label: 'Pengadaan Buku Teks Pelajaran & Bahan Literasi',
    percentage: 25,
    amount: 21600000,
    color: '#2E6496',
    description:
      'Buku teks Kurikulum Merdeka siswa semester awal (Realisasi Barang).',
  },
  {
    id: 'comp-t1-2',
    label: 'Pembayaran Honorarium Guru & Tendik (Jan–Jun)',
    percentage: 30,
    amount: 25650000,
    color: '#4B83B1',
    description:
      'Honorarium guru dan tenaga kependidikan periode Januari–Juni.',
  },
  {
    id: 'comp-t1-3',
    label: 'Pemeliharaan Sanitasi Toilet & Meja Kursi Belajar',
    percentage: 32,
    amount: 27700000,
    color: '#66A3BF',
    description:
      'Perbaikan sanitasi toilet siswa (Rp 11.200.000) dan pengadaan meja kursi belajar (Rp 16.500.000).',
  },
  {
    id: 'comp-t1-4',
    label: 'Kertas HVS, ATK Penilaian & Operasional KBM',
    percentage: 13,
    amount: 10550000,
    color: '#8CBCCF',
    description:
      'Kertas HVS/ATK ujian siswa (Rp 8.400.000) dan operasional KBM semester 1 (Rp 2.150.000).',
  },
];

export const BAZMA_TAHAP2_COMPOSITIONS_2026: BudgetComposition[] = [
  {
    id: 'comp-t2-1',
    label: 'Pembayaran Honorarium Guru & Tendik (Jul–Des)',
    percentage: 34,
    amount: 29070000,
    color: '#2E6496',
    description:
      'Honorarium pendidik dan tenaga kependidikan periode Juli–Desember.',
  },
  {
    id: 'comp-t2-2',
    label: 'Langganan Akses Internet & WiFi Sekolah',
    percentage: 21,
    amount: 18000000,
    color: '#4B83B1',
    description:
      'Langganan internet dedicated sekolah untuk ANBK dan KBM (Realisasi Barang).',
  },
  {
    id: 'comp-t2-3',
    label: 'Multimedia Proyektor LCD & Asesmen ANBK',
    percentage: 22,
    amount: 18830000,
    color: '#66A3BF',
    description:
      'Proyektor LCD kelas (Rp 13.800.000) dan operasional asesmen evaluasi (Rp 5.030.000).',
  },
  {
    id: 'comp-t2-4',
    label: 'Pemeliharaan Kipas Angin Dinding & Ruang Belajar',
    percentage: 23,
    amount: 19600000,
    color: '#8CBCCF',
    description:
      'Pemasangan kipas dinding (Rp 9.600.000) dan pemeliharaan ruang kelas (Rp 10.000.000).',
  },
];

/**
 * Data Utama SMK TI BAZMA (90 Siswa × Rp 1.900.000 = Rp 171.000.000 — Sesuai Satuan Biaya SMK Kab. Bogor di Excel)
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
  regionCostZone: 'Satuan Biaya BOSP Kab. Bogor, Jawa Barat (SMK) — Kepmendikbud 16/P/2021',
  studentCount: 90,
  perStudentEstimate: 1900000,
  totalBosp: 171000000,
  imageUrl: 'https://eteimuixvdbcnzokckff.supabase.co/storage/v1/object/public/bosp-evidence/schools/smk-ti-bazma.jpg',
  tahap1: {
    amount: 85500000,
    period: 'Jan–Jun',
    status: 'Sudah Cair',
    disbursedDate: '16 Februari 2026',
  },
  tahap2: {
    amount: 85500000,
    period: 'Jul–Des',
    status: 'Sudah Cair',
    disbursedDate: '14 Agustus 2026',
  },
  compositions: BAZMA_GLOBAL_COMPOSITIONS_2026,
  tahap1Compositions: BAZMA_TAHAP1_COMPOSITIONS_2026,
  tahap2Compositions: BAZMA_TAHAP2_COMPOSITIONS_2026,
  items: BAZMA_BOSP_ITEMS,
};



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
 * Menghitung Satuan Biaya BOSP Reguler Majemuk per Siswa / Tahun
 * Berdasarkan data resmi Daftar_Wilayah_SD_SMP_SMA_SMK_terisi.xlsx (Kepmendikbud 16/P/2021)
 * untuk seluruh 514 Kabupaten/Kota pada jenjang SD, SMP, SMA, dan SMK.
 */
export function computeRegionalBospUnitCost(
  provinsi: string,
  kabupaten: string,
  level: SchoolEducationLevel
): { perStudentRate: number; zoneLabel: string } {
  const exactMatch =
    REGIONAL_BOSP_BY_KABUPATEN[`${provinsi}::${kabupaten}`] ||
    REGIONAL_BOSP_DATA.find(
      (r) =>
        r.kabupaten.toLowerCase() === kabupaten.toLowerCase() ||
        r.kabRaw.toLowerCase() === kabupaten.toLowerCase()
    );

  if (exactMatch) {
    const rateMap: Record<SchoolEducationLevel, number> = {
      SD: exactMatch.sd,
      SMP: exactMatch.smp,
      SMA: exactMatch.sma,
      SMK: exactMatch.smk,
    };
    const perStudentRate = rateMap[level] ?? exactMatch.sma;
    return {
      perStudentRate,
      zoneLabel: `Satuan Biaya BOSP ${exactMatch.kabupaten}, ${exactMatch.provinsi} (${level}) — ${exactMatch.sumber}`,
    };
  }

  // Fallback jika wilayah kustom di luar 514 Kab/Kota
  const fallbackRates: Record<SchoolEducationLevel, number> = {
    SD: 900000,
    SMP: 1100000,
    SMA: 1500000,
    SMK: 1600000,
  };
  return {
    perStudentRate: fallbackRates[level] || 1500000,
    zoneLabel: `Satuan Biaya BOSP ${kabupaten}, ${provinsi} (${level})`,
  };
}

/**
 * Menghasilkan 3 Tab Komposisi Penggunaan Dana (Global, Tahap 1, Tahap 2)
 * yang patuh terhadap Permendikdasmen 2026 dan berbeda sesuai Negeri/Swasta, Jenjang (SD/SMP/SMA/SMK), dan Daerah.
 */
export function buildSchoolCompositions(
  totalBosp: number,
  tahap1Amount: number,
  tahap2Amount: number,
  schoolType: SchoolOwnershipType,
  educationLevel: SchoolEducationLevel,
  _kabupaten: string,
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

  const globalCompositions: BudgetComposition[] = [
    {
      id: `global-perpus-${seq}`,
      label: 'Pengembangan Perpustakaan & Buku Ajar',
      percentage: perpustakaanPct,
      amount: amtPerpus,
      color: '#2E6496',
      description: `Pengadaan buku teks utama ${educationLevel}, modul ajar, dan literasi perpustakaan.`,
    },
    {
      id: `global-sarpras-${seq}`,
      label: 'Pemeliharaan Sarana dan Prasarana Sekolah',
      percentage: sarprasPct,
      amount: amtSarpras,
      color: '#4B83B1',
      description: 'Pemeliharaan ruang kelas, perbaikan sanitasi toilet, dan meja kursi belajar.',
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
      description: 'Honorarium bulanan pendidik dan tenaga kependidikan non-ASN.',
    },
    {
      id: `global-lainnya-${seq}`,
      label:
        educationLevel === 'SMK'
          ? 'Komponen Lainnya (Praktikum Kejuruan, Daya & Jasa, Asesmen)'
          : `Komponen Lainnya (Kegiatan Pembelajaran ${educationLevel}, Daya & Jasa, Asesmen)`,
      percentage: lainnyaPct,
      amount: amtLainnya,
      color: '#8CBCCF',
      description: 'Langganan daya & jasa, asesmen ANBK, dan operasional KBM.',
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
      description: 'Pemenuhan buku paket siswa dan modul ajar semester awal.',
    },
    {
      id: `t1-honor-${seq}`,
      label: `Pembayaran Honorarium Guru & Tendik (Jan–Jun)`,
      percentage: t1HonorPct,
      amount: t1Amt2,
      color: '#4B83B1',
      description: 'Honor bulanan pendidik dan tenaga kependidikan periode Januari–Juni.',
    },
    {
      id: `t1-daya-${seq}`,
      label: 'Langganan Listrik, Air Bersih & Internet Pembelajaran',
      percentage: t1DayaJasaPct,
      amount: t1Amt3,
      color: '#66A3BF',
      description: 'Tagihan listrik, air bersih, dan langganan internet sekolah semester 1.',
    },
    {
      id: `t1-ppdb-${seq}`,
      label: 'Pelaksanaan PPDB/SPMB Gratis & Kegiatan Ekstrakurikuler',
      percentage: t1PpdbPembelajaranPct,
      amount: t1Amt4,
      color: '#8CBCCF',
      description: 'Operasional PPDB/SPMB bebas biaya dan kegiatan kesiswaan.',
    },
    {
      id: `t1-sarpras-${seq}`,
      label: 'Pemeliharaan Sanitasi Sekolah & Multimedia Kelas',
      percentage: t1SarprasPct,
      amount: t1Amt5,
      color: '#A7D0DC',
      description: 'Perbaikan sanitasi toilet dan sarana multimedia ruang kelas.',
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
      description: 'Honorarium pendidik dan tenaga kependidikan periode Juli–Desember.',
    },
    {
      id: `t2-asesmen-${seq}`,
      label:
        educationLevel === 'SMK'
          ? 'Praktikum Kejuruan, ANBK & Uji Kompetensi (UKK)'
          : `Pelaksanaan ANBK, Evaluasi Ujian & Kegiatan Belajar ${educationLevel}`,
      percentage: t2AsesmenPraktikPct,
      amount: t2Amt2,
      color: '#4B83B1',
      description: 'Pelaksanaan asesmen ANBK, evaluasi semester, dan alat peraga pembelajaran.',
    },
    {
      id: `t2-sarpras-${seq}`,
      label: 'Pemeliharaan Ruang Kelas, Meja Kursi & Ventilasi',
      percentage: t2SarprasPct,
      amount: t2Amt3,
      color: '#66A3BF',
      description: 'Penggantian meja kursi belajar dan perbaikan ringan ruang kelas.',
    },
    {
      id: `t2-daya-${seq}`,
      label: 'Langganan Daya, Internet & Administrasi Semester 2',
      percentage: t2DayaJasaPct,
      amount: t2Amt4,
      color: '#8CBCCF',
      description: 'Tagihan listrik, air, dan langganan internet sekolah semester 2.',
    },
    {
      id: `t2-gtk-${seq}`,
      label: 'Pengembangan Profesi Guru (GTK) & Literasi Buku',
      percentage: t2ProfesiGtkPct,
      amount: t2Amt5,
      color: '#A7D0DC',
      description: 'Pelatihan guru, peningkatan literasi, dan kegiatan siswa.',
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
  const levelText =
    educationLevel === 'SD'
      ? 'Siswa SD'
      : educationLevel === 'SMP'
      ? 'Siswa SMP'
      : educationLevel === 'SMA'
      ? 'Siswa SMA'
      : 'Siswa SMK';

  return baseItems.map((item) => {
    const scaledAmount =
      scaleFactor === 1
        ? item.amount
        : Math.max(1500000, Math.round((item.amount * scaleFactor) / 100000) * 100000);

    const adaptedAllocation = item.allocation
      .replace(/seluruh murid/g, `seluruh ${levelText} ${schoolName}`)
      .replace(/siswa/g, `${levelText}`);

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
        subtotal: newSub,
      };
    });

    return {
      ...item,
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
        roomLabel: `${item.geotag.roomLabel} — ${schoolName}`,
        conditionStatus: `Terverifikasi Fisik & Titik Geotagging Dapodik ${schoolName}`,
      },
    };
  });
}

export function buildSchoolPayload(
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
): {
  compositions: BudgetComposition[];
  tahap1Compositions?: BudgetComposition[];
  tahap2Compositions?: BudgetComposition[];
  items: BospRealizationItem[];
} {
  const studentCount = options?.studentCount || 300;
  const perStudentEstimate = options?.perStudentEstimate || 1500000;
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

  return {
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
  };
}

/**
 * Membangun daftar sekolah terstruktur untuk seluruh 514 Kabupaten/Kota di 38 Provinsi sesuai Excel:
 * - Setiap daerah (Kabupaten/Kota) memiliki tepat 1 sekolah untuk masing-masing jenjang (SD, SMP, SMA, SMK)
 *   dan masing-masing status kepemilikan (Negeri dan Swasta) — total 8 sekolah per daerah:
 *   1. SD Negeri    2. SD Swasta
 *   3. SMP Negeri   4. SMP Swasta
 *   5. SMA Negeri   6. SMA Swasta
 *   7. SMK Negeri   8. SMK Swasta (untuk Kab. Bogor adalah SMK TI BAZMA)
 * - Satuan biaya BOSP per siswa/tahun sama persis dengan nilai pada file Excel
 *   Daftar_Wilayah_SD_SMP_SMA_SMK_terisi.xlsx (Kepmendikbud 16/P/2021).
 */
function buildStructuredSchoolsDatabase(): SchoolData[] {
  const schools: SchoolData[] = [SMK_TI_BAZMA];
  let seq = 1;

  for (const region of REGIONAL_BOSP_DATA) {
    const { provinsi, kabupaten, kecamatan, no: regionNo } = region;
    const isKabBogor =
      provinsi === 'Jawa Barat' && kabupaten === 'Kab. Bogor';

    const fSd =
      SWASTA_FOUNDATION_NAMES[(regionNo * 3) % SWASTA_FOUNDATION_NAMES.length];
    const fSmp =
      SWASTA_FOUNDATION_NAMES[(regionNo * 3 + 1) % SWASTA_FOUNDATION_NAMES.length];
    const fSma =
      SWASTA_FOUNDATION_NAMES[(regionNo * 3 + 2) % SWASTA_FOUNDATION_NAMES.length];
    const fSmk =
      SWASTA_FOUNDATION_NAMES[(regionNo * 3 + 5) % SWASTA_FOUNDATION_NAMES.length];

    const schoolTemplates: {
      prefix: string;
      schoolName: string;
      street: string;
      schoolType: SchoolOwnershipType;
      educationLevel: SchoolEducationLevel;
      perStudentRate: number;
      studentCount: number;
      skip?: boolean;
    }[] = [
      {
        prefix: 'SDN 1',
        schoolName: `SD Negeri 1 ${kabupaten}`,
        street: `Jl. Pendidikan Dasar No. ${(regionNo % 70) + 5}`,
        schoolType: 'Negeri',
        educationLevel: 'SD',
        perStudentRate: region.sd,
        studentCount: 180 + ((regionNo * 13) % 180), // 180 - 359 siswa
      },
      {
        prefix: 'SDS',
        schoolName: `SD Swasta ${fSd} ${kabupaten}`,
        street: `Jl. Yayasan Pendidikan Dasar No. ${((regionNo * 2) % 85) + 7}`,
        schoolType: 'Swasta',
        educationLevel: 'SD',
        perStudentRate: region.sd,
        studentCount: 120 + ((regionNo * 11) % 140), // 120 - 259 siswa
      },
      {
        prefix: 'SMPN 1',
        schoolName: `SMP Negeri 1 ${kabupaten}`,
        street: `Jl. Pendidikan Menengah Pertama No. ${((regionNo * 3) % 90) + 10}`,
        schoolType: 'Negeri',
        educationLevel: 'SMP',
        perStudentRate: region.smp,
        studentCount: 250 + ((regionNo * 17) % 240), // 250 - 489 siswa
      },
      {
        prefix: 'SMPS',
        schoolName: `SMP Swasta ${fSmp} ${kabupaten}`,
        street: `Jl. Yayasan Menengah Pertama No. ${((regionNo * 4) % 95) + 9}`,
        schoolType: 'Swasta',
        educationLevel: 'SMP',
        perStudentRate: region.smp,
        studentCount: 140 + ((regionNo * 19) % 170), // 140 - 309 siswa
      },
      {
        prefix: 'SMAN 1',
        schoolName: `SMA Negeri 1 ${kabupaten}`,
        street: `Jl. Raya Utama Pendidikan No. ${((regionNo * 5) % 110) + 12}`,
        schoolType: 'Negeri',
        educationLevel: 'SMA',
        perStudentRate: region.sma,
        studentCount: 320 + ((regionNo * 23) % 320), // 320 - 639 siswa
      },
      {
        prefix: 'SMAS',
        schoolName: `SMA Swasta ${fSma} ${kabupaten}`,
        street: `Jl. Yayasan Pendidikan Menengah No. ${((regionNo * 6) % 95) + 8}`,
        schoolType: 'Swasta',
        educationLevel: 'SMA',
        perStudentRate: region.sma,
        studentCount: 150 + ((regionNo * 15) % 210), // 150 - 359 siswa
      },
      {
        prefix: 'SMKN 1',
        schoolName: `SMK Negeri 1 ${kabupaten}`,
        street: `Jl. Pendidikan Kejuruan No. ${((regionNo * 7) % 88) + 10}`,
        schoolType: 'Negeri',
        educationLevel: 'SMK',
        perStudentRate: region.smk,
        studentCount: 350 + ((regionNo * 21) % 340), // 350 - 689 siswa
      },
      {
        prefix: 'SMKS',
        schoolName: `SMK Swasta ${fSmk} ${kabupaten}`,
        street: `Jl. Kejuruan Terpadu No. ${((regionNo * 8) % 92) + 6}`,
        schoolType: 'Swasta',
        educationLevel: 'SMK',
        perStudentRate: region.smk,
        studentCount: 160 + ((regionNo * 17) % 220), // 160 - 379 siswa
        skip: isKabBogor, // Kab. Bogor sudah diwakili oleh SMK TI BAZMA (SMK Swasta)
      },
    ];

    for (const tpl of schoolTemplates) {
      if (tpl.skip) continue;

      const npsnNum = 20210000 + seq;
      const nisnNum = 82000000 + seq;
      const schoolName = tpl.schoolName;
      const slug = `${tpl.prefix.toLowerCase().replace(/\s+/g, '-')}-${kabupaten
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}-${seq}`;

      const firstIdx = (seq * 7) % PRINCIPAL_FIRST_NAMES.length;
      const lastIdx = (seq * 13 + 3) % PRINCIPAL_LAST_NAMES.length;
      const principalName = `${PRINCIPAL_FIRST_NAMES[firstIdx]} ${PRINCIPAL_LAST_NAMES[lastIdx]}`;
      const treasurerName =
        TREASURER_NAMES[(seq * 5) % TREASURER_NAMES.length];

      const perStudentRate = tpl.perStudentRate;
      const zoneLabel = `Satuan Biaya BOSP ${kabupaten}, ${provinsi} (${tpl.educationLevel}) — ${region.sumber}`;
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

      const payload = buildSchoolPayload(
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
        compositions: payload.compositions,
        tahap1Compositions: payload.tahap1Compositions,
        tahap2Compositions: payload.tahap2Compositions,
        items: payload.items,
      });

      seq++;
    }
  }

  return schools;
}

export function getSchoolsSeedDatabase(): SchoolData[] {
  return buildStructuredSchoolsDatabase();
}

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
