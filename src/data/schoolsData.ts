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
}

export const REGION_HIERARCHY: Record<string, Record<string, string[]>> = {
  'Jawa Barat': {
    'Kab. Bogor': ['Ciampea', 'Cibinong', 'Dramaga'],
    'Kota Bandung': ['Coblong', 'Cicendo', 'Lengkong'],
  },
  'DKI Jakarta': {
    'Jakarta Pusat': ['Menteng', 'Gambir'],
    'Jakarta Selatan': ['Tebet', 'Kebayoran Baru'],
  },
  'Jawa Tengah': {
    'Kota Semarang': ['Banyumanik', 'Tembalang'],
  },
  'DI Yogyakarta': {
    'Kab. Sleman': ['Depok', 'Mlati'],
  },
  'Jawa Timur': {
    'Kota Surabaya': ['Gubeng', 'Wonokromo'],
  },
};

const DEFAULT_ITEMS_CIAMPEA: BospRealizationItem[] = [
  {
    id: 'item-kipas-01',
    code: 'RKAS-02.04.11',
    name: 'Kipas Angin Dinding (18 Unit)',
    unitSummary: '18 Unit Terpasang',
    amount: 35000000,
    category: 'Peralatan Sekolah (Sarana Prasarana Kelas)',
    aiCategoryPath: 'Peralatan Sekolah > Kipas Angin Dinding',
    date: '12 Oktober 2026',
    stage: 'Tahap 2',
    allocation: 'Pemasangan untuk ruang kelas 1A, 1B, 2A, 2B, 3A, dan 3B (masing-masing 3 unit)',
    iconType: 'fan',
    keywords: [
      'kipas',
      'angin',
      'kipas angin',
      'gerah',
      'panas',
      'pendingin',
      'sirkulasi',
      'udara',
      'ventilasi',
      'ac',
      'dinding',
      'kelas 2',
    ],
    invoice: {
      number: 'INV/MJ-BGR/2026/10/0892',
      vendorName: 'CV Elektronik Maju Jaya Bogor (SIPLah Terverifikasi)',
      vendorAddress: 'Jl. Letjen Ibrahim Adjie No. 114, Kab. Bogor, Jawa Barat',
      npwp: '02.849.112.4-403.000',
      date: '12 Oktober 2026',
      treasurerName: 'Hj. Ratna Suminar, S.Pd.',
      principalName: 'Drs. H. Bambang Sutrisno, M.Pd.',
      lineItems: [
        {
          name: 'Kipas Angin Dinding Industrial 18 Inch (SNI Motor Tembaga)',
          qty: '18 Unit',
          unitPrice: 1650000,
          subtotal: 29700000,
        },
        {
          name: 'Instalasi Jalur Kabel NYM 3x2.5mm, Pipa Conduit & Saklar Tembok',
          qty: '6 Ruang Kelas',
          unitPrice: 650000,
          subtotal: 3900000,
        },
        {
          name: 'Bracket Baja Siku, Dynabolt & Jasa Pasang Teknisi Resmi',
          qty: '18 Titik',
          unitPrice: 77777,
          subtotal: 1400000,
        },
      ],
    },
    geotag: {
      lat: '-6.5582',
      lng: '106.7029',
      roomLabel: 'Ruang Kelas 2A SDN Contoh Ciampea 01',
      uploadedAt: '14 Okt 2026 09:42 WIB',
      inspectorNote: 'Terpasang 3 unit di dinding utara & selatan ruang kelas 2A. Nomor seri aset BOSP-2026-KA04 s/d KA06.',
      conditionStatus: 'Terverifikasi Fisik & Koordinat GPS Sesuai Dapodik',
    },
  },
  {
    id: 'item-cat-02',
    code: 'RKAS-05.02.03',
    name: 'Cat Tembok Ruang Kelas & Pelapis Anti-Bocor',
    unitSummary: '4 Ruang & Koridor',
    amount: 12500000,
    category: 'Pemeliharaan Sarana & Prasarana Sekolah',
    aiCategoryPath: 'Pemeliharaan Sarpras > Pengecatan & Waterproofing Kelas',
    date: '03 September 2026',
    stage: 'Tahap 2',
    allocation: 'Pengecatan ulang dinding kelas 4A, 4B, 5A, koridor utama, serta pelapis anti-bocor atap perpustakaan',
    iconType: 'paint',
    keywords: [
      'cat',
      'cat kelas',
      'tembok',
      'dinding',
      'bocor',
      'atap',
      'rembes',
      'renovasi',
      'cat tembok',
      'plafon',
      'kusam',
    ],
    invoice: {
      number: 'FAK/SB-CMP/2026/09/0419',
      vendorName: 'TB Sumber Bangunan Ciampea (Mitra SIPLah)',
      vendorAddress: 'Jl. Raya Ciampea KM 12 No. 45, Kab. Bogor',
      npwp: '01.923.441.8-403.000',
      date: '03 September 2026',
      treasurerName: 'Hj. Ratna Suminar, S.Pd.',
      principalName: 'Drs. H. Bambang Sutrisno, M.Pd.',
      lineItems: [
        {
          name: 'Cat Tembok Interior Acrylic Emulsion Pail 25 Kg (Putih Gading)',
          qty: '10 Pail',
          unitPrice: 780000,
          subtotal: 7800000,
        },
        {
          name: 'Pelapis Anti-Bocor Elastomeric Waterproofing 20 Kg',
          qty: '4 Pail',
          unitPrice: 850000,
          subtotal: 3400000,
        },
        {
          name: 'Plamir Tembok, Amplas, Roller Heavy Duty & Perlengkapan Cat',
          qty: '1 Paket',
          unitPrice: 1300000,
          subtotal: 1300000,
        },
      ],
    },
    geotag: {
      lat: '-6.5584',
      lng: '106.7031',
      roomLabel: 'Koridor & Ruang Kelas 4A SDN Contoh Ciampea 01',
      uploadedAt: '06 Sep 2026 11:15 WIB',
      inspectorNote: 'Dinding bagian dalam dan luar kelas 4A–5A telah dicat ulang. Atap perpustakaan sudah dilapisi membran anti-bocor.',
      conditionStatus: 'Terverifikasi Fisik & Koordinat GPS Sesuai Dapodik',
    },
  },
  {
    id: 'item-buku-03',
    code: 'RKAS-03.01.01',
    name: 'Buku Bacaan Perpustakaan & Kurikulum Nasional',
    unitSummary: '1.170 Eksemplar',
    amount: 40000000,
    category: 'Pengembangan Perpustakaan & Buku Teks Utama',
    aiCategoryPath: 'Pengembangan Perpustakaan > Buku Teks & Bacaan Literasi',
    date: '18 Juli 2026',
    stage: 'Tahap 2',
    allocation: 'Pengadaan 850 eksemplar buku teks utama Kelas 1–6 dan 320 buku cerita literasi siswa (Dipinjamkan gratis)',
    iconType: 'book',
    keywords: [
      'buku',
      'buku cerita',
      'perpustakaan',
      'lks',
      'modul',
      'bacaan',
      'kurikulum',
      'cetak',
      'paket',
      'literasi',
      'buku paket',
    ],
    invoice: {
      number: 'BP-EDU/SIPLAH/2026/07/7712',
      vendorName: 'PT Pustaka Edukasi Nusantara (Penyedia Resmi Kemendikdasmen)',
      vendorAddress: 'Jl. Gunung Sahari Raya No. 62, Jakarta Pusat',
      npwp: '01.334.889.2-021.000',
      date: '18 Juli 2026',
      treasurerName: 'Hj. Ratna Suminar, S.Pd.',
      principalName: 'Drs. H. Bambang Sutrisno, M.Pd.',
      lineItems: [
        {
          name: 'Buku Teks Utama Kurikulum Nasional SD Kelas 1–6 (SK Pusbuk)',
          qty: '850 Eks',
          unitPrice: 34000,
          subtotal: 28900000,
        },
        {
          name: 'Buku Pengayaan Literasi & Cerita Anak Bergambar Berjenjang',
          qty: '320 Eks',
          unitPrice: 34687.5,
          subtotal: 11100000,
        },
      ],
    },
    geotag: {
      lat: '-6.5580',
      lng: '106.7027',
      roomLabel: 'Ruang Perpustakaan SDN Contoh Ciampea 01',
      uploadedAt: '20 Jul 2026 13:20 WIB',
      inspectorNote: 'Seluruh buku telah diberi stempel inventaris milik negara / BOSP 2026 dan dipinjamkan tanpa biaya ke seluruh siswa.',
      conditionStatus: 'Terverifikasi Fisik & Koordinat GPS Sesuai Dapodik',
    },
  },
  {
    id: 'item-proyektor-04',
    code: 'RKAS-04.06.08',
    name: 'Proyektor LCD & Layar Interaktif Kelas',
    unitSummary: '4 Set Lengkap',
    amount: 28000000,
    category: 'Penyediaan Alat Multimedia Pembelajaran',
    aiCategoryPath: 'Peralatan Multimedia > Proyektor LCD & Layar Kelas',
    date: '24 Agustus 2026',
    stage: 'Tahap 2',
    allocation: '4 unit Proyektor XGA 3.800 Lumens beserta layar gantung manual 70 inch untuk Kelas 5A, 5B, 6A, dan 6B',
    iconType: 'projector',
    keywords: [
      'proyektor',
      'infocus',
      'layar',
      'lcd',
      'multimedia',
      'komputer',
      'presentasi',
      'monitor',
      'tv',
      'visual',
    ],
    invoice: {
      number: 'DSM/INV-SIPLAH/2026/08/0311',
      vendorName: 'CV Digital Sarana Mandiri',
      vendorAddress: 'Jl. Pajajaran Indah V No. 19, Kota Bogor',
      npwp: '03.118.762.9-404.000',
      date: '24 Agustus 2026',
      treasurerName: 'Hj. Ratna Suminar, S.Pd.',
      principalName: 'Drs. H. Bambang Sutrisno, M.Pd.',
      lineItems: [
        {
          name: 'Proyektor Edukasi 3.800 ANSI Lumens HDMI/VGA Garansi Resmi 2 Thn',
          qty: '4 Unit',
          unitPrice: 5650000,
          subtotal: 22600000,
        },
        {
          name: 'Layar Proyektor Dinding Manual Wall Screen 70" + Bracket Langit-langit',
          qty: '4 Set',
          unitPrice: 1350000,
          subtotal: 5400000,
        },
      ],
    },
    geotag: {
      lat: '-6.5583',
      lng: '106.7030',
      roomLabel: 'Ruang Kelas 6A SDN Contoh Ciampea 01',
      uploadedAt: '26 Agu 2026 10:05 WIB',
      inspectorNote: 'Unit proyektor terpasang di plafon tengah kelas 6A dengan pelindung kunci besi dan kabel HDMI ke meja guru.',
      conditionStatus: 'Terverifikasi Fisik & Koordinat GPS Sesuai Dapodik',
    },
  },
  {
    id: 'item-sanitasi-05',
    code: 'RKAS-05.08.14',
    name: 'Perbaikan Sanitasi & Wastafel Siswa',
    unitSummary: '6 Bilik & 8 Wastafel',
    amount: 18500000,
    category: 'Pemeliharaan Kamar Mandi & Sanitasi Sekolah',
    aiCategoryPath: 'Pemeliharaan Sanitasi > Kamar Mandi & Wastafel Siswa',
    date: '15 Mei 2026',
    stage: 'Tahap 1',
    allocation: 'Perbaikan 6 bilik kamar mandi siswa, penggantian keran air bersih, pompa pendorong, dan 8 titik wastafel cuci tangan',
    iconType: 'sanitation',
    keywords: [
      'kamar mandi',
      'toilet',
      'wc',
      'sanitasi',
      'wastafel',
      'air',
      'keran',
      'pipa',
      'sabun',
      'cuci tangan',
      'pompa',
    ],
    invoice: {
      number: 'KT-SAN/2026/05/0198',
      vendorName: 'CV Karya Teknik Sanitasi',
      vendorAddress: 'Jl. KH. Abdullah Bin Nuh No. 88, Bogor',
      npwp: '02.441.908.1-403.000',
      date: '15 Mei 2026',
      treasurerName: 'Hj. Ratna Suminar, S.Pd.',
      principalName: 'Drs. H. Bambang Sutrisno, M.Pd.',
      lineItems: [
        {
          name: 'Renovasi Keramik Lantai Anti-Slip & Kloset Jongkok SNI (6 Bilik)',
          qty: '6 Bilik',
          unitPrice: 1750000,
          subtotal: 10500000,
        },
        {
          name: 'Wastafel Cuci Tangan Keramik + Keran Air Kuningan + Pipa PVC AW',
          qty: '8 Titik',
          unitPrice: 750000,
          subtotal: 6000000,
        },
        {
          name: 'Pompa Air Pendorong Otomatis & Toren Bersih',
          qty: '1 Unit',
          unitPrice: 2000000,
          subtotal: 2000000,
        },
      ],
    },
    geotag: {
      lat: '-6.5585',
      lng: '106.7028',
      roomLabel: 'Area Sanitasi Barat SDN Contoh Ciampea 01',
      uploadedAt: '17 Mei 2026 14:50 WIB',
      inspectorNote: 'Air mengalir lancar di seluruh 6 bilik toilet siswa putra/putri dan 8 wastafel depan kelas.',
      conditionStatus: 'Terverifikasi Fisik & Koordinat GPS Sesuai Dapodik',
    },
  },
  {
    id: 'item-meja-06',
    code: 'RKAS-05.04.02',
    name: 'Meja & Kursi Belajar Siswa Ergonomis (25 Set)',
    unitSummary: '25 Set Meja Kursi',
    amount: 22500000,
    category: 'Pemeliharaan & Pengadaan Meubelair Kelas',
    aiCategoryPath: 'Sarana Ruang Kelas > Meja & Kursi Siswa',
    date: '10 April 2026',
    stage: 'Tahap 1',
    allocation: 'Penggantian meja dan kursi kayu rangka besi hollow yang rusak di ruang kelas 3A dan 3B',
    iconType: 'desk',
    keywords: [
      'meja',
      'kursi',
      'bangku',
      'meubelair',
      'kayu',
      'duduk',
      'belajar',
      'meja kelas',
      'kursi kelas',
    ],
    invoice: {
      number: 'MPN/SIPLAH/2026/04/0054',
      vendorName: 'UD Mebel Pendidikan Nusantara',
      vendorAddress: 'Jl. Raya Dramaga KM 8, Kab. Bogor',
      npwp: '04.112.559.7-403.000',
      date: '10 April 2026',
      treasurerName: 'Hj. Ratna Suminar, S.Pd.',
      principalName: 'Drs. H. Bambang Sutrisno, M.Pd.',
      lineItems: [
        {
          name: 'Set Meja & Kursi Tunggal Siswa Rangka Besi Powder Coating (SNI)',
          qty: '25 Set',
          unitPrice: 900000,
          subtotal: 22500000,
        },
      ],
    },
    geotag: {
      lat: '-6.5581',
      lng: '106.7029',
      roomLabel: 'Ruang Kelas 3B SDN Contoh Ciampea 01',
      uploadedAt: '12 Apr 2026 08:30 WIB',
      inspectorNote: '25 set meja kursi baru telah ditempatkan di Kelas 3A (12 set) dan Kelas 3B (13 set).',
      conditionStatus: 'Terverifikasi Fisik & Koordinat GPS Sesuai Dapodik',
    },
  },
];

