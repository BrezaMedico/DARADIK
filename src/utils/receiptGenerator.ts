import html2canvas from 'html2canvas';
import type { BospRealizationItem, SchoolData } from '@/types/school';
import { formatRupiah } from './formatters';

/**
 * Konversi angka rupiah ke kalimat terbilang bahasa Indonesia resmi
 */
export function terbilangRupiah(nominal: number): string {
  if (nominal <= 0) return 'Nol Rupiah';
  const angka = Math.floor(Math.abs(nominal));
  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function bilang(n: number): string {
    if (n < 12) return satuan[n];
    if (n < 20) return bilang(n - 10) + ' Belas';
    if (n < 100)
      return (
        bilang(Math.floor(n / 10)) +
        ' Puluh' +
        (n % 10 !== 0 ? ' ' + bilang(n % 10) : '')
      );
    if (n < 200)
      return 'Seratus' + (n - 100 !== 0 ? ' ' + bilang(n - 100) : '');
    if (n < 1000)
      return (
        bilang(Math.floor(n / 100)) +
        ' Ratus' +
        (n % 100 !== 0 ? ' ' + bilang(n % 100) : '')
      );
    if (n < 2000)
      return 'Seribu' + (n - 1000 !== 0 ? ' ' + bilang(n - 1000) : '');
    if (n < 1000000)
      return (
        bilang(Math.floor(n / 1000)) +
        ' Ribu' +
        (n % 1000 !== 0 ? ' ' + bilang(n % 1000) : '')
      );
    if (n < 1000000000)
      return (
        bilang(Math.floor(n / 1000000)) +
        ' Juta' +
        (n % 1000000 !== 0 ? ' ' + bilang(n % 1000000) : '')
      );
    if (n < 1000000000000)
      return (
        bilang(Math.floor(n / 1000000000)) +
        ' Miliar' +
        (n % 1000000000 !== 0 ? ' ' + bilang(n % 1000000000) : '')
      );
    return (
      bilang(Math.floor(n / 1000000000000)) +
      ' Triliun' +
      (n % 1000000000000 !== 0 ? ' ' + bilang(n % 1000000000000) : '')
    );
  }

  const hasil = bilang(angka).trim();
  return (hasil ? hasil + ' Rupiah' : 'Nol Rupiah');
}

/**
 * Format tanggal dan waktu cetak lokal Indonesia
 */
function getFormattedPrintTime(): string {
  try {
    const now = new Date();
    return now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return 'Tahun Anggaran 2026';
  }
}

/**
 * Membangun elemen HTML kuitansi berukuran tetap (800px) untuk ekspor PNG yang presisi,
 * bebas dari kendala viewport mobile, modal scrolling, atau pemotongan teks.
 */
