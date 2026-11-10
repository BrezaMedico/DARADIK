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
      border-radius: 0;
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

const RECEIPT_SANS_FONT = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const RECEIPT_MONO_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number
): string[] {
  const text = String(rawText || '').trim();
  if (!text) return ['-'];

  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) {
        lines.push(current);
        current = '';
      }

      if (ctx.measureText(word).width <= maxWidth) {
        current = word;
      } else {
        // Pecah token panjang tanpa spasi (mis. nomor nota panjang) per karakter
        let chunk = '';
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width <= maxWidth) {
            chunk += ch;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      }
    }

    if (current) lines.push(current);
  }

  return lines.length > 0 ? lines : ['-'];
}

function drawWrappedLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  align: CanvasTextAlign = 'left'
): number {
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  lines.forEach((line, idx) => {
    ctx.fillText(line, x, startY + idx * lineHeight);
  });
  return startY + lines.length * lineHeight;
}

function triggerCanvasPngDownload(canvas: HTMLCanvasElement, fileName: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve();
          return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve();
      }, 'image/png');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    resolve();
  });
}

/**
 * Mengunduh kuitansi digital ke dalam format gambar PNG beresolusi tinggi (scale 2).
 * Dirender langsung ke Canvas 2D dengan pengukuran teks adaptif dan sudut luar siku tajam (0px),
 * bebas dari kendala scroll viewport atau pemotongan header html2canvas.
 */