export const SCHOOLS_DATABASE: SchoolData[] = [
  {
    id: 'sdn-ciampea-01',
    name: 'SDN Contoh Ciampea 01',
    npsn: '20201234',
    sampleNisn: '0114829102',
    provinsi: 'Jawa Barat',
    kabupaten: 'Kab. Bogor',
    kecamatan: 'Ciampea',
    address: 'Jl. Pendidikan Raya No. 12, Kec. Ciampea, Kab. Bogor',
    status: 'Terverifikasi Dapodik & BOSP 2026',
    studentCount: 500,
    perStudentEstimate: 900000,
    totalBosp: 450000000,
    tahap1: {
      amount: 225000000,
      period: 'Jan–Jun',
      status: 'Sudah Cair',
      disbursedDate: '14 Februari 2026',
    },
    tahap2: {
      amount: 225000000,
      period: 'Jul–Des',
      status: 'Sudah Cair',
      disbursedDate: '04 Agustus 2026',
    },
    compositions: [
      {
        id: 'comp-1',
        label: 'Perawatan & Peralatan Kelas',
        percentage: 40,
        amount: 180000000,
        color: '#2E7D32',
        description: 'Kipas angin kelas, pengecatan dinding, proyektor, meja kursi, dan perbaikan sanitasi siswa.',
      },
      {
        id: 'comp-2',
        label: 'Buku & Kegiatan Belajar',
        percentage: 35,
        amount: 157500000,
        color: '#2E6496',
        description: 'Buku teks utama kurikulum nasional, buku cerita perpustakaan, asesmen, dan ekstrakurikuler.',
      },
      {
        id: 'comp-3',
        label: 'Operasional & Daya Jasa',
        percentage: 25,
        amount: 112500000,
        color: '#D97706',
        description: 'Langganan listrik, air bersih, internet sekolah, administrasi pembelajaran, dan honorarium non-ASN.',
      },
    ],
    items: DEFAULT_ITEMS_CIAMPEA,
  },
  {
    id: 'smpn-1-ciampea',
    name: 'SMPN 1 Ciampea',
    npsn: '20201889',
    sampleNisn: '0098412033',
    provinsi: 'Jawa Barat',
    kabupaten: 'Kab. Bogor',
    kecamatan: 'Ciampea',
    address: 'Jl. Letjen Sukma KM 14, Kec. Ciampea, Kab. Bogor',
    status: 'Terverifikasi Dapodik & BOSP 2026',
    studentCount: 640,
    perStudentEstimate: 1100000,
    totalBosp: 704000000,
    tahap1: {
      amount: 352000000,
      period: 'Jan–Jun',
      status: 'Sudah Cair',
      disbursedDate: '16 Februari 2026',
    },
    tahap2: {
      amount: 352000000,
      period: 'Jul–Des',
      status: 'Sudah Cair',
      disbursedDate: '06 Agustus 2026',
    },
    compositions: [
      {
        id: 'comp-1',
        label: 'Perawatan & Peralatan Kelas',
        percentage: 38,
        amount: 267520000,
        color: '#2E7D32',
        description: 'Peralatan laboratorium IPA, kipas angin ruang kelas, dan pemeliharaan kamar mandi.',
      },
      {
        id: 'comp-2',
        label: 'Buku & Kegiatan Belajar',
        percentage: 37,
        amount: 260480000,
        color: '#2E6496',
        description: 'Buku teks SMP Kelas 7–9, praktikum siswa, dan kegiatan kesiswaan.',
      },
      {
        id: 'comp-3',
        label: 'Operasional & Daya Jasa',
        percentage: 25,
        amount: 176000000,
        color: '#D97706',
        description: 'Listrik laboratorium komputer, internet fiber optik, dan operasional sekolah.',
      },
    ],
    items: DEFAULT_ITEMS_CIAMPEA,
  },
  {
    id: 'sdn-cibinong-02',
    name: 'SDN Cibinong Terpadu 02',
    npsn: '20201455',
    sampleNisn: '0123910441',
    provinsi: 'Jawa Barat',
    kabupaten: 'Kab. Bogor',
    kecamatan: 'Cibinong',
    address: 'Jl. Tegar Beriman No. 28, Kec. Cibinong, Kab. Bogor',
    status: 'Terverifikasi Dapodik & BOSP 2026',
    studentCount: 520,
    perStudentEstimate: 900000,
    totalBosp: 468000000,
    tahap1: {
      amount: 234000000,
      period: 'Jan–Jun',
      status: 'Sudah Cair',
      disbursedDate: '12 Februari 2026',
    },
    tahap2: {
      amount: 234000000,
      period: 'Jul–Des',
      status: 'Sudah Cair',
      disbursedDate: '05 Agustus 2026',
    },
    compositions: [
      {
        id: 'comp-1',
        label: 'Perawatan & Peralatan Kelas',
        percentage: 40,
        amount: 187200000,
        color: '#2E7D32',
        description: 'Pendingin udara kelas, perbaikan atap, dan pengadaan proyektor.',
      },
      {
        id: 'comp-2',
        label: 'Buku & Kegiatan Belajar',
        percentage: 35,
        amount: 163800000,
        color: '#2E6496',
        description: 'Pengadaan buku kurikulum nasional dan pojok baca kelas.',
      },
      {
        id: 'comp-3',
        label: 'Operasional & Daya Jasa',
        percentage: 25,
        amount: 117000000,
        color: '#D97706',
        description: 'Tagihan utilitas bulanan, bahan habis pakai, dan layanan administrasi.',
      },
    ],
    items: DEFAULT_ITEMS_CIAMPEA,
  },
  {
    id: 'sdn-coblong-04',
    name: 'SDN Coblong Bakti 04 Bandung',
    npsn: '20245109',
    sampleNisn: '0119982310',
    provinsi: 'Jawa Barat',
    kabupaten: 'Kota Bandung',
    kecamatan: 'Coblong',
    address: 'Jl. Ir. H. Juanda No. 154, Kec. Coblong, Kota Bandung',
    status: 'Terverifikasi Dapodik & BOSP 2026',
    studentCount: 480,
    perStudentEstimate: 960000,
    totalBosp: 460800000,
    tahap1: {
      amount: 230400000,
      period: 'Jan–Jun',
      status: 'Sudah Cair',
      disbursedDate: '18 Februari 2026',
    },
    tahap2: {
      amount: 230400000,
      period: 'Jul–Des',
      status: 'Sudah Cair',
      disbursedDate: '08 Agustus 2026',
    },
    compositions: [
      {
        id: 'comp-1',
        label: 'Perawatan & Peralatan Kelas',
        percentage: 40,
        amount: 184320000,
        color: '#2E7D32',
        description: 'Pemeliharaan ruang belajar, sirkulasi udara, dan sanitasi.',
      },
      {
        id: 'comp-2',
        label: 'Buku & Kegiatan Belajar',
        percentage: 35,
        amount: 161280000,
        color: '#2E6496',
        description: 'Buku perpustakaan, alat peraga edukatif, dan asesmen.',
      },
      {
        id: 'comp-3',
        label: 'Operasional & Daya Jasa',
        percentage: 25,
        amount: 115200000,
        color: '#D97706',
        description: 'Daya jasa listrik, air PDAM, dan operasional rutin.',
      },
    ],
    items: DEFAULT_ITEMS_CIAMPEA,
  },
  {
    id: 'sdn-menteng-01',
    name: 'SDN Menteng 01 Pagi',
    npsn: '20100214',
    sampleNisn: '0117739201',
    provinsi: 'DKI Jakarta',
    kabupaten: 'Jakarta Pusat',
    kecamatan: 'Menteng',
    address: 'Jl. Besuki No. 4, Kec. Menteng, Jakarta Pusat',
    status: 'Terverifikasi Dapodik & BOSP 2026',
    studentCount: 540,
    perStudentEstimate: 1020000,
    totalBosp: 550800000,
    tahap1: {
      amount: 275400000,
      period: 'Jan–Jun',
      status: 'Sudah Cair',
      disbursedDate: '10 Februari 2026',
    },
    tahap2: {
      amount: 275400000,
      period: 'Jul–Des',
      status: 'Sudah Cair',
      disbursedDate: '03 Agustus 2026',
    },
    compositions: [
      {
        id: 'comp-1',
        label: 'Perawatan & Peralatan Kelas',
        percentage: 40,
        amount: 220320000,
        color: '#2E7D32',
        description: 'Sarana multimedia kelas, pendingin ruangan, dan pemeliharaan gedung.',
      },
      {
        id: 'comp-2',
        label: 'Buku & Kegiatan Belajar',
        percentage: 35,
        amount: 192780000,
        color: '#2E6496',
        description: 'Buku literasi, pengembangan kurikulum, dan kegiatan ekstrakurikuler.',
      },
      {
        id: 'comp-3',
        label: 'Operasional & Daya Jasa',
        percentage: 25,
        amount: 137700000,
        color: '#D97706',
        description: 'Utilitas gedung, internet kelas pintar, dan administrasi.',
      },
    ],
    items: DEFAULT_ITEMS_CIAMPEA,
  },
  {
    id: 'sdn-banyumanik-01',
    name: 'SDN Banyumanik 01 Semarang',
    npsn: '20329104',
    sampleNisn: '0120048192',
    provinsi: 'Jawa Tengah',
    kabupaten: 'Kota Semarang',
    kecamatan: 'Banyumanik',
    address: 'Jl. Karangrejo Raya No. 18, Kec. Banyumanik, Kota Semarang',
    status: 'Terverifikasi Dapodik & BOSP 2026',
    studentCount: 450,
    perStudentEstimate: 920000,
    totalBosp: 414000000,
    tahap1: {
      amount: 207000000,
      period: 'Jan–Jun',
      status: 'Sudah Cair',
      disbursedDate: '15 Februari 2026',
    },
    tahap2: {
      amount: 207000000,
      period: 'Jul–Des',
      status: 'Sudah Cair',
      disbursedDate: '07 Agustus 2026',
    },
    compositions: [
      {
        id: 'comp-1',
        label: 'Perawatan & Peralatan Kelas',
        percentage: 40,
        amount: 165600000,
        color: '#2E7D32',
        description: 'Kipas angin ruang belajar, renovasi sanitasi, dan papan tulis.',
      },
      {
        id: 'comp-2',
        label: 'Buku & Kegiatan Belajar',
        percentage: 35,
        amount: 144900000,
        color: '#2E6496',
        description: 'Koleksi perpustakaan dan asesmen nasional.',
      },
      {
        id: 'comp-3',
        label: 'Operasional & Daya Jasa',
        percentage: 25,
        amount: 103500000,
        color: '#D97706',
        description: 'Daya listrik, air bersih, dan administrasi.',
      },
    ],
    items: DEFAULT_ITEMS_CIAMPEA,
  },
  {
    id: 'sdn-depok-sleman-01',
    name: 'SDN Percobaan Depok 01 Sleman',
    npsn: '20401128',
    sampleNisn: '0116501928',
    provinsi: 'DI Yogyakarta',
    kabupaten: 'Kab. Sleman',
    kecamatan: 'Depok',
    address: 'Jl. Kaliurang KM 6.5, Kec. Depok, Kab. Sleman',
    status: 'Terverifikasi Dapodik & BOSP 2026',
    studentCount: 490,
    perStudentEstimate: 910000,
    totalBosp: 445900000,
    tahap1: {
      amount: 222950000,
      period: 'Jan–Jun',
      status: 'Sudah Cair',
      disbursedDate: '14 Februari 2026',
    },
    tahap2: {
      amount: 222950000,
      period: 'Jul–Des',
      status: 'Sudah Cair',
      disbursedDate: '05 Agustus 2026',
    },
    compositions: [
      {
        id: 'comp-1',
        label: 'Perawatan & Peralatan Kelas',
        percentage: 40,
        amount: 178360000,
        color: '#2E7D32',
        description: 'Pemeliharaan peralatan kelas, kipas angin, dan meubelair.',
      },
      {
        id: 'comp-2',
        label: 'Buku & Kegiatan Belajar',
        percentage: 35,
        amount: 156065000,
        color: '#2E6496',
        description: 'Buku kurikulum dan kegiatan pembelajaran.',
      },
      {
        id: 'comp-3',
        label: 'Operasional & Daya Jasa',
        percentage: 25,
        amount: 111475000,
        color: '#D97706',
        description: 'Operasional sekolah dan langganan daya jasa.',
      },
    ],
    items: DEFAULT_ITEMS_CIAMPEA,
  },
  {
    id: 'sdn-gubeng-01',
    name: 'SDN Mojo Gubeng 01 Surabaya',
    npsn: '20532811',
    sampleNisn: '0118920174',
    provinsi: 'Jawa Timur',
    kabupaten: 'Kota Surabaya',
    kecamatan: 'Gubeng',
    address: 'Jl. Dharmawangsa No. 31, Kec. Gubeng, Kota Surabaya',
    status: 'Terverifikasi Dapodik & BOSP 2026',
    studentCount: 560,
    perStudentEstimate: 950000,
    totalBosp: 532000000,
    tahap1: {
      amount: 266000000,
      period: 'Jan–Jun',
      status: 'Sudah Cair',
      disbursedDate: '13 Februari 2026',
    },
    tahap2: {
      amount: 266000000,
      period: 'Jul–Des',
      status: 'Sudah Cair',
      disbursedDate: '04 Agustus 2026',
    },
    compositions: [
      {
        id: 'comp-1',
        label: 'Perawatan & Peralatan Kelas',
        percentage: 40,
        amount: 212800000,
        color: '#2E7D32',
        description: 'Kipas angin dinding kelas, proyektor LCD, dan sanitasi.',
      },
      {
        id: 'comp-2',
        label: 'Buku & Kegiatan Belajar',
        percentage: 35,
        amount: 186200000,
        color: '#2E6496',
        description: 'Buku teks utama dan pengembangan literasi.',
      },
      {
        id: 'comp-3',
        label: 'Operasional & Daya Jasa',
        percentage: 25,
        amount: 133000000,
        color: '#D97706',
        description: 'Listrik, air bersih, dan administrasi sekolah.',
      },
    ],
    items: DEFAULT_ITEMS_CIAMPEA,
  },
];

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
    buttonLabel: 'Simulasi Screenshot 1: Iuran Kipas Angin Kelas (Indikasi Pungli)',
    shortTitle: 'Skenario A — Tumpang Tindih BOSP',
    fileName: 'Screenshot_Grup_Kelas2.jpg',
    groupName: 'Paguyuban Wali Murid Kelas 2A (2026/2027)',
    timestamp: 'Hari ini, 08:14 WIB',
    statusType: 'danger',
    statusHeader: 'STATUS AI: TERDETEKSI INDIKASI PUNGLI',
    ocrQuote:
      'Assalamualaikum Bapak/Ibu wali murid kelas 2, dimohon patungan beli kipas angin kelas Rp 50.000/siswa dikumpulkan paling lambat hari Sabtu ya...',
    bospFact:
      'Sekolah SUDAH menganggarkan dan mencairkan Rp 35.000.000 pada BOSP Tahap 2 (12 Oktober 2026) untuk pembelian Kipas Angin Dinding (Pemasangan Kelas 1–3).',
    reportCategoryPrefill:
      'Iuran Kipas Angin (Tumpang Tindih dengan Dana BOSP Rp 35.000.000)',
    attachmentLabel: '1 Foto Screenshot WA (Tersensor Otomatis)',
    primaryButtonLabel: 'Kirim Laporan Anonim Sekarang',
  },
  'scenario-b': {
    id: 'scenario-b',
    buttonLabel: 'Simulasi Screenshot 2: Kas Kelas Sukarela / Outing (Tidak Ada di BOSP)',
    shortTitle: 'Skenario B — Tidak Ada di RKAS BOSP',
    fileName: 'Screenshot_Grup_PentasSeni.jpg',
    groupName: 'Paguyuban Wali Murid Kelas 2A (2026/2027)',
    timestamp: 'Kemarin, 19:20 WIB',
    statusType: 'safe',
    statusHeader: 'STATUS AI: TIDAK ADA DI PENGAJUAN BOSP',
    ocrQuote:
      'Bapak/Ibu, untuk kegiatan pentas seni akhir semester & kaos kelas, ada usulan patungan Rp 35.000...',
    bospFact:
      'Item ini tidak ditemukan dalam daftar pengajuan anggaran BOSP SDN Contoh Ciampea 01 tahun berjalan (Tidak tumpang tindih dengan dana BOSP).',
    legalReminder:
      'Pengingat Penting: Sesuai Permendikbud No. 75 Tahun 2016, Sekolah Negeri dilarang melakukan pungutan wajib yang mengikat siswa. Jika iuran ini bersifat memaksa, Anda tetap berhak melaporkannya.',
    reportCategoryPrefill:
      'Laporan Pungutan Mengikat di Luar RKAS (Pentas Seni & Kaos Kelas Rp 35.000/siswa)',
    attachmentLabel: '1 Foto Screenshot WA (Tersensor Otomatis)',
    primaryButtonLabel: 'Tetap Laporkan Pungutan Ini',
  },
};

