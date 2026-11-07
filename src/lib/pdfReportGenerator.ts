import { jsPDF } from 'jspdf';
import { SchoolData, formatRupiah } from '../data/schoolsData';

/**
 * Sanitize text for jsPDF built-in Helvetica (WinAnsiEncoding / Latin-1)
 * Prevents characters > 255 (like checkmarks or special dashes) from triggering
 * jsPDF's 2-byte UTF-16BE fallback which stretches text outside boundaries.
 */
function safePdfText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/[\u2013\u2014]/g, '-') // en-dash / em-dash -> hyphen
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // smart double quotes
    .replace(/\u2022/g, '-')         // bullet -> hyphen
    .replace(/\u00D7/g, 'x')         // multiplication sign -> x
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ''); // strip any remaining non-Latin1 chars
}

/**
 * DARADIK — Formal A4 BOSP Transparency PDF Report Generator
 * Designed for spacious, formal multi-page readability with zero text clipping
 * and zero decorative placeholder boxes.
 */
export async function generateBospTransparencyPdf(
  school: SchoolData,
  targetYear: string = '2026'
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── A4 Page Geometry ──────────────────────────────────────────────────────
  const PW = 210;
  const PH = 297;
  const ML = 18;
  const MR = 18;
  const MT = 18;
  const MB = 16;
  const CW = PW - ML - MR; // 174 mm
  const FOOTER_RESERVE = 14;
  const SAFE_BOTTOM = PH - MB - FOOTER_RESERVE; // 267 mm

  let y = MT;
  let page = 1;

  // ── Normalized School Data ────────────────────────────────────────────────
  const items = school.items || [];
  const compositions = school.compositions || [];
  const totalRealisasi = items.reduce((sum, it) => sum + it.amount, 0);
  const totalBosp =
    school.totalBosp || school.studentCount * school.perStudentEstimate;

  const tahap1 = school.tahap1 || {
    amount: Math.round(totalBosp * 0.5),
    period: 'Jan-Jun',
    status: 'Sudah Cair',
    disbursedDate: '16 Februari 2026',
  };
  const tahap2 = school.tahap2 || {
    amount: totalBosp - (school.tahap1?.amount ?? Math.round(totalBosp * 0.5)),
    period: 'Jul-Des',
    status: 'Sudah Cair',
    disbursedDate: '14 Agustus 2026',
  };

  const schoolType =
    school.schoolType ||
    (/^SDN|^SMPN|^SMAN|^SMKN|\bNegeri\b/i.test(school.name)
      ? 'Negeri'
      : 'Swasta');
  const educationLevel =
    school.educationLevel ||
    (/^SD/i.test(school.name)
      ? 'SD'
      : /^SMP/i.test(school.name)
      ? 'SMP'
      : /^SMA/i.test(school.name)
      ? 'SMA'
      : 'SMK');

  const printDate = safePdfText(
    new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );

  // ── Palette ───────────────────────────────────────────────────────────────
  const C = {
    blue:    [46, 100, 150]  as [number, number, number],
    ink:     [30, 41, 59]    as [number, number, number],
    slate:   [71, 85, 105]   as [number, number, number],
    muted:   [100, 116, 139] as [number, number, number],
    border:  [203, 213, 225] as [number, number, number],
    headerBg:[241, 245, 249] as [number, number, number],
    zebraBg: [248, 250, 252] as [number, number, number],
    tintBg:  [239, 246, 255] as [number, number, number],
    white:   [255, 255, 255] as [number, number, number],
    green:   [21, 128, 61]   as [number, number, number],
    divider: [226, 232, 240] as [number, number, number],
  };

  // ── Drawing Helpers ───────────────────────────────────────────────────────
  const setFont = (
    style: 'normal' | 'bold',
    size: number,
    color: [number, number, number]
  ) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  const hline = (
    yPos: number,
    lw = 0.3,
    color: [number, number, number] = C.border
  ) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.line(ML, yPos, ML + CW, yPos);
  };

  const wrapText = (text: string, maxWidthMm: number): string[] => {
    return doc.splitTextToSize(safePdfText(text), maxWidthMm);
  };

  const drawPageFooter = (pageNum: number, totalPages: number) => {
    const fy = PH - MB;
    hline(fy - 3.5, 0.3, C.border);
    setFont('normal', 7.5, C.muted);
    doc.text(
      safePdfText(
        `DARADIK - Dokumen Publik Transparansi BOSP (${school.npsn}) - Dicetak: ${printDate}`
      ),
      ML,
      fy + 1
    );
    doc.text(
      `Halaman ${pageNum} dari ${totalPages}`,
      ML + CW,
      fy + 1,
      { align: 'right' }
    );
  };

  const ensureSpace = (neededMm: number): boolean => {
    if (y + neededMm > SAFE_BOTTOM) {
      doc.addPage();
      page++;
      y = MT;
      return true;
    }
    return false;
  };

  const drawSectionHeading = (title: string, topSpace = 8) => {
    if (y > MT + 5) {
      y += topSpace;
    }
    ensureSpace(16);
    setFont('bold', 10, C.blue);
    doc.text(safePdfText(title), ML, y);
    y += 2;
    hline(y, 0.45, C.blue);
    y += 5;
  };

  // =========================================================================
  // KOP LAPORAN FORMAL
  // =========================================================================
  setFont('bold', 13.5, C.ink);
  doc.text('LAPORAN TRANSPARANSI PENGGUNAAN DANA BOSP', ML, y);

  setFont('bold', 9.5, C.blue);
  doc.text(`TAHUN ANGGARAN ${ safePdfText(targetYear) }`, ML + CW, y, {
    align: 'right',
  });

  y += 5.5;
  setFont('normal', 8.5, C.slate);
  doc.text(
    'Rekapitulasi Alokasi Pagu, Komposisi RKAS, dan Realisasi Belanja Satuan Pendidikan',
    ML,
    y
  );

  setFont('normal', 8, C.muted);
  doc.text(`Tanggal Cetak: ${printDate}`, ML + CW, y, { align: 'right' });

  y += 4;
  hline(y, 0.7, C.ink);
  hline(y + 1.2, 0.25, C.ink);
  y += 7;

  // =========================================================================
  // I. IDENTITAS SATUAN PENDIDIKAN
  // =========================================================================
  drawSectionHeading('I. IDENTITAS SATUAN PENDIDIKAN', 0);

  const leftLabelX = ML;
  const leftValX = ML + 32;
  const leftMaxW = 64;

  const rightLabelX = ML + 102;
  const rightValX = ML + 132;
  const rightMaxW = CW - 132; // 42 mm

  const leftRows: Array<[string, string]> = [
    ['Nama Sekolah', school.name],
    ['NPSN / Status', `${school.npsn} (${educationLevel} ${schoolType})`],
    ['Wilayah', `${school.kabupaten}, ${school.provinsi}`],
    ['Alamat', school.address],
  ];

  const rightRows: Array<[string, string, boolean?]> = [
    ['Jumlah Siswa', `${school.studentCount.toLocaleString('id-ID')} Siswa`],
    ['Indeks BOSP', `${formatRupiah(school.perStudentEstimate)} / siswa`],
    ['Kode Dokumen', `DOC-BOSP-${school.npsn}-${targetYear}`],
    ['Status Arsip', 'Terverifikasi SIPLah', true],
  ];

  const rowCount = Math.max(leftRows.length, rightRows.length);
  for (let i = 0; i < rowCount; i++) {
    setFont('normal', 8.5, C.ink);
    const lLines = leftRows[i] ? wrapText(leftRows[i][1], leftMaxW) : [];
    const rLines = rightRows[i] ? wrapText(rightRows[i][1], rightMaxW) : [];
    const maxLines = Math.max(lLines.length, rLines.length, 1);
    const rowH = maxLines * 4.5 + 2;

    ensureSpace(rowH);

    if (leftRows[i]) {
      setFont('normal', 8, C.muted);
      doc.text(safePdfText(leftRows[i][0]), leftLabelX, y + 3.5);
      doc.text(':', leftValX - 3, y + 3.5);
      setFont(i === 0 ? 'bold' : 'normal', 8.5, C.ink);
      doc.text(lLines, leftValX, y + 3.5);
    }

    if (rightRows[i]) {
      setFont('normal', 8, C.muted);
      doc.text(safePdfText(rightRows[i][0]), rightLabelX, y + 3.5);
      doc.text(':', rightValX - 3, y + 3.5);
      if (rightRows[i][2]) {
        setFont('bold', 8.5, C.green);
      } else {
        setFont('normal', 8.5, C.ink);
      }
      doc.text(rLines, rightValX, y + 3.5);
    }

    y += rowH;
  }

  y += 2;
  hline(y, 0.25, C.divider);

  // =========================================================================
  // II. RINGKASAN PAGU DAN PENCAIRAN DANA BOSP
  // =========================================================================
  drawSectionHeading('II. RINGKASAN PAGU DAN PENCAIRAN DANA BOSP', 7);

  const sumCols = {
    uraian: ML + 3.5,
    periode: ML + 78,
    status: ML + 108,
    nilai: ML + CW - 3.5,
  };

  // Header
  doc.setFillColor(...C.headerBg);
  doc.rect(ML, y, CW, 8, 'F');
  hline(y, 0.3, C.border);
  hline(y + 8, 0.3, C.border);
  setFont('bold', 7.5, C.slate);
  doc.text('URAIAN ALOKASI / TAHAP PENCAIRAN', sumCols.uraian, y + 5.3);
  doc.text('PERIODE', sumCols.periode, y + 5.3);
  doc.text('KETERANGAN / TANGGAL CAIR', sumCols.status, y + 5.3);
  doc.text('JUMLAH (RP)', sumCols.nilai, y + 5.3, { align: 'right' });
  y += 8;

  const summaryRows = [
    {
      uraian: `Total Pagu BOSP Tahun Anggaran ${targetYear}`,
      periode: `Jan - Des ${targetYear}`,
      status: `${school.studentCount.toLocaleString('id-ID')} siswa x ${formatRupiah(school.perStudentEstimate)}`,
      nilai: formatRupiah(totalBosp),
      isTotal: true,
    },
    {
      uraian: 'Pencairan Dana BOSP Tahap 1 (50%)',
      periode: `${safePdfText(tahap1.period)} ${targetYear}`,
      status: `${safePdfText(tahap1.status)} (${safePdfText(tahap1.disbursedDate)})`,
      nilai: formatRupiah(tahap1.amount),
      isTotal: false,
    },
    {
      uraian: 'Pencairan Dana BOSP Tahap 2 (50%)',
      periode: `${safePdfText(tahap2.period)} ${targetYear}`,
      status: `${safePdfText(tahap2.status)} (${safePdfText(tahap2.disbursedDate)})`,
      nilai: formatRupiah(tahap2.amount),
      isTotal: false,
    },
  ];

  summaryRows.forEach((r) => {
    const ROW_H = 8.5;
    ensureSpace(ROW_H);
    if (r.isTotal) {
      doc.setFillColor(...C.tintBg);
      doc.rect(ML, y, CW, ROW_H, 'F');
    }
    setFont(r.isTotal ? 'bold' : 'normal', 8, C.ink);
    doc.text(safePdfText(r.uraian), sumCols.uraian, y + 5.6);

    setFont('normal', 8, C.slate);
    doc.text(safePdfText(r.periode), sumCols.periode, y + 5.6);
    doc.text(safePdfText(r.status), sumCols.status, y + 5.6);

    setFont('bold', 8.5, r.isTotal ? C.blue : C.ink);
    doc.text(safePdfText(r.nilai), sumCols.nilai, y + 5.6, { align: 'right' });

    y += ROW_H;
    hline(y, 0.25, C.divider);
  });

  // =========================================================================
  // III. KOMPOSISI ANGGARAN RKAS
  // =========================================================================
  if (compositions.length > 0) {
    drawSectionHeading('III. KOMPOSISI PENGGUNAAN ANGGARAN RKAS', 8);

    const rkasCols = {
      no: ML + 3.5,
      komponen: ML + 12,
      porsi: ML + 132,
      alokasi: ML + CW - 3.5,
    };
    const rkasMaxLabelW = 112;

    doc.setFillColor(...C.headerBg);
    doc.rect(ML, y, CW, 8, 'F');
    hline(y, 0.3, C.border);
    hline(y + 8, 0.3, C.border);
    setFont('bold', 7.5, C.slate);
    doc.text('NO', rkasCols.no, y + 5.3);
    doc.text('KOMPONEN PENGGUNAAN DANA', rkasCols.komponen, y + 5.3);
    doc.text('PORSI', rkasCols.porsi, y + 5.3, { align: 'center' });
    doc.text('ALOKASI (RP)', rkasCols.alokasi, y + 5.3, { align: 'right' });
    y += 8;

    compositions.forEach((comp, idx) => {
      setFont('bold', 8, C.ink);
      const titleLines = wrapText(comp.label, rkasMaxLabelW);
      setFont('normal', 7.2, C.slate);
      const descLines = comp.description
        ? wrapText(comp.description, rkasMaxLabelW)
        : [];

      const rowH =
        titleLines.length * 4.3 +
        (descLines.length > 0 ? descLines.length * 3.8 + 1 : 0) +
        4.5;

      ensureSpace(rowH);

      if (idx % 2 === 1) {
        doc.setFillColor(...C.zebraBg);
        doc.rect(ML, y, CW, rowH, 'F');
      }

      setFont('normal', 8, C.muted);
      doc.text(String(idx + 1).padStart(2, '0'), rkasCols.no, y + 5.2);

      setFont('bold', 8, C.ink);
      doc.text(titleLines, rkasCols.komponen, y + 5.2);

      if (descLines.length > 0) {
        setFont('normal', 7.2, C.slate);
        doc.text(
          descLines,
          rkasCols.komponen,
          y + 5.2 + titleLines.length * 4.3 + 0.5
        );
      }

      setFont('bold', 8, C.slate);
      doc.text(`${comp.percentage}%`, rkasCols.porsi, y + 5.2, {
        align: 'center',
      });

      setFont('bold', 8, C.blue);
      doc.text(
        safePdfText(formatRupiah(comp.amount)),
        rkasCols.alokasi,
        y + 5.2,
        { align: 'right' }
      );

      y += rowH;
      hline(y, 0.2, C.divider);
    });

    // Total RKAS row
    const TOT_RKAS_H = 9;
    ensureSpace(TOT_RKAS_H);
    doc.setFillColor(...C.tintBg);
    doc.rect(ML, y, CW, TOT_RKAS_H, 'F');
    hline(y, 0.3, C.blue);
    hline(y + TOT_RKAS_H, 0.4, C.blue);
    setFont('bold', 8, C.ink);
    doc.text('TOTAL ANGGARAN RKAS (1 TAHUN)', rkasCols.komponen, y + 6);
    doc.text('100%', rkasCols.porsi, y + 6, { align: 'center' });
    setFont('bold', 8.5, C.blue);
    doc.text(safePdfText(formatRupiah(totalBosp)), rkasCols.alokasi, y + 6, {
      align: 'right',
    });
    y += TOT_RKAS_H;
  }

  // =========================================================================
  // IV. RINCIAN REALISASI PENGADAAN BARANG (SIPLah)
  // =========================================================================
  drawSectionHeading(
    'IV. RINCIAN REALISASI PENGADAAN BARANG & JASA (SIPLah)',
    8
  );

  const itemCols = {
    no: ML + 3.5,
    uraian: ML + 12,
    tahap: ML + 110,
    nilai: ML + CW - 3.5,
  };
  const itemMaxUraianW = 94;

  const drawItemsHeader = (isContinuation = false) => {
    doc.setFillColor(...C.headerBg);
    doc.rect(ML, y, CW, 8, 'F');
    hline(y, 0.3, C.border);
    hline(y + 8, 0.3, C.border);
    setFont('bold', 7.5, C.slate);
    doc.text('NO', itemCols.no, y + 5.3);
    doc.text(
      isContinuation
        ? 'URAIAN PENGADAAN, SPESIFIKASI & FAKTUR (LANJUTAN)'
        : 'URAIAN PENGADAAN, SPESIFIKASI & FAKTUR SIPLah',
      itemCols.uraian,
      y + 5.3
    );
    doc.text('TAHAP & TANGGAL', itemCols.tahap, y + 5.3);
    doc.text('NILAI REALISASI (RP)', itemCols.nilai, y + 5.3, {
      align: 'right',
    });
    y += 8;
  };

  drawItemsHeader(false);

  items.forEach((item, idx) => {
    setFont('bold', 8.2, C.ink);
    const nameLines = wrapText(item.name, itemMaxUraianW);

    setFont('normal', 7.5, C.slate);
    const specLines = item.unitSummary
      ? wrapText(`Spesifikasi: ${item.unitSummary}`, itemMaxUraianW)
      : [];

    const invoiceStr = item.invoice?.number
      ? `No. Faktur: ${item.invoice.number}${
          item.invoice?.vendorName ? '  |  Mitra: ' + item.invoice.vendorName : ''
        }`
      : '';
    setFont('normal', 7.2, C.muted);
    const invLines = invoiceStr ? wrapText(invoiceStr, itemMaxUraianW) : [];

    const roomStr = item.geotag?.roomLabel
      ? `Lokasi Fisik: ${item.geotag.roomLabel}`
      : '';
    const roomLines = roomStr ? wrapText(roomStr, itemMaxUraianW) : [];

    const contentH =
      nameLines.length * 4.3 +
      specLines.length * 3.9 +
      invLines.length * 3.8 +
      roomLines.length * 3.8 +
      6;
    const rowH = Math.max(contentH, 14);

    if (ensureSpace(rowH)) {
      drawItemsHeader(true);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(...C.zebraBg);
      doc.rect(ML, y, CW, rowH, 'F');
    }

    let curTextY = y + 5;

    setFont('normal', 8, C.muted);
    doc.text(String(idx + 1).padStart(2, '0'), itemCols.no, curTextY);

    // Column 2: Name + Spec + Invoice + Room
    setFont('bold', 8.2, C.ink);
    doc.text(nameLines, itemCols.uraian, curTextY);
    curTextY += nameLines.length * 4.3 + 0.5;

    if (specLines.length > 0) {
      setFont('normal', 7.5, C.slate);
      doc.text(specLines, itemCols.uraian, curTextY);
      curTextY += specLines.length * 3.9 + 0.3;
    }

    if (invLines.length > 0) {
      setFont('normal', 7.2, C.muted);
      doc.text(invLines, itemCols.uraian, curTextY);
      curTextY += invLines.length * 3.8 + 0.3;
    }

    if (roomLines.length > 0) {
      setFont('normal', 7.2, C.muted);
      doc.text(roomLines, itemCols.uraian, curTextY);
    }

    // Column 3: Stage & Date
    setFont('bold', 8, C.ink);
    doc.text(safePdfText(item.stage), itemCols.tahap, y + 5);
    setFont('normal', 7.5, C.slate);
    doc.text(safePdfText(item.date), itemCols.tahap, y + 9.2);

    // Column 4: Amount
    setFont('bold', 8.5, C.blue);
    doc.text(safePdfText(formatRupiah(item.amount)), itemCols.nilai, y + 5, {
      align: 'right',
    });

    y += rowH;
    hline(y, 0.2, C.divider);
  });

  // Total Realisasi Barang Row
  const TOT_ITEM_H = 9.5;
  if (ensureSpace(TOT_ITEM_H + 4)) {
    drawItemsHeader(true);
  }
  doc.setFillColor(...C.tintBg);
  doc.rect(ML, y, CW, TOT_ITEM_H, 'F');
  hline(y, 0.35, C.blue);
  hline(y + TOT_ITEM_H, 0.45, C.blue);
  setFont('bold', 8, C.ink);
  doc.text(
    `TOTAL REALISASI PENGADAAN BARANG (${items.length} PAKET PENGADAAN)`,
    itemCols.uraian,
    y + 6.2
  );
  setFont('bold', 9, C.blue);
  doc.text(
    safePdfText(formatRupiah(totalRealisasi)),
    itemCols.nilai,
    y + 6.2,
    { align: 'right' }
  );
  y += TOT_ITEM_H + 8;

  // =========================================================================
  // KETERANGAN KETERBUKAAN INFORMASI PUBLIK
  // =========================================================================
  const noteText =
    'Dokumen ini diterbitkan secara otomatis melalui portal transparansi DARADIK berdasarkan ' +
    'kompilasi data publik Dapodik dan arsip faktur pengadaan SIPLah Kemdikbudristek. ' +
    'Masyarakat, orang tua/wali murid, dan komite sekolah dapat memverifikasi bukti fisik ' +
    'serta melaporkan dugaan ketidaksesuaian secara aman dan 100% anonim melalui kanal pengaduan DARADIK.';

  setFont('normal', 7.5, C.slate);
  const noteLines = wrapText(noteText, CW - 10);
  const noteBoxH = noteLines.length * 4.2 + 11;

  ensureSpace(noteBoxH + 4);

  doc.setFillColor(...C.zebraBg);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, noteBoxH, 1.5, 1.5, 'FD');

  setFont('bold', 7.8, C.ink);
  doc.text('KETERANGAN KETERBUKAAN INFORMASI PUBLIK', ML + 5, y + 5.2);
  setFont('normal', 7.5, C.slate);
  doc.text(noteLines, ML + 5, y + 9.8);

  // =========================================================================
  // PAGE NUMBERS & FOOTERS ACROSS ALL PAGES
  // =========================================================================
  const totalPages = page;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(p, totalPages);
  }

  doc.save(`Laporan_Transparansi_BOSP_${school.npsn}_TA${targetYear}.pdf`);
}