export function buildReceiptPrintHtml(
  item: BospRealizationItem,
  school: SchoolData
): string {
  const lineItems = item.invoice?.lineItems || [];
  const terbilangText = terbilangRupiah(item.amount);
  const printTimestamp = getFormattedPrintTime();

  const lineItemsHtml = lineItems
    .map(
      (li, idx) => `
    <tr style="border-bottom: 1px solid #E2E8F0;">
      <td style="padding: 10px 12px; font-family: monospace; font-size: 12px; text-align: center; color: #64748B; vertical-align: top;">
        ${idx + 1}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #1E293B; line-height: 1.4; vertical-align: top;">
        <div>${li.name}</div>
        <div style="font-size: 11px; font-weight: normal; color: #64748B; margin-top: 2px;">
          Kategori: ${item.category}
        </div>
      </td>
      <td style="padding: 10px 12px; font-family: monospace; font-size: 12px; text-align: center; font-weight: 600; color: #1E293B; vertical-align: top;">
        ${li.qty}
      </td>
      <td style="padding: 10px 12px; font-family: monospace; font-size: 12px; text-align: right; color: #475569; vertical-align: top;">
        ${formatRupiah(Math.round(li.unitPrice))}
      </td>
      <td style="padding: 10px 12px; font-family: monospace; font-size: 13px; font-weight: 700; text-align: right; color: #1E293B; vertical-align: top;">
        ${formatRupiah(li.subtotal)}
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <div style="
      width: 780px;
      box-sizing: border-box;
      background-color: #FFFFFF;
      color: #1E293B;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      border: 2px solid #CBD5E1;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);
      margin: 0;
      padding: 0;
    ">
      <!-- 1. HEADER KOP RESMI -->
      <div style="background-color: #0F172A; color: #FFFFFF; padding: 22px 28px; border-bottom: 3px solid #2E6496;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="background-color: #2E6496; color: #FFFFFF; font-size: 10px; font-weight: 800; font-family: monospace; letter-spacing: 0.1em; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
                SIPLah Kemendikdasmen
              </span>
              <span style="font-size: 11px; color: #94A3B8; font-weight: 500;">
                Kementerian Pendidikan Dasar dan Menengah RI
              </span>
            </div>
            <h1 style="font-size: 20px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.02em; color: #FFFFFF;">
              KUITANSI PEMBELIAN BOSP
            </h1>
            <p style="font-size: 12px; color: #CBD5E1; margin: 0; line-height: 1.4;">
              Bukti Sah Transaksi Pengadaan Barang & Jasa Dana Bantuan Operasional Satuan Pendidikan
            </p>
          </div>

          <div style="text-align: right; flex-shrink: 0;">
            <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1.5px solid #10B981; color: #34D399; font-size: 11px; font-weight: 800; font-family: monospace; padding: 5px 14px; border-radius: 999px; letter-spacing: 0.06em;">
              LUNAS / DIVERIFIKASI
            </div>
            <div style="font-size: 11px; color: #94A3B8; font-family: monospace; margin-top: 6px;">
              ARKAS TAHUN 2026
            </div>
          </div>
        </div>

        <!-- Metadata Baris Info -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 18px; padding-top: 14px; border-top: 1px solid #334155;">
          <div>
            <span style="display: block; font-size: 10px; text-transform: uppercase; color: #94A3B8; font-weight: 700; letter-spacing: 0.05em;">
              Nomor Kuitansi
            </span>
            <span style="display: block; font-size: 12px; font-family: monospace; font-weight: 700; color: #F8FAFC; margin-top: 2px;">
              ${item.invoice?.number || '-'}
            </span>
          </div>

          <div>
            <span style="display: block; font-size: 10px; text-transform: uppercase; color: #94A3B8; font-weight: 700; letter-spacing: 0.05em;">
              Tanggal Transaksi
            </span>
            <span style="display: block; font-size: 12px; font-family: monospace; font-weight: 600; color: #F8FAFC; margin-top: 2px;">
              ${item.invoice?.date || '-'}
            </span>
          </div>

          <div>
            <span style="display: block; font-size: 10px; text-transform: uppercase; color: #94A3B8; font-weight: 700; letter-spacing: 0.05em;">
              Tahap Penyaluran
            </span>
            <span style="display: block; font-size: 12px; font-weight: 700; color: #38BDF8; margin-top: 2px;">
              BOSP ${item.stage}
            </span>
          </div>

          <div>
            <span style="display: block; font-size: 10px; text-transform: uppercase; color: #94A3B8; font-weight: 700; letter-spacing: 0.05em;">
              Kategori Belanja
            </span>
            <span style="display: block; font-size: 12px; font-weight: 600; color: #F8FAFC; margin-top: 2px;">
              ${item.category}
            </span>
          </div>
        </div>
      </div>

      <!-- 2. IDENTITAS DUA PIHAK (SEKOLAH & PENYEDIA) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 22px 28px; background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
        <!-- Pihak Pertama: Satuan Pendidikan -->
        <div style="background-color: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 10px; padding: 14px 16px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #2E6496; letter-spacing: 0.08em; margin-bottom: 6px;">
            Satuan Pendidikan (Penerima Barang / KPA):
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #1E293B; margin-bottom: 4px; line-height: 1.3;">
            ${school.name}
          </div>
          <div style="font-size: 12px; font-family: monospace; color: #475569; margin-bottom: 2px;">
            NPSN: <strong>${school.npsn}</strong> &bull; Jenjang: <strong>${school.jenjang} (${school.status})</strong>
          </div>
          <div style="font-size: 11px; color: #64748B; line-height: 1.4; margin-top: 4px;">
            ${school.address ? `${school.address}, ` : ''}${school.kecamatan ? `${school.kecamatan}, ` : ''}${school.kabupaten ? `${school.kabupaten}, ` : ''}${school.provinsi || ''}
          </div>
        </div>

        <!-- Pihak Kedua: Penyedia SIPLah -->
        <div style="background-color: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 10px; padding: 14px 16px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #2E6496; letter-spacing: 0.08em; margin-bottom: 6px;">
            Toko Mitra SIPLah (Penyedia Barang / Jasa):
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #1E293B; margin-bottom: 4px; line-height: 1.3;">
            ${item.invoice?.vendorName || 'Mitra Pengadaan SIPLah'}
          </div>
          <div style="font-size: 12px; font-family: monospace; color: #475569; margin-bottom: 2px;">
            NPWP: <strong>${item.invoice?.npwp || '00.000.000.0-000.000'}</strong>
          </div>
          <div style="font-size: 11px; color: #64748B; line-height: 1.4; margin-top: 4px;">
            ${item.invoice?.vendorAddress || 'Alamat Toko Terdaftar SIPLah'}
          </div>
        </div>
      </div>

      <!-- 3. TABEL RINCIAN BARANG / JASA -->
      <div style="padding: 22px 28px 12px 28px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background-color: #F1F5F9; border-top: 1px solid #CBD5E1; border-bottom: 2px solid #CBD5E1;">
              <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; width: 40px; text-align: center;">
                No
              </th>
              <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
                Rincian Barang / Spesifikasi Pengadaan
              </th>
              <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; width: 90px; text-align: center;">
                Vol / Qty
              </th>
              <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; width: 140px; text-align: right;">
                Harga Satuan
              </th>
              <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; width: 150px; text-align: right;">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>

        <!-- Total Box -->
        <div style="margin-top: 16px; padding: 14px 18px; background-color: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.06em;">
              Total Pembayaran (Lunas Dibayar BOSP):
            </div>
            <div style="font-size: 12px; font-style: italic; color: #2E6496; font-weight: 600; margin-top: 3px;">
              Terbilang: &ldquo;${terbilangText}&rdquo;
            </div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 22px; font-weight: 900; font-family: monospace; color: #2E6496; letter-spacing: -0.02em;">
              ${formatRupiah(item.amount)}
            </div>
          </div>
        </div>
      </div>

      <!-- 4. PERUNTUKAN BELANJA -->
      <div style="padding: 12px 28px 18px 28px;">
        <div style="padding: 12px 16px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px;">
          <span style="display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #2E6496; letter-spacing: 0.07em; margin-bottom: 4px;">
            Peruntukan Alokasi Dana BOSP:
          </span>
          <p style="font-size: 12px; color: #334155; margin: 0; line-height: 1.5;">
            ${item.allocation || 'Pengadaan barang/jasa operasional sekolah sesuai rencana kerja anggaran sekolah (ARKAS).'}
          </p>
        </div>
      </div>

      <!-- 5. TANDA TANGAN & PENGESAHAN DUA PIHAK + STEMPEL DIGITAL -->
      <div style="padding: 18px 28px 22px 28px; border-top: 1px solid #E2E8F0; background-color: #FFFFFF;">
        <div style="display: grid; grid-template-columns: 220px 1fr 1fr; gap: 20px; align-items: flex-end;">
          <!-- Kolom 1: Stempel Digital Resmi -->
          <div style="text-align: center;">
            <div style="
              display: inline-block;
              border: 2px dashed #2E6496;
              border-radius: 12px;
              padding: 10px 14px;
              background-color: #EBF3F8;
              text-align: center;
            ">
              <div style="font-size: 9px; font-weight: 800; color: #2E6496; font-family: monospace; text-transform: uppercase; letter-spacing: 0.08em;">
                TERVERIFIKASI SISTEM
              </div>
              <div style="font-size: 12px; font-weight: 900; color: #0F2742; margin: 3px 0; font-family: monospace;">
                ARKAS &bull; SIPLah 2026
              </div>
              <div style="font-size: 9px; color: #475569; line-height: 1.3;">
                Kementerian Pendidikan Dasar & Menengah RI
              </div>
            </div>
          </div>

          <!-- Kolom 2: Bendahara Sekolah -->
          <div style="text-align: center;">
            <div style="font-size: 11px; color: #64748B; font-weight: 600;">Lunas Dibayar Oleh:</div>
            <div style="font-size: 11px; font-weight: 800; color: #1E293B; margin-bottom: 38px;">
              Bendahara Satuan Pendidikan
            </div>
            <div style="border-top: 1px solid #94A3B8; padding-top: 4px; display: inline-block; min-width: 170px;">
              <div style="font-size: 13px; font-weight: 800; color: #1E293B;">
                ${item.invoice?.treasurerName || 'Bendahara BOSP'}
              </div>
              <div style="font-size: 10px; color: #64748B; font-family: monospace; margin-top: 1px;">
                Pengelola Dana BOSP
              </div>
            </div>
          </div>

          <!-- Kolom 3: Kepala Satuan Pendidikan -->
          <div style="text-align: center;">
            <div style="font-size: 11px; color: #64748B; font-weight: 600;">Mengetahui / Menyetujui:</div>
            <div style="font-size: 11px; font-weight: 800; color: #1E293B; margin-bottom: 38px;">
              Kepala Satuan Pendidikan
            </div>
            <div style="border-top: 1px solid #94A3B8; padding-top: 4px; display: inline-block; min-width: 170px;">
              <div style="font-size: 13px; font-weight: 800; color: #1E293B;">
                ${item.invoice?.principalName || 'Kepala Sekolah'}
              </div>
              <div style="font-size: 10px; color: #64748B; font-family: monospace; margin-top: 1px;">
                Kuasa Pengguna Anggaran (KPA)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. FOOTER INTEGRITAS & KEABSAHAN RESMI -->
      <div style="padding: 12px 28px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: 10px; color: #64748B;">
        <div style="line-height: 1.4;">
          Dokumen kuitansi digital ini dicetak dari <strong>Portal Transparansi BOSP DARADIK</strong>. Terdaftar pada basis data ARKAS & SIPLah Kemendikdasmen RI.
        </div>
        <div style="font-family: monospace; text-align: right; white-space: nowrap; font-weight: 600; color: #475569;">
          Dicetak: ${printTimestamp}
        </div>
      </div>
    </div>
  `;
}

/**
 * Mengunduh kuitansi digital ke dalam format gambar PNG beresolusi tinggi (scale 2),
 * di-render pada elemen khusus yang independen dari scroll modal atau ukuran layar saat ini,
 * menjamin tidak ada bagian yang terpotong dan semua elemen berada di posisi yang sempurna.
 */
export async function downloadReceiptPng(
  item: BospRealizationItem,
  school: SchoolData
): Promise<void> {
  const container = document.createElement('div');
  container.id = 'daradik-receipt-render-surface';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '780px';
  container.style.zIndex = '-99999';
  container.style.backgroundColor = '#FFFFFF';
  container.style.pointerEvents = 'none';
  container.style.boxSizing = 'border-box';
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.opacity = '1';
  container.style.visibility = 'visible';

  container.innerHTML = buildReceiptPrintHtml(item, school);
  document.body.appendChild(container);

  try {
    // Tunggu font selesai termuat dan layout selesai dikalkulasi
    if (document.fonts) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));

    const cardElement = (container.firstElementChild as HTMLElement) || container;
    const renderWidth = 780;
    const renderHeight = cardElement.offsetHeight || container.scrollHeight;

    const canvas = await html2canvas(cardElement, {
      scale: 2, // Resolusi tinggi (1560px lebar gambar asli)
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      width: renderWidth,
      height: renderHeight,
      windowWidth: renderWidth,
      windowHeight: renderHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const invoiceNumClean = (item.invoice?.number || 'BOSP')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 32);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Kuitansi-BOSP-${invoiceNumClean}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