export const KAMUS_BOSP_DATA = {
  allowed: [
    {
      title: 'Pembelian Buku Teks Utama & Koleksi Perpustakaan',
      detail: 'Wajib dibiayai BOSP (minimal 10% dari pagu) untuk buku kurikulum nasional siswa dan buku bacaan literasi tanpa memungut biaya dari orang tua.',
      ref: 'Permendikbudristek No. 63/2023 Pasal 24',
    },
    {
      title: 'Pemeliharaan Sarana & Prasarana Ruang Kelas',
      detail: 'Termasuk pembelian/perbaikan kipas angin dinding, pengecatan tembok kelas, perbaikan atap bocor, meja kursi siswa, papan tulis, serta renovasi toilet/wastafel.',
      ref: 'Juknis BOSP Reguler Komponen 05',
    },
    {
      title: 'Langganan Daya & Jasa Operasional Sekolah',
      detail: 'Pembayaran tagihan listrik bulanan, air bersih/PDAM, langganan internet sekolah, serta pengadaan alat multimedia belajar (proyektor LCD, layar kelas).',
      ref: 'Juknis BOSP Reguler Komponen 06 & 08',
    },
    {
      title: 'Kegiatan Pembelajaran, Asesmen & Ekstrakurikuler',
      detail: 'Pelaksanaan ulangan/asesmen sekolah, praktikum, olahraga, pramuka, dan kegiatan penguatan profil pelajar di lingkungan sekolah.',
      ref: 'Juknis BOSP Reguler Komponen 03 & 04',
    },
    {
      title: 'Pembayaran Honorarium Guru & Tenaga Kependidikan Non-ASN',
      detail: 'Dapat digunakan hingga maksimal 50% dari total dana BOSP untuk guru honorer yang tercatat di Dapodik dan memiliki NUPTK.',
      ref: 'Permendikbudristek No. 63/2023 Pasal 39',
    },
  ],
  prohibited: [
    {
      title: 'Meminta Iuran untuk Barang yang Sudah Dianggarkan di BOSP',
      detail: 'Dilarang keras memungut uang patungan dari wali murid untuk pembelian kipas angin, cat kelas, buku paket, spidol, atau perbaikan toilet yang dananya sudah cair di RKAS BOSP.',
      ref: 'Indikasi Pungutan Liar / Tumpang Tindih Anggaran',
    },
    {
      title: 'Pungutan Wajib Berkedok Sumbangan di Sekolah Negeri',
      detail: 'Komite Sekolah maupun Paguyuban dilarang menarik pungutan yang menentukan nominal tetap dan batas waktu pembayaran yang mengikat bagi siswa/orang tua.',
      ref: 'Permendikbud No. 75 Tahun 2016 Pasal 10 & 12',
    },
    {
      title: 'Menjual Buku Pelajaran, LKS, atau Seragam Secara Memaksa',
      detail: 'Satuan pendidikan dan pendidik dilarang menjadi distributor atau mewajibkan pembelian buku lembar kerja siswa (LKS) dan atribut tertentu di sekolah.',
      ref: 'PP No. 17 Tahun 2010 Pasal 181',
    },
    {
      title: 'Menahan Rapor, Ijazah, atau Hak Ujian Karena Tunggakan Iuran',
      detail: 'Sekolah negeri tidak diperbolehkan mengaitkan layanan akademik atau administrasi kelulusan siswa dengan kewajiban iuran komite/paguyuban.',
      ref: 'Standar Pelayanan Minimal Pendidikan Nasional',
    },
  ],
};

export const formatRupiah = (amount: number): string => {
  return 'Rp ' + amount.toLocaleString('id-ID');
};
