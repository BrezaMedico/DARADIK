import {
  REGIONAL_BOSP_DATA,
  REGIONAL_BOSP_BY_KABUPATEN,
} from './indonesiaRegions';
import { BAZMA_BOSP_ITEMS, SMK_TI_BAZMA } from './bazmaSchoolData';
import type {
  BospRealizationItem,
  BudgetComposition,
  SchoolData,
  SchoolEducationLevel,
  SchoolOwnershipType,
} from '@/types/school';

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

  // Baseline national minimum rates when a custom region is outside the 514 listed districts.
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

// Enforces Permendikdasmen 2026 thresholds: library >= 10%, maintenance <= 20%, honorarium <= 20% (Negeri) or <= 40% (Swasta).
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
  const perpustakaanPct = 12 + (seq % 7);
  const sarprasPct = 13 + ((seq * 3) % 7);
  const honorPct =
    schoolType === 'Swasta'
      ? 26 + ((seq * 5) % 12)
      : 12 + ((seq * 5) % 8);
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

// Generates 8 schools per district (public and private for SD, SMP, SMA, SMK) across all 514 districts.
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
        studentCount: 180 + ((regionNo * 13) % 180),
      },
      {
        prefix: 'SDS',
        schoolName: `SD Swasta ${fSd} ${kabupaten}`,
        street: `Jl. Yayasan Pendidikan Dasar No. ${((regionNo * 2) % 85) + 7}`,
        schoolType: 'Swasta',
        educationLevel: 'SD',
        perStudentRate: region.sd,
        studentCount: 120 + ((regionNo * 11) % 140),
      },
      {
        prefix: 'SMPN 1',
        schoolName: `SMP Negeri 1 ${kabupaten}`,
        street: `Jl. Pendidikan Menengah Pertama No. ${((regionNo * 3) % 90) + 10}`,
        schoolType: 'Negeri',
        educationLevel: 'SMP',
        perStudentRate: region.smp,
        studentCount: 250 + ((regionNo * 17) % 240),
      },
      {
        prefix: 'SMPS',
        schoolName: `SMP Swasta ${fSmp} ${kabupaten}`,
        street: `Jl. Yayasan Menengah Pertama No. ${((regionNo * 4) % 95) + 9}`,
        schoolType: 'Swasta',
        educationLevel: 'SMP',
        perStudentRate: region.smp,
        studentCount: 140 + ((regionNo * 19) % 170),
      },
      {
        prefix: 'SMAN 1',
        schoolName: `SMA Negeri 1 ${kabupaten}`,
        street: `Jl. Raya Utama Pendidikan No. ${((regionNo * 5) % 110) + 12}`,
        schoolType: 'Negeri',
        educationLevel: 'SMA',
        perStudentRate: region.sma,
        studentCount: 320 + ((regionNo * 23) % 320),
      },
      {
        prefix: 'SMAS',
        schoolName: `SMA Swasta ${fSma} ${kabupaten}`,
        street: `Jl. Yayasan Pendidikan Menengah No. ${((regionNo * 6) % 95) + 8}`,
        schoolType: 'Swasta',
        educationLevel: 'SMA',
        perStudentRate: region.sma,
        studentCount: 150 + ((regionNo * 15) % 210),
      },
      {
        prefix: 'SMKN 1',
        schoolName: `SMK Negeri 1 ${kabupaten}`,
        street: `Jl. Pendidikan Kejuruan No. ${((regionNo * 7) % 88) + 10}`,
        schoolType: 'Negeri',
        educationLevel: 'SMK',
        perStudentRate: region.smk,
        studentCount: 350 + ((regionNo * 21) % 340),
      },
      {
        prefix: 'SMKS',
        schoolName: `SMK Swasta ${fSmk} ${kabupaten}`,
        street: `Jl. Kejuruan Terpadu No. ${((regionNo * 8) % 92) + 6}`,
        schoolType: 'Swasta',
        educationLevel: 'SMK',
        perStudentRate: region.smk,
        studentCount: 160 + ((regionNo * 17) % 220),
        // SMK TI BAZMA already fills the private SMK slot for Kab. Bogor.
        skip: isKabBogor,
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
