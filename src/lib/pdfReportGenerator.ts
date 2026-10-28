import { jsPDF } from 'jspdf';
import { SchoolData, formatRupiah } from '../data/schoolsData';

/**
 * Professional Editorial PDF Generator for DARADIK BOSP Transparency Reports.
 * Generates an executive, print-ready document formatted to A4 with clean typography,
 * financial summaries, RKAS allocations, itemized realization list, and verification stamps.
 */
export async function generateBospTransparencyPdf(
  school: SchoolData,
  targetYear: '2026' | '2025' = '2026'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178mm
  let currentY = 16;

  const yearData = school.history?.[targetYear] || {
    year: targetYear,
    isCurrentYear: targetYear === '2026',
    totalBosp: school.totalBosp,
    tahap1: school.tahap1,
    tahap2: school.tahap2,
    compositions: school.compositions,
    items: school.items,
  };

  const totalItemSubtotal = yearData.items.reduce((sum, it) => sum + it.amount, 0);
  const now = new Date();
  const printDateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const printTimeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Helper to draw clean horizontal separator line
  const drawDivider = (y: number, color: [number, number, number] = [201, 223, 220], width = 0.3) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(width);
    doc.line(marginX, y, marginX + contentWidth, y);
  };

  // Helper for adding footer on any page
  const addPageFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 12;
    doc.setDrawColor(201, 223, 220);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 3, marginX + contentWidth, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'DARADIK — Portal Pengawasan Independen Transparansi BOSP & Validasi SIPLah',
      marginX,
      footerY + 1
    );

    const pageStr = `Halaman ${pageNum} dari ${totalPages}`;
    doc.text(pageStr, marginX + contentWidth - doc.getTextWidth(pageStr), footerY + 1);
  };

  // =========================================================================
  // PAGE 1: HEADER & DOCUMENT IDENTITY
  // =========================================================================

  // Top Accent Banner Strip
  doc.setFillColor(46, 100, 150); // DARADIK Primary Blue
  doc.rect(marginX, currentY, contentWidth, 3, 'F');
  currentY += 8;

  // Header Left: Brand & Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text('LAPORAN RINGKASAN TRANSPARANSI DANA BOSP', marginX, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Pengawasan Independen Realisasi Anggaran Sekolah & Bukti Pengadaan Terverifikasi TA ${targetYear}`,
    marginX,
    currentY
  );

  // Document Metadata Box (Right-aligned info)
  currentY += 7;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(201, 223, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(46, 100, 150);
  doc.text('KODE DOKUMEN:', marginX + 4, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`DOC-BOSP-${school.npsn}-${targetYear}`, marginX + 33, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(46, 100, 150);
  doc.text('TANGGAL CETAK:', marginX + 4, currentY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`${printDateStr}, ${printTimeStr} WIB`, marginX + 33, currentY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(46, 100, 150);
  doc.text('STATUS DATA:', marginX + 110, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 101, 52); // Green
  doc.text('Terverifikasi Arsip SIPLah & Geotag', marginX + 134, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(46, 100, 150);
  doc.text('TAHUN ANGGARAN:', marginX + 110, currentY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`TA ${targetYear} (1 Tahun Penuh)`, marginX + 143, currentY + 10.5);

  currentY += 20;

  // =========================================================================
  // SECTION 1: PROFIL SATUAN PENDIDIKAN
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('1. PROFIL SATUAN PENDIDIKAN', marginX, currentY);
  currentY += 4;
  drawDivider(currentY, [46, 100, 150], 0.5);
  currentY += 5;

  const profileSpecs = [
    { label: 'Nama Sekolah', val: school.name },
    { label: 'Nomor Pokok Sekolah (NPSN)', val: school.npsn },
    { label: 'Alamat Lengkap', val: school.address },
    { label: 'Wilayah Administrasi', val: `Kec. ${school.kecamatan}, ${school.kabupaten}, ${school.provinsi}` },
    { label: 'Jumlah Siswa Terdaftar', val: `${school.studentCount} Siswa` },
  ];

  doc.setFontSize(8.5);
  profileSpecs.forEach((spec) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(spec.label, marginX + 2, currentY);
    doc.text(':', marginX + 52, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    
    // Wrap long address text cleanly
    const maxValWidth = contentWidth - 58;
    const splitVal = doc.splitTextToSize(spec.val, maxValWidth);
    doc.text(splitVal, marginX + 56, currentY);
    currentY += splitVal.length > 1 ? splitVal.length * 4.2 : 4.8;
  });

  currentY += 3;

  // =========================================================================
  // SECTION 2: RINGKASAN POSISI KEUANGAN BOSP 1 TAHUN PENUH
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`2. RINGKASAN PAGU DANA BOSP 1 TAHUN (${targetYear})`, marginX, currentY);
  currentY += 4;
  drawDivider(currentY, [46, 100, 150], 0.5);
  currentY += 5;

  // 3 Clean Financial Summary Metric Blocks (Focused on 1 full year)
  const cardWidth = (contentWidth - 6) / 3;
  const cardHeight = 18;
  const cards = [
    {
      label: 'TOTAL PAGU BOSP (1 TAHUN)',
      amount: formatRupiah(yearData.totalBosp),
      sub: `Tahun Anggaran ${targetYear} (12 Bulan)`,
    },
    {
      label: 'TAHAP 1 (SEMESTER GANJIL)',
      amount: formatRupiah(yearData.tahap1.amount),
      sub: `${yearData.tahap1.status} • ${yearData.tahap1.disbursedDate}`,
    },
    {
      label: 'TAHAP 2 (SEMESTER GENAP)',
      amount: formatRupiah(yearData.tahap2.amount),
      sub: yearData.tahap2.status === 'Belum Cair'
        ? 'Belum Cair • Menunggu Penyaluran'
        : `${yearData.tahap2.status} • ${yearData.tahap2.disbursedDate}`,
    },
  ];

  cards.forEach((c, idx) => {
    const cardX = marginX + idx * (cardWidth + 3);
    doc.setFillColor(250, 248, 245);
    doc.setDrawColor(201, 223, 220);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(c.label, cardX + 3, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(46, 100, 150);
    doc.text(c.amount, cardX + 3, currentY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.sub, cardX + 3, currentY + 15);
  });

  currentY += cardHeight + 8;

  // =========================================================================
  // SECTION 3: REKAPITULASI KOMPOSISI PENGGUNAAN DANA (RKAS)
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('3. KOMPOSISI ANGGARAN BERDASARKAN KOMPONEN RKAS', marginX, currentY);
  currentY += 4;
  drawDivider(currentY, [46, 100, 150], 0.5);
  currentY += 5;

  // RKAS Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('NO', marginX + 3, currentY + 4.2);
  doc.text('KOMPONEN ALOKASI RKAS', marginX + 14, currentY + 4.2);
  doc.text('PORSI', marginX + 115, currentY + 4.2);
  doc.text('TOTAL ANGGARAN', marginX + 142, currentY + 4.2);
  currentY += 6;

  yearData.compositions.forEach((comp, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    doc.text(`0${idx + 1}`, marginX + 3, currentY + 4.5);
    doc.text(comp.label, marginX + 14, currentY + 4.5);
    doc.text(`${comp.percentage}%`, marginX + 115, currentY + 4.5);
    doc.text(formatRupiah(comp.amount), marginX + 142, currentY + 4.5);

    drawDivider(currentY + 6.5, [226, 232, 240], 0.2);
    currentY += 7;
  });

  currentY += 6;

  // =========================================================================
  // SECTION 4: RINCIAN REALISASI PENGADAAN BARANG & BUKTI FISIK
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('4. RINCIAN REALISASI BARANG & BUKTI FISIK SIPLAH', marginX, currentY);
  currentY += 4;
  drawDivider(currentY, [46, 100, 150], 0.5);
  currentY += 5;

  // Items Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('NO', marginX + 2, currentY + 4.2);
  doc.text('URAIAN BARANG & SPESIFIKASI', marginX + 10, currentY + 4.2);
  doc.text('TAHAP / TANGGAL', marginX + 85, currentY + 4.2);
  doc.text('NOMOR NOTA SIPLAH', marginX + 120, currentY + 4.2);
  doc.text('NILAI (RP)', marginX + 155, currentY + 4.2);
  currentY += 6.5;

  let pageNum = 1;

  yearData.items.forEach((item, idx) => {
    // Check if space remains on page 1, else break to page 2
    if (currentY > pageHeight - 35) {
      addPageFooter(pageNum, 2);
      doc.addPage();
      pageNum = 2;
      currentY = 16;

      // Repeat Table Header on page 2
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, currentY, contentWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text('NO', marginX + 2, currentY + 4.2);
      doc.text('URAIAN BARANG & SPESIFIKASI (LANJUTAN)', marginX + 10, currentY + 4.2);
      doc.text('TAHAP / TANGGAL', marginX + 85, currentY + 4.2);
      doc.text('NOMOR NOTA SIPLAH', marginX + 120, currentY + 4.2);
      doc.text('NILAI (RP)', marginX + 155, currentY + 4.2);
      currentY += 6.5;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);

    doc.text(`${idx + 1}`, marginX + 2, currentY + 3.8);

    const nameLines = doc.splitTextToSize(item.name, 72);
    doc.setFont('helvetica', 'bold');
    doc.text(nameLines, marginX + 10, currentY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${item.stage} • ${item.date}`, marginX + 85, currentY + 3.8);

    doc.setFontSize(6.5);
    doc.text(item.invoice.number, marginX + 120, currentY + 3.8);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(46, 100, 150);
    doc.text(formatRupiah(item.amount), marginX + 155, currentY + 3.8);

    const rowHeight = Math.max(nameLines.length * 3.8, 6.5);
    drawDivider(currentY + rowHeight + 1.2, [226, 232, 240], 0.2);
    currentY += rowHeight + 2.5;
  });

  // Total Realisasi Row
  currentY += 2;
  doc.setFillColor(248, 250, 252);
  doc.rect(marginX, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('TOTAL PENGADAAN TERDATA', marginX + 10, currentY + 4.8);
  doc.setTextColor(46, 100, 150);
  doc.text(formatRupiah(totalItemSubtotal), marginX + 155, currentY + 4.8);
  drawDivider(currentY + 7, [46, 100, 150], 0.4);
  currentY += 12;

  // =========================================================================
  // INTEGRITY ATTESTATION / SIGN-OFF BLOCK
  // =========================================================================
  if (currentY > pageHeight - 45) {
    addPageFooter(pageNum, 2);
    doc.addPage();
    pageNum++;
    currentY = 16;
  }

  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(201, 223, 220);
  doc.roundedRect(marginX, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('CATATAN INTEGRITAS & KETERBUKAAN INFORMASI PUBLIK:', marginX + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const noteLines = doc.splitTextToSize(
    'Laporan ringkas ini diterbitkan oleh DARADIK berdasarkan data publik Dapodik dan arsip pengadaan SIPLah Kemdikbudristek. Seluruh item pengadaan telah dilengkapi bukti fisik, nomor faktur pajak, dan titik koordinat geotagging ruangan. Menemukan kejanggalan atau iuran tumpang tindih? Sampaikan aduan aman dan 100% anonim melalui portal pelaporan DARADIK.',
    contentWidth - 8
  );
  doc.text(noteLines, marginX + 4, currentY + 9);

  // Add Page Footers
  const totalPages = pageNum;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(i, totalPages);
  }

  // Trigger real PDF download
  const cleanFilename = `Laporan_Transparansi_BOSP_${school.npsn}_${now.getFullYear()}.pdf`;
  doc.save(cleanFilename);
}