export async function downloadReceiptPng(
  item: BospRealizationItem,
  school: SchoolData
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Abaikan jika browser tidak mendukung FontFaceSet
    }
  }

  const W = 780;
  const PAD_X = 28;
  const INNER_W = W - PAD_X * 2; // 724px
  const SCALE = 2;

  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = W;
  measureCanvas.height = 100;
  const mCtx = measureCanvas.getContext('2d');
  if (!mCtx) {
    throw new Error('Canvas 2D context tidak tersedia.');
  }

  const lineItems = item.invoice?.lineItems || [];
  const terbilangText = terbilangRupiah(item.amount);
  const printTimestamp = getFormattedPrintTime();

  // --- HITUNG METRIK HEADER ---
  const headerTopPad = 24;
  mCtx.font = `800 11px ${RECEIPT_MONO_FONT}`;
  const statusText = 'LUNAS / DIVERIFIKASI';
  const statusPillW = Math.ceil(mCtx.measureText(statusText).width) + 28;
  const statusPillH = 26;

  mCtx.font = `800 10px ${RECEIPT_MONO_FONT}`;
  const tagText = 'SIPLAH KEMENDIKDASMEN';
  const tagPillW = Math.ceil(mCtx.measureText(tagText).width) + 18;
  const tagPillH = 22;

  const leftColMaxW = INNER_W - statusPillW - 22;
  const ministryText = 'Kementerian Pendidikan Dasar dan Menengah RI';
  mCtx.font = `500 11px ${RECEIPT_SANS_FONT}`;
  const ministryFitsInline = tagPillW + 10 + mCtx.measureText(ministryText).width <= leftColMaxW;
  const ministryWrapLines = ministryFitsInline
    ? []
    : wrapCanvasText(mCtx, ministryText, leftColMaxW);

  const titleYOffset = ministryFitsInline
    ? tagPillH + 10
    : tagPillH + 5 + ministryWrapLines.length * 15 + 8;

  mCtx.font = `400 12px ${RECEIPT_SANS_FONT}`;
  const headerSubLines = wrapCanvasText(
    mCtx,
    'Bukti Sah Transaksi Pengadaan Barang & Jasa Dana Bantuan Operasional Satuan Pendidikan',
    leftColMaxW
  );
  const leftHeaderBottom = headerTopPad + titleYOffset + 26 + 4 + headerSubLines.length * 17;
  const rightHeaderBottom = headerTopPad + statusPillH + 7 + 15;
  const headerDividerY = Math.max(leftHeaderBottom, rightHeaderBottom) + 16;

  const metaGap = 14;
  const metaColW = (INNER_W - metaGap * 3) / 4;
  const metaValues = [
    { label: 'NOMOR KUITANSI', value: item.invoice?.number || '-', color: '#F8FAFC', font: `700 12px ${RECEIPT_MONO_FONT}` },
    { label: 'TANGGAL TRANSAKSI', value: item.invoice?.date || '-', color: '#F8FAFC', font: `600 12px ${RECEIPT_MONO_FONT}` },
    { label: 'TAHAP PENYALURAN', value: `BOSP ${item.stage}`, color: '#38BDF8', font: `700 12px ${RECEIPT_SANS_FONT}` },
    { label: 'KATEGORI BELANJA', value: item.category || '-', color: '#F8FAFC', font: `600 12px ${RECEIPT_SANS_FONT}` },
  ];
  const metaWrapped = metaValues.map((mv) => {
    mCtx.font = mv.font;
    return {
      ...mv,
      lines: wrapCanvasText(mCtx, mv.value, metaColW),
    };
  });
  const maxMetaLines = Math.max(...metaWrapped.map((m) => m.lines.length), 1);
  const metaTopY = headerDividerY + 14;
  const headerAccentH = 3;
  const headerH = metaTopY + 15 + maxMetaLines * 17 + 20 + headerAccentH;

  // --- HITUNG METRIK IDENTITAS PIHAK ---
  const partyGap = 20;
  const partyBoxW = (INNER_W - partyGap) / 2;
  const partyInnerW = partyBoxW - 32;

  const schoolAddress = [
    school.address,
    school.kecamatan,
    school.kabupaten,
    school.provinsi,
  ]
    .filter(Boolean)
    .join(', ');

  mCtx.font = `800 14px ${RECEIPT_SANS_FONT}`;
  const schoolNameLines = wrapCanvasText(mCtx, school.name, partyInnerW);
  const vendorNameLines = wrapCanvasText(
    mCtx,
    item.invoice?.vendorName || 'Mitra Pengadaan SIPLah',
    partyInnerW
  );

  mCtx.font = `500 11.5px ${RECEIPT_MONO_FONT}`;
  const schoolMetaLines = wrapCanvasText(
    mCtx,
    `NPSN: ${school.npsn}  |  Jenjang: ${school.jenjang} (${school.status})`,
    partyInnerW
  );
  const vendorMetaLines = wrapCanvasText(
    mCtx,
    `NPWP: ${item.invoice?.npwp || '00.000.000.0-000.000'}`,
    partyInnerW
  );

  mCtx.font = `400 11px ${RECEIPT_SANS_FONT}`;
  const schoolAddrLines = wrapCanvasText(mCtx, schoolAddress || '-', partyInnerW);
  const vendorAddrLines = wrapCanvasText(
    mCtx,
    item.invoice?.vendorAddress || 'Alamat Toko Terdaftar SIPLah',
    partyInnerW
  );

  const leftPartyH =
    14 +
    18 +
    schoolNameLines.length * 18 +
    5 +
    schoolMetaLines.length * 16 +
    4 +
    schoolAddrLines.length * 15 +
    14;
  const rightPartyH =
    14 +
    18 +
    vendorNameLines.length * 18 +
    5 +
    vendorMetaLines.length * 16 +
    4 +
    vendorAddrLines.length * 15 +
    14;
  const partyBoxH = Math.max(leftPartyH, rightPartyH);
  const partiesSectionY = headerH;
  const partiesSectionH = 22 + partyBoxH + 22;

  // --- HITUNG METRIK TABEL BARANG ---
  const tableSectionY = partiesSectionY + partiesSectionH;
  const tableTopPad = 22;
  const colWidths = { no: 44, name: 320, qty: 90, price: 130, subtotal: 140 };
  const tableHeaderH = 34;

  const effectiveLineItems =
    lineItems.length > 0
      ? lineItems
      : [
          {
            name: item.name,
            qty: item.unitSummary || '1 Paket',
            unitPrice: item.amount,
            subtotal: item.amount,
          },
        ];

  const preparedRows = effectiveLineItems.map((li, idx) => {
    mCtx.font = `600 13px ${RECEIPT_SANS_FONT}`;
    const nameLines = wrapCanvasText(mCtx, li.name, colWidths.name - 20);
    mCtx.font = `400 11px ${RECEIPT_SANS_FONT}`;
    const catLines = wrapCanvasText(mCtx, `Kategori: ${item.category}`, colWidths.name - 20);
    mCtx.font = `600 12px ${RECEIPT_MONO_FONT}`;
    const qtyLines = wrapCanvasText(mCtx, li.qty, colWidths.qty - 14);
    const contentH = Math.max(
      nameLines.length * 18 + 3 + catLines.length * 15,
      qtyLines.length * 16,
      18
    );
    return {
      idx,
      li,
      nameLines,
      catLines,
      qtyLines,
      rowH: 11 + contentH + 11,
    };
  });

  const rowsTotalH = preparedRows.reduce((sum, r) => sum + r.rowH, 0);
  const totalBoxTopGap = 16;
  const totalAmountStr = formatRupiah(item.amount);
  mCtx.font = `800 22px ${RECEIPT_MONO_FONT}`;
  const totalAmountW = Math.ceil(mCtx.measureText(totalAmountStr).width);
  const totalLeftMaxW = Math.max(240, INNER_W - 36 - totalAmountW - 24);
  mCtx.font = `italic 600 12px ${RECEIPT_SANS_FONT}`;
  const terbilangLines = wrapCanvasText(
    mCtx,
    `Terbilang: "${terbilangText}"`,
    totalLeftMaxW
  );
  const totalBoxH = Math.max(14 + 16 + 4 + terbilangLines.length * 17 + 14, 64);
  const tableSectionH = tableTopPad + tableHeaderH + rowsTotalH + totalBoxTopGap + totalBoxH + 12;

  // --- HITUNG METRIK PERUNTUKAN ---
  const allocSectionY = tableSectionY + tableSectionH;
  mCtx.font = `400 12px ${RECEIPT_SANS_FONT}`;
  const allocLines = wrapCanvasText(
    mCtx,
    item.allocation || 'Pengadaan barang/jasa operasional sekolah sesuai rencana kerja anggaran sekolah (ARKAS).',
    INNER_W - 32
  );
  const allocBoxH = 12 + 16 + 4 + allocLines.length * 18 + 12;
  const allocSectionH = 10 + allocBoxH + 18;

  // --- HITUNG METRIK PENGESAHAN / TANDA TANGAN ---
  const signSectionY = allocSectionY + allocSectionH;
  const signColW = 224;
  const signSpaceGap = 46;
  mCtx.font = `800 13px ${RECEIPT_SANS_FONT}`;
  const treasurerLines = wrapCanvasText(
    mCtx,
    item.invoice?.treasurerName || 'Bendahara BOSP',
    signColW - 16
  );
  const principalLines = wrapCanvasText(
    mCtx,
    item.invoice?.principalName || 'Kepala Sekolah',
    signColW - 16
  );
  const maxSignerLines = Math.max(treasurerLines.length, principalLines.length, 1);
  const signColContentH = 15 + signSpaceGap + 6 + maxSignerLines * 17 + 2 + 12;
  const stampH = 74;
  const signSectionH = 20 + Math.max(signColContentH, stampH) + 22;

  // --- HITUNG METRIK FOOTER ---
  const footerSectionY = signSectionY + signSectionH;
  mCtx.font = `600 10px ${RECEIPT_MONO_FONT}`;
  const printStampText = `Dicetak: ${printTimestamp}`;
  const printStampW = Math.ceil(mCtx.measureText(printStampText).width);
  const footerLeftMaxW = Math.max(260, INNER_W - printStampW - 24);
  mCtx.font = `400 10px ${RECEIPT_SANS_FONT}`;
  const footerLines = wrapCanvasText(
    mCtx,
    'Dokumen kuitansi digital ini dicetak dari Portal Transparansi BOSP DARADIK. Terdaftar pada basis data ARKAS & SIPLah Kemendikdasmen RI.',
    footerLeftMaxW
  );
  const footerH = Math.max(12 + footerLines.length * 14 + 12, 46);

  const TOTAL_H = footerSectionY + footerH;

  // --- RENDER KANVAS FINAL 2X DPI (SUDUT TAJAM 0PX) ---
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = TOTAL_H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal membuat kanvas kuitansi PNG.');
  }
  ctx.scale(SCALE, SCALE);

  // Latar penuh kertas putih siku tajam (tanpa radius tumpul di pojok luar)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, TOTAL_H);

  // 1. GAMBAR HEADER KOP RESMI (FULL-BLEED KE POJOK ATAS)
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, W, headerH - headerAccentH);
  ctx.fillStyle = '#2E6496';
  ctx.fillRect(0, headerH - headerAccentH, W, headerAccentH);

  // Tag biru SIPLah Kemendikdasmen
  drawRoundedRectPath(ctx, PAD_X, headerTopPad, tagPillW, tagPillH, 5);
  ctx.fillStyle = '#2E6496';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 10px ${RECEIPT_MONO_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, PAD_X + tagPillW / 2, headerTopPad + tagPillH / 2 + 0.5);

  // Keterangan kementerian
  ctx.fillStyle = '#94A3B8';
  ctx.font = `500 11px ${RECEIPT_SANS_FONT}`;
  if (ministryFitsInline) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ministryText, PAD_X + tagPillW + 10, headerTopPad + tagPillH / 2 + 0.5);
  } else {
    drawWrappedLines(ctx, ministryWrapLines, PAD_X, headerTopPad + tagPillH + 5, 15);
  }

  // Badge LUNAS / DIVERIFIKASI (kanan atas)
  const statusPillX = W - PAD_X - statusPillW;
  drawRoundedRectPath(ctx, statusPillX, headerTopPad, statusPillW, statusPillH, 13);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#10B981';
  ctx.stroke();
  ctx.fillStyle = '#34D399';
  ctx.font = `800 11px ${RECEIPT_MONO_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(statusText, statusPillX + statusPillW / 2, headerTopPad + statusPillH / 2 + 0.5);

  ctx.fillStyle = '#94A3B8';
  ctx.font = `600 11px ${RECEIPT_MONO_FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('ARKAS TAHUN 2026', W - PAD_X, headerTopPad + statusPillH + 7);

  // Judul Utama & Subjudul Kuitansi
  const titleY = headerTopPad + titleYOffset;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 20px ${RECEIPT_SANS_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('KUITANSI PEMBELIAN BOSP', PAD_X, titleY);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = `400 12px ${RECEIPT_SANS_FONT}`;
  drawWrappedLines(ctx, headerSubLines, PAD_X, titleY + 26 + 4, 17);

  // Garis pemisah & Metadata 4 kolom di Header
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD_X, headerDividerY);
  ctx.lineTo(W - PAD_X, headerDividerY);
  ctx.stroke();

  metaWrapped.forEach((m, i) => {
    const colX = PAD_X + i * (metaColW + metaGap);
    ctx.fillStyle = '#94A3B8';
    ctx.font = `700 10px ${RECEIPT_SANS_FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(m.label, colX, metaTopY);

    ctx.fillStyle = m.color;
    ctx.font = m.font;
    drawWrappedLines(ctx, m.lines, colX, metaTopY + 15, 17);
  });

  // 2. GAMBAR IDENTITAS DUA PIHAK
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, partiesSectionY, W, partiesSectionH);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, partiesSectionY + partiesSectionH);
  ctx.lineTo(W, partiesSectionY + partiesSectionH);
  ctx.stroke();

  const partyBoxY = partiesSectionY + 22;
  const drawPartyBox = (
    x: number,
    heading: string,
    titleLines: string[],
    metaLines: string[],
    addrLines: string[]
  ) => {
    drawRoundedRectPath(ctx, x, partyBoxY, partyBoxW, partyBoxH, 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#CBD5E1';
    ctx.stroke();

    let py = partyBoxY + 14;
    ctx.fillStyle = '#2E6496';
    ctx.font = `800 10px ${RECEIPT_SANS_FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(heading.toUpperCase(), x + 16, py);
    py += 18;

    ctx.fillStyle = '#1E293B';
    ctx.font = `800 14px ${RECEIPT_SANS_FONT}`;
    py = drawWrappedLines(ctx, titleLines, x + 16, py, 18) + 5;

    ctx.fillStyle = '#475569';
    ctx.font = `500 11.5px ${RECEIPT_MONO_FONT}`;
    py = drawWrappedLines(ctx, metaLines, x + 16, py, 16) + 4;

    ctx.fillStyle = '#64748B';
    ctx.font = `400 11px ${RECEIPT_SANS_FONT}`;
    drawWrappedLines(ctx, addrLines, x + 16, py, 15);
  };

  drawPartyBox(
    PAD_X,
    'Satuan Pendidikan (Penerima Barang / KPA):',
    schoolNameLines,
    schoolMetaLines,
    schoolAddrLines
  );
  drawPartyBox(
    PAD_X + partyBoxW + partyGap,
    'Toko Mitra SIPLah (Penyedia Barang / Jasa):',
    vendorNameLines,
    vendorMetaLines,
    vendorAddrLines
  );

  // 3. GAMBAR TABEL RINCIAN BARANG
  const tblX = PAD_X;
  const tblHeaderY = tableSectionY + tableTopPad;
  const xColNo = tblX;
  const xColName = xColNo + colWidths.no;
  const xColQty = xColName + colWidths.name;
  const xColPrice = xColQty + colWidths.qty;
  const xColSub = xColPrice + colWidths.price;

  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(tblX, tblHeaderY, INNER_W, tableHeaderH);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tblX, tblHeaderY);
  ctx.lineTo(tblX + INNER_W, tblHeaderY);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tblX, tblHeaderY + tableHeaderH);
  ctx.lineTo(tblX + INNER_W, tblHeaderY + tableHeaderH);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = `800 11px ${RECEIPT_SANS_FONT}`;
  ctx.textBaseline = 'middle';
  const thMidY = tblHeaderY + tableHeaderH / 2 + 0.5;
  ctx.textAlign = 'center';
  ctx.fillText('NO', xColNo + colWidths.no / 2, thMidY);
  ctx.textAlign = 'left';
  ctx.fillText('RINCIAN BARANG / SPESIFIKASI PENGADAAN', xColName + 10, thMidY);
  ctx.textAlign = 'center';
  ctx.fillText('VOL / QTY', xColQty + colWidths.qty / 2, thMidY);
  ctx.textAlign = 'right';
  ctx.fillText('HARGA SATUAN', xColPrice + colWidths.price - 10, thMidY);
  ctx.fillText('SUBTOTAL', xColSub + colWidths.subtotal - 10, thMidY);

  let rowY = tblHeaderY + tableHeaderH;
  preparedRows.forEach((row) => {
    const ry = rowY + 11;
    ctx.fillStyle = '#64748B';
    ctx.font = `500 12px ${RECEIPT_MONO_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(row.idx + 1), xColNo + colWidths.no / 2, ry);

    ctx.fillStyle = '#1E293B';
    ctx.font = `600 13px ${RECEIPT_SANS_FONT}`;
    const afterNameY = drawWrappedLines(ctx, row.nameLines, xColName + 10, ry, 18);
    ctx.fillStyle = '#64748B';
    ctx.font = `400 11px ${RECEIPT_SANS_FONT}`;
    drawWrappedLines(ctx, row.catLines, xColName + 10, afterNameY + 3, 15);

    ctx.fillStyle = '#1E293B';
    ctx.font = `600 12px ${RECEIPT_MONO_FONT}`;
    drawWrappedLines(ctx, row.qtyLines, xColQty + colWidths.qty / 2, ry, 16, 'center');

    ctx.fillStyle = '#475569';
    ctx.font = `500 12px ${RECEIPT_MONO_FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(formatRupiah(Math.round(row.li.unitPrice)), xColPrice + colWidths.price - 10, ry);

    ctx.fillStyle = '#1E293B';
    ctx.font = `700 13px ${RECEIPT_MONO_FONT}`;
    ctx.fillText(formatRupiah(row.li.subtotal), xColSub + colWidths.subtotal - 10, ry);

    rowY += row.rowH;
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tblX, rowY);
    ctx.lineTo(tblX + INNER_W, rowY);
    ctx.stroke();
  });

  // Total Box
  const totalBoxY = rowY + totalBoxTopGap;
  drawRoundedRectPath(ctx, PAD_X, totalBoxY, INNER_W, totalBoxH, 8);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#CBD5E1';
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#475569';
  ctx.font = `800 11px ${RECEIPT_SANS_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('TOTAL PEMBAYARAN (LUNAS DIBAYAR BOSP):', PAD_X + 18, totalBoxY + 14);

  ctx.fillStyle = '#2E6496';
  ctx.font = `italic 600 12px ${RECEIPT_SANS_FONT}`;
  drawWrappedLines(ctx, terbilangLines, PAD_X + 18, totalBoxY + 34, 17);

  ctx.fillStyle = '#2E6496';
  ctx.font = `800 22px ${RECEIPT_MONO_FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatRupiah(item.amount), PAD_X + INNER_W - 18, totalBoxY + totalBoxH / 2);

  // 4. GAMBAR PERUNTUKAN ALOKASI
  const allocBoxY = allocSectionY + 10;
  drawRoundedRectPath(ctx, PAD_X, allocBoxY, INNER_W, allocBoxH, 8);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#E2E8F0';
  ctx.stroke();

  ctx.fillStyle = '#2E6496';
  ctx.font = `800 10px ${RECEIPT_SANS_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('PERUNTUKAN ALOKASI DANA BOSP:', PAD_X + 16, allocBoxY + 12);

  ctx.fillStyle = '#334155';
  ctx.font = `400 12px ${RECEIPT_SANS_FONT}`;
  drawWrappedLines(ctx, allocLines, PAD_X + 16, allocBoxY + 32, 18);

  // 5. GAMBAR TANDA TANGAN & STEMPEL DIGITAL
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, signSectionY);
  ctx.lineTo(W, signSectionY);
  ctx.stroke();

  const stampW = 220;
  const stampX = PAD_X;
  const stampY = signSectionY + signSectionH - 22 - stampH;
  drawRoundedRectPath(ctx, stampX, stampY, stampW, stampH, 10);
  ctx.fillStyle = '#EBF3F8';
  ctx.fill();
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = '#2E6496';
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#2E6496';
  ctx.font = `800 9px ${RECEIPT_MONO_FONT}`;
  ctx.fillText('TERVERIFIKASI SISTEM', stampX + stampW / 2, stampY + 12);

  ctx.fillStyle = '#0F2742';
  ctx.font = `800 12px ${RECEIPT_MONO_FONT}`;
  ctx.fillText('ARKAS • SIPLah 2026', stampX + stampW / 2, stampY + 26);

  ctx.fillStyle = '#475569';
  ctx.font = `400 9.5px ${RECEIPT_SANS_FONT}`;
  ctx.fillText('Kementerian Pendidikan Dasar', stampX + stampW / 2, stampY + 45);
  ctx.fillText('& Menengah RI', stampX + stampW / 2, stampY + 57);

  const drawSignatureCol = (
    centerX: number,
    topLabel: string,
    roleTitle: string,
    personLines: string[],
    subRole: string
  ) => {
    const startY = signSectionY + 20;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#64748B';
    ctx.font = `600 11px ${RECEIPT_SANS_FONT}`;
    ctx.fillText(topLabel, centerX, startY);

    ctx.fillStyle = '#1E293B';
    ctx.font = `800 11px ${RECEIPT_SANS_FONT}`;
    ctx.fillText(roleTitle, centerX, startY + 15);

    const ruleY = startY + 15 + signSpaceGap;
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 88, ruleY);
    ctx.lineTo(centerX + 88, ruleY);
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.font = `800 13px ${RECEIPT_SANS_FONT}`;
    const afterName = drawWrappedLines(ctx, personLines, centerX, ruleY + 6, 17, 'center');

    ctx.fillStyle = '#64748B';
    ctx.font = `500 10px ${RECEIPT_MONO_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(subRole, centerX, afterName + 2);
  };

  const remStart = PAD_X + stampW + 24;
  const remColW = (W - PAD_X - remStart) / 2;
  drawSignatureCol(
    remStart + remColW * 0.5,
    'Lunas Dibayar Oleh:',
    'Bendahara Satuan Pendidikan',
    treasurerLines,
    'Pengelola Dana BOSP'
  );
  drawSignatureCol(
    remStart + remColW * 1.5,
    'Mengetahui / Menyetujui:',
    'Kepala Satuan Pendidikan',
    principalLines,
    'Kuasa Pengguna Anggaran (KPA)'
  );

  // 6. GAMBAR FOOTER INTEGRITAS
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, footerSectionY, W, footerH);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerSectionY);
  ctx.lineTo(W, footerSectionY);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = `400 10px ${RECEIPT_SANS_FONT}`;
  drawWrappedLines(ctx, footerLines, PAD_X, footerSectionY + 12, 14);

  ctx.fillStyle = '#475569';
  ctx.font = `600 10px ${RECEIPT_MONO_FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(printStampText, W - PAD_X, footerSectionY + footerH / 2);

  // Bingkai luar siku 90° tajam pada area dokumen putih di bawah header
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1, headerH);
  ctx.lineTo(1, TOTAL_H - 1);
  ctx.lineTo(W - 1, TOTAL_H - 1);
  ctx.lineTo(W - 1, headerH);
  ctx.stroke();

  const invoiceNumClean = (item.invoice?.number || 'BOSP')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 32);

  await triggerCanvasPngDownload(canvas, `Kuitansi-BOSP-${invoiceNumClean}.png`);
}

