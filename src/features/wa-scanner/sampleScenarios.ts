export interface WaSampleScenario {
  id: string;
  label: string;
  shortTag: string;
  category: 'duplikasi_bosp' | 'pungutan_ilegal' | 'sukarela_sah';
  badgeColor: string;
  fileName: string;
  sampleText: string;
  generateCanvas: () => HTMLCanvasElement;
}

function drawRoundedBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export const WA_SAMPLE_SCENARIOS: WaSampleScenario[] = [
  {
    id: 'sample-kipas',
    label: 'Kipas Angin Dinding (Rp 50rb)',
    shortTag: 'Duplikasi BOSP',
    category: 'duplikasi_bosp',
    badgeColor: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
    fileName: '01_WA_Kipas_Angin_Lab.png',
    sampleText:
      'Assalamualaikum Bapak Ibu wali murid, sesuai hasil rapat paguyuban kemarin, dimohon wajib transfer iuran kipas angin dan exhaust lab komputer sebesar Rp 50.000 per siswa paling lambat Jumat ini ke rekening bendahara.',
    generateCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;

      // Background WA wallpaper
      ctx.fillStyle = '#EFEAE2';
      ctx.fillRect(0, 0, 720, 480);

      // Header WA
      ctx.fillStyle = '#075E54';
      ctx.fillRect(0, 0, 720, 68);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Paguyuban Wali Murid Kelas X SIJA', 24, 42);

      // Date bubble
      drawRoundedBubble(ctx, 290, 84, 140, 30, 8, '#FFFFFF', '#D1D7DB');
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('HARI INI', 334, 104);

      // Incoming chat bubble
      drawRoundedBubble(ctx, 24, 130, 640, 260, 14, '#FFFFFF', '#D1D7DB');

      ctx.fillStyle = '#0F766E';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText('Ibu Rina Komite', 44, 168);

      ctx.fillStyle = '#111B21';
      ctx.font = '18px sans-serif';
      ctx.fillText('Assalamualaikum Bapak Ibu wali murid,', 44, 206);
      ctx.fillText('sesuai hasil rapat kemarin dimohon wajib transfer', 44, 240);
      ctx.fillText('iuran kipas angin dinding lab sebesar Rp 50.000 per siswa', 44, 274);
      ctx.fillText('paling lambat Jumat ini ke rekening bendahara.', 44, 308);

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('08:14 WIB', 570, 365);

      return canvas;
    },
  },
  {
    id: 'sample-wifi',
    label: 'WiFi & Router Lab (Rp 75rb)',
    shortTag: 'Duplikasi BOSP',
    category: 'duplikasi_bosp',
    badgeColor: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
    fileName: '02_WA_WiFi_Router_Sekolah.png',
    sampleText:
      'Mohon perhatian Bapak Ibu wali murid, sehubungan peremajaan switch gigabit dan router wifi lab komputer sekolah, setiap siswa wajib bayar tagihan Rp 75.000 minggu ini.',
    generateCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 460;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#EFEAE2';
      ctx.fillRect(0, 0, 720, 460);

      ctx.fillStyle = '#075E54';
      ctx.fillRect(0, 0, 720, 68);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('Grup Koordinasi Wali Murid', 24, 42);

      drawRoundedBubble(ctx, 290, 84, 140, 30, 8, '#FFFFFF', '#D1D7DB');
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('HARI INI', 334, 104);

      drawRoundedBubble(ctx, 24, 130, 640, 240, 14, '#FFFFFF', '#D1D7DB');

      ctx.fillStyle = '#0F766E';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText('Pengurus Lab Jaringan', 44, 168);

      ctx.fillStyle = '#111B21';
      ctx.font = '18px sans-serif';
      ctx.fillText('Mohon perhatian Bapak Ibu wali murid,', 44, 206);
      ctx.fillText('sehubungan peremajaan switch dan router wifi sekolah,', 44, 240);
      ctx.fillText('setiap siswa wajib bayar iuran Rp 75.000 minggu ini.', 44, 274);

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('10:30 WIB', 570, 345);

      return canvas;
    },
  },
  {
    id: 'sample-uang-gedung',
    label: 'Uang Gedung & Syarat Ujian (Rp 500rb)',
    shortTag: 'Pungutan Ilegal',
    category: 'pungutan_ilegal',
    badgeColor: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
    fileName: '03_WA_Uang_Gedung_Syarat_Ujian.png',
    sampleText:
      'Diberitahukan kepada wali murid, iuran uang gedung dan uang pangkal sebesar Rp 500.000 wajib dilunasi. Bagi yang belum lunas, kartu ujian tidak akan diberikan.',
    generateCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 470;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#EFEAE2';
      ctx.fillRect(0, 0, 720, 470);

      ctx.fillStyle = '#075E54';
      ctx.fillRect(0, 0, 720, 68);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('Pengumuman Administrasi Siswa', 24, 42);

      drawRoundedBubble(ctx, 290, 84, 140, 30, 8, '#FFFFFF', '#D1D7DB');
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('HARI INI', 334, 104);

      drawRoundedBubble(ctx, 24, 130, 640, 250, 14, '#FFFFFF', '#D1D7DB');

      ctx.fillStyle = '#DC2626';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText('Bendahara Tata Usaha', 44, 168);

      ctx.fillStyle = '#111B21';
      ctx.font = '18px sans-serif';
      ctx.fillText('Diberitahukan kepada seluruh wali murid,', 44, 206);
      ctx.fillText('iuran uang gedung dan uang pangkal Rp 500.000 wajib lunas.', 44, 240);
      ctx.fillText('Bagi yang belum lunas, kartu ujian tidak akan diberikan.', 44, 274);

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('13:45 WIB', 570, 355);

      return canvas;
    },
  },
  {
    id: 'sample-kaos',
    label: 'Kaos Kelas Outing (Rp 35rb - Sukarela)',
    shortTag: 'Sukarela Sah',
    category: 'sukarela_sah',
    badgeColor: 'bg-[#EBF3F8] text-[#2E6496] border-[#C9DFDC]',
    fileName: '04_WA_Kaos_Kelas_Sukarela.png',
    sampleText:
      'Halo Bapak/Ibu parents, untuk kaos kelas & acara outing ada usulan patungan sukarela seikhlasnya Rp 35.000/siswa bagi yang berkenan. Yang belum bisa ikut tidak ada paksaan ya. Terima kasih!',
    generateCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 470;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#EFEAE2';
      ctx.fillRect(0, 0, 720, 470);

      ctx.fillStyle = '#075E54';
      ctx.fillRect(0, 0, 720, 68);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('Paguyuban Angkatan X', 24, 42);

      drawRoundedBubble(ctx, 290, 84, 140, 30, 8, '#FFFFFF', '#D1D7DB');
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('HARI INI', 334, 104);

      drawRoundedBubble(ctx, 24, 130, 640, 250, 14, '#FFFFFF', '#D1D7DB');

      ctx.fillStyle = '#0284C7';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText('Ketua Paguyuban Kelas', 44, 168);

      ctx.fillStyle = '#111B21';
      ctx.font = '18px sans-serif';
      ctx.fillText('Halo Bapak/Ibu parents, untuk kaos kelas & outing', 44, 206);
      ctx.fillText('ada usulan patungan sukarela seikhlasnya Rp 35.000/siswa.', 44, 240);
      ctx.fillText('Bagi yang berkenan saja ya, tanpa ada paksaan apapun.', 44, 274);

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('16:20 WIB', 570, 355);

      return canvas;
    },
  },
];

