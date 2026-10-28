export interface WaOcrTestScenario {
  id: string;
  number: number;
  title: string;
  conditionBadge: string;
  description: string;
  fileName: string;
  groundTruth: string;
  expectedStatus: 'danger' | 'safe' | 'neutral';
  renderToCanvas: () => HTMLCanvasElement;
}

function drawRoundedRect(
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

export const WA_OCR_TEST_SCENARIOS: WaOcrTestScenario[] = [
  {
    id: 'scen-01-clean-light',
    number: 1,
    title: 'Teks Jelas & Latar Polos (Mode Terang)',
    conditionBadge: 'Kondisi 1 • Standar Bersih',
    description:
      'Screenshot WhatsApp grup wali murid dengan kontras tinggi, teks jelas, nama pengirim, dan waktu pesan.',
    fileName: '01_WA_Teks_Jelas_Kipas_Lab.png',
    expectedStatus: 'danger',
    groundTruth: [
      'Paguyuban Wali Murid SMK TI BAZMA',
      'HARI INI',
      'Ibu Rina Komite',
      'Assalamualaikum Bapak Ibu wali murid SMK TI BAZMA,',
      'sesuai hasil rapat paguyuban kemarin, dimohon wajib',
      'transfer iuran kipas angin dan exhaust lab komputer',
      'sebesar Rp 50.000 per siswa paling lambat Jumat ini.',
      '08:14 WIB',
    ].join('\n'),
    renderToCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 520;
      const ctx = canvas.getContext('2d')!;

      // Clean light background
      ctx.fillStyle = '#EFEAE2';
      ctx.fillRect(0, 0, 760, 520);

      // Header bar (light clean bar so all text is crisp)
      ctx.fillStyle = '#075E54';
      ctx.fillRect(0, 0, 760, 72);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('Paguyuban Wali Murid SMK TI BAZMA', 28, 44);

      // Date pill
      drawRoundedRect(ctx, 310, 92, 140, 34, 10, '#FFFFFF', '#D1D7DB');
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('HARI INI', 344, 115);

      // Incoming chat bubble
      drawRoundedRect(ctx, 28, 146, 660, 290, 14, '#FFFFFF', '#D1D7DB');
      ctx.fillStyle = '#0F766E';
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText('Ibu Rina Komite', 48, 184);

      ctx.fillStyle = '#111B21';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Assalamualaikum Bapak Ibu wali murid SMK TI BAZMA,', 48, 226);
      ctx.fillText('sesuai hasil rapat paguyuban kemarin, dimohon wajib', 48, 262);
      ctx.fillText('transfer iuran kipas angin dan exhaust lab komputer', 48, 298);
      ctx.fillText('sebesar Rp 50.000 per siswa paling lambat Jumat ini.', 48, 334);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('08:14 WIB', 575, 405);

      return canvas;
    },
  },
  {
    id: 'scen-02-patterned-wallpaper',
    number: 2,
    title: 'Wallpaper Berpola & Warna Mengganggu',
    conditionBadge: 'Kondisi 2 • Latar Berpola',
    description:
      'Screenshot dengan pola diagonal, tekstur ramai, dan gelembung berwarna yang menguji ketahanan binarisasi adaptif.',
    fileName: '02_WA_Wallpaper_Berpola_Switch_WiFi.png',
    expectedStatus: 'danger',
    groundTruth: [
      'Grup Komite SIJA SMK TI BAZMA',
      'Pengurus Lab Jaringan',
      'Mohon perhatian Bapak Ibu, sehubungan peremajaan',
      'switch gigabit dan router wifi lab komputer SIJA,',
      'setiap siswa wajib bayar tagihan Rp 75.000 minggu ini.',
      '10:30 WIB',
    ].join('\n'),
    renderToCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;

      // Busy patterned wallpaper
      ctx.fillStyle = '#D9E4EC';
      ctx.fillRect(0, 0, 760, 480);
      ctx.strokeStyle = '#9BB8CD';
      ctx.lineWidth = 2;
      for (let i = -480; i < 760; i += 22) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 480, 480);
        ctx.stroke();
      }
      for (let y = 90; y < 460; y += 36) {
        for (let x = 20; x < 740; x += 44) {
          ctx.fillStyle = (x + y) % 3 === 0 ? '#B7CFE0' : '#C5D8E6';
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Header
      ctx.fillStyle = '#1E3A5F';
      ctx.fillRect(0, 0, 760, 70);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('Grup Komite SIJA SMK TI BAZMA', 28, 43);

      // Semi-tinted bubble over patterned background
      drawRoundedRect(ctx, 32, 110, 675, 290, 14, '#F4F9FC', '#7FA6C4');
      ctx.fillStyle = '#1D4ED8';
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText('Pengurus Lab Jaringan', 54, 152);

      ctx.fillStyle = '#0F172A';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Mohon perhatian Bapak Ibu, sehubungan peremajaan', 54, 198);
      ctx.fillText('switch gigabit dan router wifi lab komputer SIJA,', 54, 236);
      ctx.fillText('setiap siswa wajib bayar tagihan Rp 75.000 minggu ini.', 54, 274);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('10:30 WIB', 590, 365);

      return canvas;
    },
  },
  {
    id: 'scen-03-dark-mode',
    number: 3,
    title: 'Mode Gelap (Dark Mode WhatsApp)',
    conditionBadge: 'Kondisi 3 • Dark Mode',
    description:
      'Teks putih dan abu-abu terang di atas latar belakang gelap (#0B141A & #202C33) serta gelembung hijau gelap (#005C4B).',
    fileName: '03_WA_Dark_Mode_Modul_Cloud.png',
    expectedStatus: 'danger',
    groundTruth: [
      'Wali Santri SMK TI BAZMA 2026',
      'Koordinator Kurikulum',
      'Selamat malam Bapak Ibu, untuk pengadaan buku modul',
      'praktikum cloud dan jaringan komputer semester ini,',
      'dimohon segera lunasi iuran Rp 120.000 ke bendahara.',
      'Siap Pak, apakah wajib untuk semua siswa?',
      '19:45 WIB',
    ].join('\n'),
    renderToCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 540;
      const ctx = canvas.getContext('2d')!;

      // Dark mode background
      ctx.fillStyle = '#0B141A';
      ctx.fillRect(0, 0, 760, 540);

      // Dark header
      ctx.fillStyle = '#202C33';
      ctx.fillRect(0, 0, 760, 70);
      ctx.fillStyle = '#E9EDEF';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('Wali Santri SMK TI BAZMA 2026', 28, 44);

      // Incoming dark bubble
      drawRoundedRect(ctx, 28, 100, 650, 240, 14, '#202C33', '#374248');
      ctx.fillStyle = '#53BDEB';
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText('Koordinator Kurikulum', 48, 138);

      ctx.fillStyle = '#E9EDEF';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Selamat malam Bapak Ibu, untuk pengadaan buku modul', 48, 180);
      ctx.fillText('praktikum cloud dan jaringan komputer semester ini,', 48, 218);
      ctx.fillText('dimohon segera lunasi iuran Rp 120.000 ke bendahara.', 48, 256);

      // Outgoing dark green bubble
      drawRoundedRect(ctx, 180, 365, 550, 120, 14, '#005C4B', '#0A705C');
      ctx.fillStyle = '#E9EDEF';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Siap Pak, apakah wajib untuk semua siswa?', 204, 415);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('19:45 WIB', 620, 462);

      return canvas;
    },
  },
  {
    id: 'scen-04-long-multi-message',
    number: 4,
    title: 'Banyak Pesan & Baris Teks Panjang (Tinggi)',
    conditionBadge: 'Kondisi 4 • Multi-Bubble Panjang',
    description:
      'Screenshot memanjang dengan beberapa gelembung percakapan berurutan, balasan dikutip, dan teks multi-paragraf.',
    fileName: '04_WA_Banyak_Pesan_Proyektor.png',
    expectedStatus: 'danger',
    groundTruth: [
      'Paguyuban Kelas XI SIJA BAZMA',
      'KEMARIN',
      'Pak Hendra Komite',
      'Assalamualaikum Bapak Ibu wali murid kelas XI SIJA.',
      'Mengingatkan hasil pertemuan terkait fasilitas presentasi,',
      'dimohon transfer iuran proyektor lab komputer Rp 65.000',
      'paling lambat hari Sabtu sebelum ujian praktik dimulai.',
      'Wali Murid Ahmad',
      'Bukannya proyektor lab sudah ada dari dana BOSP sekolah?',
      'Mohon penjelasan rinciannya Pak.',
      '14:20 WIB',
    ].join('\n'),
    renderToCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 720;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#EFEAE2';
      ctx.fillRect(0, 0, 760, 720);

      ctx.fillStyle = '#075E54';
      ctx.fillRect(0, 0, 760, 68);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('Paguyuban Kelas XI SIJA BAZMA', 28, 42);

      drawRoundedRect(ctx, 305, 86, 150, 34, 10, '#FFFFFF', '#CBD5E1');
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('KEMARIN', 340, 109);

      // Bubble 1
      drawRoundedRect(ctx, 28, 138, 670, 250, 14, '#FFFFFF', '#D1D7DB');
      ctx.fillStyle = '#B45309';
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText('Pak Hendra Komite', 48, 174);

      ctx.fillStyle = '#111B21';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Assalamualaikum Bapak Ibu wali murid kelas XI SIJA.', 48, 214);
      ctx.fillText('Mengingatkan hasil pertemuan terkait fasilitas presentasi,', 48, 250);
      ctx.fillText('dimohon transfer iuran proyektor lab komputer Rp 65.000', 48, 286);
      ctx.fillText('paling lambat hari Sabtu sebelum ujian praktik dimulai.', 48, 322);

      // Bubble 2
      drawRoundedRect(ctx, 90, 415, 640, 230, 14, '#D9FDD3', '#A7F3D0');
      ctx.fillStyle = '#065F46';
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText('Wali Murid Ahmad', 112, 452);

      ctx.fillStyle = '#111B21';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Bukannya proyektor lab sudah ada dari dana BOSP sekolah?', 112, 494);
      ctx.fillText('Mohon penjelasan rinciannya Pak.', 112, 532);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('14:20 WIB', 615, 615);

      return canvas;
    },
  },
  {
    id: 'scen-05-low-contrast-small',
    number: 5,
    title: 'Teks Kecil, Tipis & Berkontras Rendah',
    conditionBadge: 'Kondisi 5 • Kontras Rendah',
    description:
      'Tulisan tipis dengan warna abu-abu redup yang mendekati warna latar belakang, menguji peningkatan kontras lokal.',
    fileName: '05_WA_Kontras_Rendah_Sanitasi.png',
    expectedStatus: 'danger',
    groundTruth: [
      'Info Asrama SMK TI BAZMA',
      'Pengurus Asrama',
      'Pemberitahuan kepada seluruh wali santri bahwa untuk',
      'perbaikan sanitasi kamar mandi dan wastafel asrama,',
      'diwajibkan membayar iuran Rp 40.000 per siswa.',
      '09:15 WIB',
    ].join('\n'),
    renderToCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 740;
      canvas.height = 460;
      const ctx = canvas.getContext('2d')!;

      // Low contrast muted gray background
      ctx.fillStyle = '#D8DEE3';
      ctx.fillRect(0, 0, 740, 460);

      ctx.fillStyle = '#AAB4BE';
      ctx.fillRect(0, 0, 740, 64);
      ctx.fillStyle = '#52606D';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText('Info Asrama SMK TI BAZMA', 28, 40);

      // Low-contrast bubble: #CFD6DC background with #6E7B88 text
      drawRoundedRect(ctx, 28, 96, 665, 280, 12, '#CFD6DC', '#B8C2CC');
      ctx.fillStyle = '#616E7C';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText('Pengurus Asrama', 48, 136);

      ctx.fillStyle = '#687582';
      ctx.font = '18px Arial, sans-serif';
      ctx.fillText('Pemberitahuan kepada seluruh wali santri bahwa untuk', 48, 180);
      ctx.fillText('perbaikan sanitasi kamar mandi dan wastafel asrama,', 48, 216);
      ctx.fillText('diwajibkan membayar iuran Rp 40.000 per siswa.', 48, 252);

      ctx.fillText('09:15 WIB', 575, 340);

      return canvas;
    },
  },
  {
    id: 'scen-06-compressed-lowres',
    number: 6,
    title: 'Resolusi Rendah & Kompresi (Upscaling Test)',
    conditionBadge: 'Kondisi 6 • Resolusi Rendah',
    description:
      'Gambar berukuran kecil (500px) yang telah mengalami penurunan kualitas, menguji upscaling adaptif dan penajaman huruf.',
    fileName: '06_WA_Kompresi_Meja_Kursi.jpg',
    expectedStatus: 'danger',
    groundTruth: [
      'Grup Wali Murid BAZMA',
      'Bendahara Kelas',
      'Bapak Ibu mohon segera transfer tagihan pengadaan',
      'meja kursi komputer lab sebesar Rp 85.000 wajib lunas.',
      '11:05 WIB',
    ].join('\n'),
    renderToCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 520;
      canvas.height = 340;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ECE5DD';
      ctx.fillRect(0, 0, 520, 340);

      ctx.fillStyle = '#075E54';
      ctx.fillRect(0, 0, 520, 48);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('Grup Wali Murid BAZMA', 18, 30);

      drawRoundedRect(ctx, 18, 68, 480, 220, 10, '#FFFFFF', '#CBD5E1');
      ctx.fillStyle = '#0F766E';
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillText('Bendahara Kelas', 32, 98);

      ctx.fillStyle = '#1E293B';
      ctx.font = '15px Arial, sans-serif';
      ctx.fillText('Bapak Ibu mohon segera transfer tagihan pengadaan', 32, 134);
      ctx.fillText('meja kursi komputer lab sebesar Rp 85.000 wajib lunas.', 32, 164);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText('11:05 WIB', 405, 255);

      return canvas;
    },
  },
  {
    id: 'scen-07-embedded-poster',
    number: 7,
    title: 'Teks di Dalam Gambar / Poster yang Dikirim di Chat',
    conditionBadge: 'Kondisi 7 • Poster dalam Chat',
    description:
      'Screenshot percakapan yang memuat gambar poster pengumuman berwarna di dalam gelembung chat beserta teks pengantarnya.',
    fileName: '07_WA_Poster_Dalam_Chat_Internet.png',
    expectedStatus: 'danger',
    groundTruth: [
      'Grup Paguyuban SMK TI BAZMA',
      'PENGUMUMAN RESMI KOMITE',
      'IURAN LANGGANAN INTERNET FIBER OPTIK',
      'Nominal Wajib: Rp 100.000 / Siswa',
      'Batas Akhir: 30 Oktober 2026',
      'Mohon Bapak Ibu membaca poster pengumuman di atas',
      'dan transfer sesuai nominal yang tertera.',
      '16:40 WIB',
    ].join('\n'),
    renderToCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 640;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#EFEAE2';
      ctx.fillRect(0, 0, 760, 640);

      ctx.fillStyle = '#075E54';
      ctx.fillRect(0, 0, 760, 66);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('Grup Paguyuban SMK TI BAZMA', 28, 42);

      // Chat bubble containing an embedded poster image + caption below
      drawRoundedRect(ctx, 28, 92, 680, 500, 14, '#FFFFFF', '#CBD5E1');

      // Embedded poster card inside the bubble
      drawRoundedRect(ctx, 46, 110, 644, 300, 12, '#1E3A8A', '#3B82F6');
      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('PENGUMUMAN RESMI KOMITE', 74, 164);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 21px Arial, sans-serif';
      ctx.fillText('IURAN LANGGANAN INTERNET FIBER OPTIK', 74, 214);

      drawRoundedRect(ctx, 74, 240, 580, 64, 8, '#FFFFFF');
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('Nominal Wajib: Rp 100.000 / Siswa', 96, 280);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText('Batas Akhir: 30 Oktober 2026', 74, 356);

      // Caption below embedded poster
      ctx.fillStyle = '#111B21';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Mohon Bapak Ibu membaca poster pengumuman di atas', 52, 456);
      ctx.fillText('dan transfer sesuai nominal yang tertera.', 52, 492);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('16:40 WIB', 595, 560);

      return canvas;
    },
  },
  {
    id: 'scen-08-edge-text-ui',
    number: 8,
    title: 'Teks di Dekat Batas Tepi Gambar & Elemen Antarmuka',
    conditionBadge: 'Kondisi 8 • Teks Tepi & UI',
    description:
      'Memuat tulisan di status bar paling atas, tepi layar, isi percakapan, serta bilah ketik pesan di batas bawah gambar.',
    fileName: '08_WA_Teks_Tepi_Antarmuka.png',
    expectedStatus: 'danger',
    groundTruth: [
      '07:55 WIB 4G 92%',
      'Paguyuban SMK TI BAZMA',
      'Sekretaris Komite',
      'Diberitahukan kepada wali murid bahwa iuran kipas angin',
      'ruang lab komputer sebesar Rp 50.000 wajib dikumpulkan.',
      'Ketik pesan di grup ini',
    ].join('\n'),
    renderToCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 540;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#EFEAE2';
      ctx.fillRect(0, 0, 760, 540);

      // Very top edge status bar
      ctx.fillStyle = '#054C44';
      ctx.fillRect(0, 0, 760, 34);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillText('07:55 WIB 4G 92%', 12, 23);

      // Header bar
      ctx.fillStyle = '#075E54';
      ctx.fillRect(0, 34, 760, 58);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 21px Arial, sans-serif';
      ctx.fillText('Paguyuban SMK TI BAZMA', 14, 71);

      // Chat bubble
      drawRoundedRect(ctx, 14, 122, 710, 260, 14, '#FFFFFF', '#CBD5E1');
      ctx.fillStyle = '#0F766E';
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText('Sekretaris Komite', 34, 162);

      ctx.fillStyle = '#111B21';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Diberitahukan kepada wali murid bahwa iuran kipas angin', 34, 210);
      ctx.fillText('ruang lab komputer sebesar Rp 50.000 wajib dikumpulkan.', 34, 248);

      // Very bottom edge input bar
      drawRoundedRect(ctx, 10, 482, 740, 48, 22, '#FFFFFF', '#CBD5E1');
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText('Ketik pesan di grup ini', 32, 512);

      return canvas;
    },
  },
  {
    id: 'scen-09-mixed-lang-slang',
    number: 9,
    title: 'Campuran Angka, Singkatan, Slang & Dwibahasa (Non-RKAS)',
    conditionBadge: 'Kondisi 9 • Slang & 2 Bahasa',
    description:
      'Menguji keakuratan karakter pada kata tidak baku, singkatan sehari-hari (utk, yg, rek, rb), angka, tanda baca, dan Bahasa Inggris.',
    fileName: '09_WA_Slang_Dwibahasa_Kaos.png',
    expectedStatus: 'safe',
    groundTruth: [
      'Paguyuban Angkatan X BAZMA',
      'Ketua Kelas X SIJA',
      'Halo Bapak/Ibu parents, utk kaos kelas & acara outing',
      'next week ada usulan patungan sukarela Rp 35.000/siswa',
      'yg berkenan bisa tf ke rek BCA 7120994812 ya. Thanks!',
      '17:10 WIB',
    ].join('\n'),
    renderToCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 500;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#EFEAE2';
      ctx.fillRect(0, 0, 760, 500);

      ctx.fillStyle = '#075E54';
      ctx.fillRect(0, 0, 760, 68);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('Paguyuban Angkatan X BAZMA', 28, 42);

      drawRoundedRect(ctx, 28, 104, 690, 310, 14, '#FFFFFF', '#CBD5E1');
      ctx.fillStyle = '#0369A1';
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText('Ketua Kelas X SIJA', 48, 146);

      ctx.fillStyle = '#111B21';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Halo Bapak/Ibu parents, utk kaos kelas & acara outing', 48, 194);
      ctx.fillText('next week ada usulan patungan sukarela Rp 35.000/siswa', 48, 232);
      ctx.fillText('yg berkenan bisa tf ke rek BCA 7120994812 ya. Thanks!', 48, 270);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('17:10 WIB', 595, 375);

      return canvas;
    },
  },
  {
    id: 'scen-10-blurred-occluded',
    number: 10,
    title: 'Teks Sebagian Buram / Tertutup (Uji Penandaan Ketidakpastian)',
    conditionBadge: 'Kondisi 10 • Sebagian Buram/Tertutup',
    description:
      'Memuat teks yang jelas sekaligus satu blok tulisan yang sengaja disensor/buram berat untuk membuktikan penandaan [tidak terbaca] tanpa mengarang.',
    fileName: '10_WA_Sebagian_Buram_Ketidakpastian.png',
    expectedStatus: 'danger',
    groundTruth: [
      'Grup Wali Murid SMK TI BAZMA',
      'Bendahara Komite',
      'Assalamualaikum Bapak Ibu, mohon segera melunasi',
      'iuran kipas angin lab komputer sebesar Rp 50.000/siswa.',
      '12:30 WIB',
    ].join('\n'),
    renderToCanvas: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 560;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#EFEAE2';
      ctx.fillRect(0, 0, 760, 560);

      ctx.fillStyle = '#075E54';
      ctx.fillRect(0, 0, 760, 68);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('Grup Wali Murid SMK TI BAZMA', 28, 42);

      // Clear bubble
      drawRoundedRect(ctx, 28, 96, 680, 230, 14, '#FFFFFF', '#CBD5E1');
      ctx.fillStyle = '#0F766E';
      ctx.font = 'bold 19px Arial, sans-serif';
      ctx.fillText('Bendahara Komite', 48, 134);

      ctx.fillStyle = '#111B21';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Assalamualaikum Bapak Ibu, mohon segera melunasi', 48, 178);
      ctx.fillText('iuran kipas angin lab komputer sebesar Rp 50.000/siswa.', 48, 216);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('12:30 WIB', 585, 292);

      // Second bubble with heavily redacted / occluded unreadable stroke pattern
      drawRoundedRect(ctx, 28, 355, 520, 140, 14, '#FFFFFF', '#CBD5E1');
      // Draw dense unreadable stroke-like redacted bars so the visual stroke detector flags an unreadable text region!
      ctx.fillStyle = '#475569';
      for (let row = 0; row < 2; row++) {
        const y = 385 + row * 38;
        for (let x = 52; x < 480; x += 9) {
          const barH = 14 + ((x * 7 + row * 3) % 6);
          ctx.fillRect(x, y, 4, barH);
          // Cross-hatch occlusion
          ctx.fillRect(x - 2, y + 6, 8, 3);
        }
      }

      return canvas;
    },
  },
];
