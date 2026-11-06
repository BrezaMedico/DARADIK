import { jsPDF } from 'jspdf';
import { SchoolData, formatRupiah } from '../data/schoolsData';

/**
 * Clean & Modern Executive PDF Generator for DARADIK BOSP Transparency Reports.
 * Designed for maximum readability: clear typography, spacious layout, zero line collisions,
 * precise right-aligned financials, and a structured civic aesthetic.
 */
export async function generateBospTransparencyPdf(
  school: SchoolData,
  targetYear: string = '2026'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  let currentY = 14;

  const yearData = {
    year: targetYear,
    isCurrentYear: true,
    totalBosp: school.totalBosp,
    tahap1: school.tahap1,
    tahap2: school.tahap2,
    compositions: school.compositions || [],
    items: school.items || [],
  };

  const totalItemSubtotal = yearData.items.reduce((sum, it) => sum + it.amount, 0);
  const now = new Date();
  const printDateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Footer helper on each page
  const addPageFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 10;
    doc.setDrawColor(201, 223, 220);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 2.5, marginX + contentWidth, footerY - 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'DARADIK • Dokumen Publik Transparansi BOSP & Pengawasan Partisipatif',
      marginX,
      footerY + 1.5
    );

    const pageStr = `Halaman ${pageNum} dari ${totalPages}`;
    doc.text(pageStr, marginX + contentWidth, footerY + 1.5, { align: 'right' });
  };

  // =========================================================================
  // 1. HEADER (Simple, Clean, Sturdy)
  // =========================================================================
  // Top Header Accent Line
  doc.setFillColor(46, 100, 150); // #2E6496
  doc.rect(marginX, currentY, contentWidth, 2, 'F');
  currentY += 6;

  // Title & Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text('LAPORAN TRANSPARANSI DANA BOSP', marginX, currentY);

  // Year Badge on Right
  doc.setFillColor(235, 243, 248); // #EBF3F8
  doc.setDrawColor(201, 223, 220); // #C9DFDC
  doc.setLineWidth(0.3);
  const badgeText = `TAHUN ANGGARAN ${targetYear}`;
  const badgeWidth = doc.getTextWidth(badgeText) + 8;
  doc.roundedRect(
    marginX + contentWidth - badgeWidth,
    currentY - 4.5,
    badgeWidth,
    6,
    1.2,
    1.2,
    'FD'
  );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(46, 100, 150);
  doc.text(
    badgeText,
    marginX + contentWidth - badgeWidth / 2,
    currentY - 0.5,
    { align: 'center' }
  );

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Ringkasan Alokasi Pagu, Komposisi RKAS, dan Realisasi Bukti Belanja SIPLah',
    marginX,
    currentY
  );

  currentY += 5;
  doc.setDrawColor(201, 223, 220);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);
  currentY += 5;

  // =========================================================================
  // 2. PROFIL SATUAN PENDIDIKAN (Clean Structured Card)
  // =========================================================================
  doc.setFillColor(250, 248, 245); // #FAF8F5
  doc.setDrawColor(201, 223, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, 18, 1.5, 1.5, 'FD');

  const cardInnerY = currentY + 4.5;
  // Left Column: School Name & Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(school.name, marginX + 4, cardInnerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `NPSN: ${school.npsn}  •  ${school.studentCount} Siswa Terdaftar`,
    marginX + 4,
    cardInnerY + 4.5
  );
  doc.text(`Alamat: ${school.address}`, marginX + 4, cardInnerY + 8.5);

  // Right Column: Document Metadata
  const colRightX = marginX + contentWidth - 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Kode Dokumen: DOC-BOSP-${school.npsn}-${targetYear}`,
    colRightX,
    cardInnerY,
    { align: 'right' }
  );
  doc.text(`Tanggal Unduh: ${printDateStr}`, colRightX, cardInnerY + 4.5, {
    align: 'right',
  });
  doc.setTextColor(46, 100, 150);
  doc.setFont('helvetica', 'bold');
  doc.text('Status: Terverifikasi Arsip SIPLah', colRightX, cardInnerY + 8.5, {
    align: 'right',
  });

  currentY += 22;

  // =========================================================================
  // 3. RINGKASAN PAGU DANA BOSP (3 Clean Cards)
  // =========================================================================
  const cardGap = 3;
  const colCardW = (contentWidth - cardGap * 2) / 3;
  const colCardH = 17;

  const paguCards = [
    {
      title: 'TOTAL PAGU BOSP (1 TAHUN)',
      val: formatRupiah(yearData.totalBosp),
      sub: `Alokasi Penuh 12 Bulan TA ${targetYear}`,
      highlight: true,
    },
    {
      title: 'PENCAIRAN TAHAP 1',
      val: formatRupiah(yearData.tahap1.amount),
      sub: `${yearData.tahap1.status} • ${yearData.tahap1.disbursedDate}`,
      highlight: false,
    },
    {
      title: 'PENCAIRAN TAHAP 2',
      val: formatRupiah(yearData.tahap2.amount),
      sub: `${yearData.tahap2.status} • ${yearData.tahap2.disbursedDate}`,
      highlight: false,
    },
  ];

  paguCards.forEach((c, i) => {
    const cx = marginX + i * (colCardW + cardGap);
    if (c.highlight) {
      doc.setFillColor(245, 250, 253);
      doc.setDrawColor(102, 163, 191);
      doc.setLineWidth(0.4);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(201, 223, 220);
      doc.setLineWidth(0.3);
    }
    doc.roundedRect(cx, currentY, colCardW, colCardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(c.title, cx + 3.5, currentY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(46, 100, 150);
    doc.text(c.val, cx + 3.5, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.sub, cx + 3.5, currentY + 14.2);
  });

  currentY += colCardH + 6;

  // =========================================================================
  // 4. KOMPOSISI ANGGARAN RKAS (Table with Precise Right Alignment)
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('KOMPOSISI ANGGARAN RKAS', marginX, currentY);
  currentY += 3;

  // RKAS Table Header
  doc.setFillColor(242, 239, 232); // #F2EFE8
  doc.rect(marginX, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('NO', marginX + 3, currentY + 3.8);
  doc.text('KOMPONEN BELANJA RKAS', marginX + 12, currentY + 3.8);
  doc.text('PORSI (%)', marginX + 128, currentY + 3.8, { align: 'right' });
  doc.text('TOTAL ALOKASI (RP)', marginX + contentWidth - 3, currentY + 3.8, {
    align: 'right',
  });
  currentY += 5.5;

  yearData.compositions.forEach((comp, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(String(idx + 1).padStart(2, '0'), marginX + 3, currentY + 4);
    doc.text(comp.label, marginX + 12, currentY + 4);
    doc.text(`${comp.percentage}%`, marginX + 128, currentY + 4, {
      align: 'right',
    });
    doc.setFont('helvetica', 'bold');
    doc.text(formatRupiah(comp.amount), marginX + contentWidth - 3, currentY + 4, {
      align: 'right',
    });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY + 5.5, marginX + contentWidth, currentY + 5.5);
    currentY += 5.8;
  });

  currentY += 5;

  // =========================================================================
  // 5. RINCIAN REALISASI PENGADAAN BARANG SIPLAH
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('RINCIAN REALISASI PENGADAAN BARANG SIPLAH', marginX, currentY);
  currentY += 3;

  const drawItemsTableHeader = (isContinuation = false) => {
    doc.setFillColor(242, 239, 232); // #F2EFE8
    doc.rect(marginX, currentY, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('NO', marginX + 3, currentY + 3.8);
    doc.text(
      isContinuation
        ? 'URAIAN BARANG & SPESIFIKASI (LANJUTAN)'
        : 'URAIAN BARANG & SPESIFIKASI',
      marginX + 12,
      currentY + 3.8
    );
    doc.text('TAHAP & TANGGAL', marginX + 88, currentY + 3.8);
    doc.text('NO. FAKTUR SIPLAH', marginX + 124, currentY + 3.8);
    doc.text(
      'NILAI REALISASI (RP)',
      marginX + contentWidth - 3,
      currentY + 3.8,
      { align: 'right' }
    );
    currentY += 5.5;
  };

  drawItemsTableHeader(false);

  let pageNum = 1;

  yearData.items.forEach((item, idx) => {
    // Check if space remains on current page
    if (currentY > pageHeight - 32) {
      addPageFooter(pageNum, 0); // Will update totalPages at end
      doc.addPage();
      pageNum++;
      currentY = 14;
      drawItemsTableHeader(true);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(String(idx + 1), marginX + 3, currentY + 4);

    // Item name safely wrapped to 72mm
    const nameLines = doc.splitTextToSize(item.name, 72);
    doc.setFont('helvetica', 'bold');
    doc.text(nameLines, marginX + 12, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${item.stage} • ${item.date}`, marginX + 88, currentY + 4);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.invoice.number, marginX + 124, currentY + 4);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(46, 100, 150);
    doc.text(
      formatRupiah(item.amount),
      marginX + contentWidth - 3,
      currentY + 4,
      { align: 'right' }
    );

    const rowH = Math.max(nameLines.length * 3.8, 5.8);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(
      marginX,
      currentY + rowH + 0.5,
      marginX + contentWidth,
      currentY + rowH + 0.5
    );
    currentY += rowH + 1.2;
  });

  // Total Realisasi Row
  doc.setFillColor(245, 250, 253); // #F5FAFD
  doc.rect(marginX, currentY + 1, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('TOTAL REALISASI PENGADAAN TERDATA', marginX + 12, currentY + 5);
  doc.setTextColor(46, 100, 150);
  doc.text(
    formatRupiah(totalItemSubtotal),
    marginX + contentWidth - 3,
    currentY + 5,
    { align: 'right' }
  );
  doc.setDrawColor(102, 163, 191);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY + 7, marginX + contentWidth, currentY + 7);
  currentY += 12;

  // =========================================================================
  // 6. CATATAN INTEGRITAS & KETERBUKAAN INFORMASI
  // =========================================================================
  if (currentY > pageHeight - 30) {
    addPageFooter(pageNum, 0);
    doc.addPage();
    pageNum++;
    currentY = 14;
  }

  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(201, 223, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, 16, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(
    'CATATAN INTEGRITAS & KETERBUKAAN INFORMASI PUBLIK',
    marginX + 4,
    currentY + 4.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const noteLines = doc.splitTextToSize(
    'Laporan ringkas ini diterbitkan melalui portal DARADIK berdasarkan kompilasi data publik Dapodik dan arsip faktur SIPLah Kemdikbudristek. Seluruh data realisasi dilengkapi nomor nota resmi dan dokumentasi fisik. Menemukan kejanggalan atau pungutan yang bertentangan dengan juknis? Gunakan kanal Lapor DARADIK untuk pengaduan 100% aman dan anonim.',
    contentWidth - 8
  );
  doc.text(noteLines, marginX + 4, currentY + 8.5);

  // Set total pages and footers across all generated pages
  const totalPages = pageNum;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(i, totalPages);
  }

  // Trigger real browser download
  const cleanFilename = `Laporan_Transparansi_BOSP_${school.npsn}_TA${targetYear}.pdf`;
  doc.save(cleanFilename);
}
