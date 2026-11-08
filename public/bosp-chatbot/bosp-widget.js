/**
 * BOSP AI CHATBOT WIDGET (INTERACTIVE EMOTIONAL ORB EDITION - VANILLA JS MANDIRI)
 * Fitur:
 * - Maskot Bola Glossy 3D dengan Dua Mata Kapsul Interaktif (Tanpa Mulut) sesuai referensi
 * - Mata memiliki emosi (senang, semangat, berpikir, bingung, empati, netral, menyapa),
 *   mengikuti kursor & ketikan input secara real-time, berkedip natural, dan berdenyut mengikuti suara
 * - Tombol peluncur jelas ("Tanya BOSP - Asisten AI") dengan miniatur mata orb
 * - Normalisasi Teks Bahasa Indonesia & Kamus Pelafalan + TTS (Piper WAV + Fallback Web Speech API id-ID)
 * - Jaminan balasan cepat (Server Gemini + Fallback Pengetahuan Resmi BOSP 2026 & DARADIK)
 */
(function () {
  'use strict';

  if (window.__BOSP_CHATBOT_MOUNTED__) return;
  window.__BOSP_CHATBOT_MOUNTED__ = true;

  const CONFIG = Object.assign(
    {
      apiBaseUrl: '',
      botName: 'Tanya BOS',
      greetingText: 'Halo! Aku Tanya BOS. Mau tanya apa hari ini seputar dana sekolah atau aturan BOSP?',
      storageMuteKey: 'daradik_bosp_tts_muted',
      maxInputLength: 300,
    },
    window.BOSP_CHATBOT_CONFIG || {}
  );

  const KAMUS_PELAFALAN = {
    BOSP: 'bos-pe',
    BOS: 'bos',
    RKAS: 'er-ka-a-es',
    ARKAS: 'ar-kas',
    SIPLah: 'sip-lah',
    SIPLAH: 'sip-lah',
    NPSN: 'en-pe-es-en',
    NISN: 'en-i-es-en',
    PPDB: 'pe-pe-de-be',
    SPMB: 'es-pe-em-be',
    ANBK: 'a-en-be-ka',
    UKK: 'u-ka-ka',
    SD: 'es-de',
    SMP: 'es-em-pe',
    SMA: 'es-em-a',
    SMK: 'es-em-ka',
    SLB: 'es-el-be',
    PAUD: 'pa-ud',
    ASN: 'a-es-en',
    PNS: 'pe-en-es',
    PPPK: 'pe-pe-pe-ka',
    GTK: 'ge-te-ka',
    ATK: 'a-te-ka',
    APBN: 'a-pe-be-en',
    APBD: 'a-pe-be-de',
    DAK: 'de-a-ka',
    NPWP: 'en-pe-we-pe',
    RKUN: 'er-ka-u-en',
    WA: 'we-a',
    AI: 'a-i',
    OCR: 'o-ce-er',
    PDF: 'pe-de-ef',
    DARADIK: 'da-ra-dik',
  };

  const NAMA_BULAN = [
    '',
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const SATUAN = [
    '',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
    'sebelas',
  ];

  function angkaKeKata(n) {
    const num = Number(n);
    if (Number.isNaN(num)) return String(n);
    if (num === 0) return 'nol';
    if (num < 0) return 'minus ' + angkaKeKata(Math.abs(num));

    const b = Math.floor(num);
    if (b < 12) return SATUAN[b];
    if (b < 20) return angkaKeKata(b - 10) + ' belas';
    if (b < 100) {
      const p = Math.floor(b / 10);
      const s = b % 10;
      return angkaKeKata(p) + ' puluh' + (s > 0 ? ' ' + angkaKeKata(s) : '');
    }
    if (b < 200) {
      const s = b - 100;
      return 'seratus' + (s > 0 ? ' ' + angkaKeKata(s) : '');
    }
    if (b < 1000) {
      const r = Math.floor(b / 100);
      const s = b % 100;
      return angkaKeKata(r) + ' ratus' + (s > 0 ? ' ' + angkaKeKata(s) : '');
    }
    if (b < 2000) {
      const s = b - 1000;
      return 'seribu' + (s > 0 ? ' ' + angkaKeKata(s) : '');
    }
    if (b < 1_000_000) {
      const rb = Math.floor(b / 1000);
      const s = b % 1000;
      return angkaKeKata(rb) + ' ribu' + (s > 0 ? ' ' + angkaKeKata(s) : '');
    }
    if (b < 1_000_000_000) {
      const jt = Math.floor(b / 1_000_000);
      const s = b % 1_000_000;
      return angkaKeKata(jt) + ' juta' + (s > 0 ? ' ' + angkaKeKata(s) : '');
    }
    if (b < 1_000_000_000_000) {
      const ml = Math.floor(b / 1_000_000_000);
      const s = b % 1_000_000_000;
      return angkaKeKata(ml) + ' miliar' + (s > 0 ? ' ' + angkaKeKata(s) : '');
    }
    return String(b);
  }

  function normalizeTextForSpeech(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    let text = rawText;

    text = text.replace(/https?:\/\/\S+/gi, 'tautan situs');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/[*_~`#>|•●▪►]/g, ' ');
    text = text.replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu,
      ' '
    );
    text = text.replace(/s\.d\.|s\/d/gi, 'sampai dengan');
    text = text.replace(/≥/g, 'minimal ');
    text = text.replace(/≤/g, 'maksimal ');
    text = text.replace(/\b(\d+)\s*[-–]\s*(\d+)\b/g, '$1 sampai $2');

    text = text.replace(
      /Rp\.?\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?\b/gi,
      function (_, digits) {
        const val = parseInt(digits.replace(/\./g, ''), 10);
        return Number.isNaN(val)
          ? digits + ' rupiah'
          : angkaKeKata(val) + ' rupiah';
      }
    );

    text = text.replace(
      /\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](20\d{2})\b/g,
      function (_, d, m, y) {
        return (
          angkaKeKata(parseInt(d, 10)) +
          ' ' +
          (NAMA_BULAN[parseInt(m, 10)] || m) +
          ' ' +
          angkaKeKata(parseInt(y, 10))
        );
      }
    );

    text = text.replace(
      /\b(\d+)(?:[,.](\d+))?\s*%/g,
      function (_, intPart, decPart) {
        const utama = angkaKeKata(parseInt(intPart, 10));
        if (!decPart) return utama + ' persen';
        const des = decPart
          .split('')
          .map(function (c) {
            return angkaKeKata(parseInt(c, 10));
          })
          .join(' ');
        return utama + ' koma ' + des + ' persen';
      }
    );

    text = text.replace(/\b\d{1,3}(?:\.\d{3})+\b/g, function (m) {
      const val = parseInt(m.replace(/\./g, ''), 10);
      return Number.isNaN(val) ? m : angkaKeKata(val);
    });

    text = text.replace(/\b\d+\b/g, function (m) {
      if (m.length >= 8) {
        return m
          .split('')
          .map(function (d) {
            return angkaKeKata(parseInt(d, 10));
          })
          .join(' ');
      }
      const val = parseInt(m, 10);
      return Number.isNaN(val) ? m : angkaKeKata(val);
    });

    Object.keys(KAMUS_PELAFALAN).forEach(function (key) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rgx = new RegExp('\\b' + escaped + '\\b', 'g');
      text = text.replace(rgx, KAMUS_PELAFALAN[key]);
    });

    text = text.replace(/\bBapak\/Ibu\b/gi, 'Bapak Ibu');
    text = text.replace(/\s*\/\s*/g, ' atau ');
    return text.replace(/\s+/g, ' ').trim();
  }

  function splitSentences(text) {
    if (!text) return [];
    const cleaned = text.replace(/\s+/g, ' ').trim();
    const parts = cleaned
      .split(/(?<=[.!?])\s+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    return parts.length ? parts : [cleaned];
  }

  /**
   * Penjawab lokal di sisi client jika server lambat/offline,
   * memastikan pengguna selalu mendapat balasan akurat + emosi mata yang tepat.
   */
  function getClientFallbackReply(userMessage, history) {
    const q = (userMessage || '').toLowerCase().trim();
    const rawQ = (userMessage || '').trim();
    const lastBotText =
      Array.isArray(history) && history.length > 0
        ? (history[history.length - 1].text || '').toLowerCase()
        : '';

    // 0. Pertanyaan sangat pendek / tidak jelas / typo / gibberish (contoh: "asdfghjk", "??", "gaje", "hah?")
    const vowelsCount = (rawQ.match(/[aiueo]/gi) || []).length;
    const lettersCount = (rawQ.match(/[a-z]/gi) || []).length;
    const cleanWord = q.replace(/[?!.,;]/g, '').trim();

    const isGibberish =
      (lettersCount >= 5 && vowelsCount / lettersCount < 0.22) ||
      /^(.)\1{3,}$/i.test(rawQ) ||
      /^([a-z]{1,3})\1{3,}$/i.test(rawQ) ||
      /^(asdf|qwerty|zxcv|ghjk|hjkl)/i.test(rawQ);

    const isTooVague =
      /^(apa|hah|heh|gimana|kenapa|terus|lalu|gaje|apalah|lah|loh|waduh)$/i.test(cleanWord) ||
      /^[?!.,;\s]+$/.test(rawQ) ||
      cleanWord.length <= 1;

    if (isGibberish || isTooVague) {
      return {
        teks: 'Wah, ketikanmu unik sekali nih! Maksudnya gimana ya? Coba tuliskan lagi sedikit lebih santai, aku siap bantu jawab apa saja pertanyaanmu kok.',
        emosi: 'bingung',
      };
    }

    // 1. Pertanyaan makanan / resep / santai
    if (q.includes('resep') || q.includes('masak') || q.includes('makan') || q.includes('mie')) {
      return {
        teks: 'Wah, ngomongin makanan enak memang selalu bikin lapar! Untuk mie yang nikmat, tambahkan sedikit bawang goreng, sayur sawi, dan telur setengah matang ya. Nah, kalau kamu ada pertanyaan seputar sekolah atau BOSP, tanyakan saja padaku!',
        emosi: 'senang',
      };
    }

    // 2. Pertanyaan matematika sederhana
    if (q.includes('1 + 1') || q.includes('1+1') || q.includes('berapa 1 + 1')) {
      return {
        teks: 'Satu ditambah satu tentu saja sama dengan dua! Nah, kalau kamu mau tahu berapa besaran dana bantuan sekolah per siswa di wilayahmu, aku juga siap bantu jelaskan.',
        emosi: 'senang',
      };
    }

    if (
      /^(ya|iya|boleh|mau|oke|ok|lanjut|jelaskan|apa saja|gimana|bagaimana)\b/i.test(
        q
      ) &&
      q.split(/\s+/).length <= 3
    ) {
      if (lastBotText.includes('boleh dipakai untuk apa')) {
        return {
          teks: 'Dana BOSP dipakai untuk pendaftaran siswa baru gratis, buku pelajaran, kegiatan belajar dan ekskul, ujian sekolah, tagihan listrik serta internet, hingga perbaikan ringan kelas dan toilet. Selain itu, dana ini juga membantu membayar honor guru non-ASN sesuai batas aturan. Mau tahu apa saja yang dilarang dibiayai BOSP?',
          emosi: 'semangat',
        };
      }
      if (lastBotText.includes('dilarang dibiayai')) {
        return {
          teks: 'Dana BOSP dilarang dipakai untuk membangun gedung baru, membeli seragam atau sepatu pribadi siswa, serta membiayai wisata atau study tour. Dana ini juga tidak boleh dipinjamkan atau disimpan untuk mencari bunga. Mau aku pandu cara cek anggaran sekolahmu di web ini?',
          emosi: 'berpikir',
        };
      }
      if (
        lastBotText.includes('status pencairan') ||
        lastBotText.includes('cek anggaran')
      ) {
        return {
          teks: 'Pertama, ketik nama sekolah atau nomor NPSN di kotak pencarian halaman utama lalu pilih sekolahnya. Lalu, kamu akan melihat total dana BOSP, status pencairan tahap satu dan dua, serta rincian pembelian barangnya. Terakhir, kamu juga bisa mengunduh laporan PDF atau mengecek foto bukti kuitansinya.',
          emosi: 'semangat',
        };
      }
    }

    // Humor dan obrolan santai
    if (
      q.includes('lucu') ||
      q.includes('lelucon') ||
      q.includes('pantun') ||
      q.includes('lawak') ||
      q.includes('bercanda')
    ) {
      return {
        teks: 'Kenapa buku matematika selalu kelihatan sedih? Karena dia punya terlalu banyak masalah! Nah, kalau kamu ada pertanyaan seputar sekolah atau dana pendidikan, tenang saja, aku siap bantu tanpa bikin pusing.',
        emosi: 'senang',
      };
    }

    if (
      q.includes('terima kasih') ||
      q.includes('makasih') ||
      q.includes('mantap') ||
      q.includes('keren') ||
      q.includes('bagus') ||
      q.includes('hebat') ||
      q.includes('pintar')
    ) {
      return {
        teks: 'Terima kasih banyak atas apresiasinya! Senang sekali bisa ngobrol dan menemani kamu. Ada pertanyaan atau hal seru lain yang mau kita bahas sekarang?',
        emosi: 'senang',
      };
    }

    if (
      q.includes('siapa kamu') ||
      q.includes('kamu siapa') ||
      q.includes('bisa bantu apa') ||
      q.includes('bisa apa') ||
      q.includes('namamu')
    ) {
      return {
        teks: 'Aku Tanya BOS di aplikasi DARADIK. Aku siap menjawab apa saja yang mau kamu tanyakan seputar transparansi dana BOSP, cara penggunaan website, hingga konsultasi aturan pendidikan. Mau tanya apa hari ini?',
        emosi: 'senang',
      };
    }

    if (
      q.includes('apa itu bosp') ||
      q.includes('apa itu bos') ||
      q.includes('pengertian bosp') ||
      q.includes('arti bosp') ||
      q === 'bosp' ||
      q === 'dana bosp' ||
      q.includes('jelaskan bosp')
    ) {
      return {
        teks: 'Dana BOSP adalah Bantuan Operasional Satuan Pendidikan dari pemerintah pusat untuk membiayai kebutuhan operasional sekolah sehari-hari seperti buku, listrik, internet, dan perawatan kelas. Tujuannya agar kegiatan belajar berjalan lancar dan sekolah negeri tidak memungut biaya operasional dari siswa. Kamu mau tahu BOSP boleh dipakai untuk apa saja?',
        emosi: 'senang',
      };
    }

    if (
      q.includes('ppdb') ||
      q.includes('spmb') ||
      q.includes('pendaftaran') ||
      q.includes('daftar ulang') ||
      q.includes('siswa baru')
    ) {
      return {
        teks: 'Biaya penerimaan siswa baru atau PPDB dan SPMB seperti formulir, pendataan, dan kepanitiaan sudah ditanggung penuh oleh dana BOSP. Karena itu, sekolah negeri dilarang memungut biaya pendaftaran atau daftar ulang dari orang tua siswa. Kalau ada tarikan biaya pendaftaran, kamu bisa melaporkannya lewat menu Lapor Anonim.',
        emosi: 'empati',
      };
    }

    if (
      q.includes('ujian') ||
      q.includes('ulangan') ||
      q.includes('anbk') ||
      q.includes('rapor') ||
      q.includes('lks') ||
      q.includes('ukk')
    ) {
      return {
        teks: 'Biaya pelaksanaan ulangan, ujian sekolah, ANBK, fotokopi soal, hingga pencetakan rapor sudah ditanggung oleh dana BOSP. Khusus untuk SMK, biaya bahan praktik kejuruan dan Uji Kompetensi Keahlian atau UKK juga dibiayai dari BOSP. Jadi orang tua di sekolah negeri tidak perlu membayar pungutan ujian lagi ya.',
        emosi: 'senang',
      };
    }

    if (
      q.includes('boleh dipakai') ||
      q.includes('untuk apa') ||
      q.includes('komponen') ||
      q.includes('ditanggung') ||
      q.includes('gratis') ||
      q.includes('kegunaan')
    ) {
      return {
        teks: 'Dana BOSP dipakai untuk pendaftaran siswa baru gratis, pembelian buku pelajaran, kegiatan belajar dan ekskul, pelaksanaan ujian, langganan listrik serta internet, hingga perawatan ringan kelas dan toilet. Selain itu, dana ini juga digunakan untuk membayar honor guru non-ASN sesuai batas aturan. Mau tahu apa saja yang dilarang dibiayai BOSP?',
        emosi: 'semangat',
      };
    }

    if (
      q.includes('larangan') ||
      q.includes('tidak boleh') ||
      q.includes('dilarang') ||
      q.includes('seragam') ||
      q.includes('study tour') ||
      q.includes('wisata') ||
      q.includes('wisuda') ||
      q.includes('perpisahan') ||
      q.includes('bangun gedung')
    ) {
      return {
        teks: 'Dana BOSP dilarang dipakai untuk membangun gedung baru, membeli seragam atau sepatu pribadi siswa, serta membiayai wisata atau study tour. Kegiatan study tour atau perpisahan juga tidak boleh dipaksakan kepada orang tua siswa. Jika ada pengumuman iuran di grup WhatsApp, kamu bisa memeriksanya lewat fitur Cek Iuran WA.',
        emosi: 'berpikir',
      };
    }

    if (
      q.includes('kapan') ||
      q.includes('cair') ||
      q.includes('tahap') ||
      q.includes('jadwal') ||
      q.includes('penyaluran')
    ) {
      return {
        teks: 'Dana BOSP disalurkan langsung ke rekening sekolah dalam dua tahap setiap tahun, masing-masing sebesar lima puluh persen. Tahap satu cair untuk periode Januari sampai Juni, sedangkan tahap dua cair untuk Juli sampai Desember setelah minimal separuh dana tahap satu terealisasi. Mau cek status pencairan sekolahmu sekarang?',
        emosi: 'netral',
      };
    }

    if (
      q.includes('besaran bosp') ||
      q.includes('nominal bosp') ||
      q.includes('per siswa') ||
      q.includes('alokasi bosp') ||
      (q.includes('berapa') && (q.includes('bosp') || q.includes('dana') || q.includes('biaya') || q.includes('uang') || q.includes('didapat') || q.includes('terima')))
    ) {
      return {
        teks: 'Besaran dana BOSP tahun dua ribu dua puluh enam dihitung per siswa setiap tahun dan menyesuaikan indeks kemahalan wilayah serta jenjang sekolah. Sebagai contoh, untuk SMK di Kabupaten Bogor besarnya satu juta enam ratus delapan puluh ribu rupiah per siswa. Kamu bisa ketik nama sekolah di beranda untuk melihat angka pastinya.',
        emosi: 'berpikir',
      };
    }

    if (
      q.includes('persen') ||
      q.includes('honor') ||
      q.includes('buku') ||
      q.includes('perpustakaan') ||
      q.includes('sarpras') ||
      q.includes('rkas') ||
      q.includes('siplah')
    ) {
      return {
        teks: 'Dalam rencana belanja tahunan sekolah atau RKAS, pembelian buku perpustakaan wajib minimal sepuluh persen dan perawatan ringan sarana sekolah maksimal dua puluh persen. Untuk honor guru non-ASN, batasnya maksimal dua puluh persen di sekolah negeri dan empat puluh persen di sekolah swasta, serta seluruh belanja barang tercatat lewat toko resmi SIPLah.',
        emosi: 'berpikir',
      };
    }

    if (
      /\bwa\b/i.test(q) ||
      q.includes('whatsapp') ||
      q.includes('scan') ||
      q.includes('cek iuran') ||
      q.includes('grup kelas')
    ) {
      return {
        teks: 'Untuk memeriksa pengumuman tarikan biaya dari grup kelas, pertama buka menu Cek Iuran WA di bagian atas website. Lalu, unggah gambar tangkapan layar chat WhatsApp atau tempelkan teks pengumuman iuran tersebut. Terakhir, klik tombol analisis agar sistem langsung memberitahu apakah iuran itu melanggar aturan BOSP atau tidak.',
        emosi: 'semangat',
      };
    }

    if (
      q.includes('cara pakai') ||
      q.includes('cara menggunakan') ||
      q.includes('panduan') ||
      q.includes('menggunakan') ||
      q.includes('fitur') ||
      q.includes('cara kerja') ||
      q.includes('aplikasi ini') ||
      q.includes('web ini') ||
      q.includes('cari sekolah') ||
      q.includes('npsn')
    ) {
      return {
        teks: 'Pertama, ketik nama sekolah atau nomor NPSN di halaman utama untuk melihat total dana BOSP, grafik anggaran, dan foto bukti belanjanya. Lalu, gunakan menu Cek Iuran WA jika ingin memeriksa pengumuman tarikan biaya dari grup orang tua. Terakhir, gunakan menu Lapor Anonim jika menemukan pungutan yang melanggar aturan.',
        emosi: 'semangat',
      };
    }

    if (
      q.includes('lapor') ||
      q.includes('pungli') ||
      q.includes('pungutan') ||
      q.includes('iuran') ||
      q.includes('sumbangan') ||
      q.includes('komite') ||
      q.includes('anonim') ||
      q.includes('tiket')
    ) {
      return {
        teks: 'Tenang, pelaporan di website ini seratus persen anonim tanpa perlu mengisi nama, email, atau nomor telepon pribadi kamu. Pertama, buka menu Lapor Anonim, lalu pilih sekolah, tulis kronologi singkat, dan lampirkan bukti fotonya. Terakhir, kirim laporan dan simpan kode tiketnya untuk memantau perkembangan investigasi di menu Pantau Tiket.',
        emosi: 'empati',
      };
    }

    if (
      /^(halo|hai|hi|tes|test|ping|selamat|pagi|siang|sore|malam|assalamualaikum|permisi|p)\b/i.test(
        q
      )
    ) {
      return {
        teks: 'Halo! Senang bisa mengobrol dengan kamu hari ini. Aku siap bantu jelaskan aturan dana BOSP, cara pakai website ini, atau menjawab apa pun pertanyaanmu. Kamu mau bahas apa dulu nih?',
        emosi: 'senang',
      };
    }

    return {
      teks: 'Pertanyaan yang menarik! Aku bisa bantu jelaskan berbagai hal seputar dunia sekolah, aturan dana BOSP, maupun penggunaan aplikasi ini. Boleh ceritakan sedikit lebih detail apa yang ingin kamu ketahui?',
      emosi: 'senang',
    };
  }

  const VALID_EMOTIONS = new Set([
    'senang',
    'netral',
    'bingung',
    'semangat',
    'empati',
    'berpikir',
    'menyapa',
  ]);

  const state = {
    isOpen: false,
    hasGreeted: false,
    isMuted: localStorage.getItem(CONFIG.storageMuteKey) === 'true',
    isBusy: false,
    isSpeaking: false,
    isThinking: false,
    currentEmotion: 'netral',
    lastReplyText: CONFIG.greetingText,
    conversationHistory: [],
    previousInteractionId: null,
    voiceEnergy: 0,
    targetLookX: 0,
    targetLookY: 0,
    currentLookX: 0,
    currentLookY: 0,
    lastPointerMoveAt: 0,
    idleLookX: 0,
    idleLookY: 0,
    nextIdleGlanceAt: 0,
    isInputFocused: false,
    prefersReducedMotion:
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  const clientAudioCache = new Map();
  let piperAvailable = true;
  let audioCtx = null;
  let analyserNode = null;
  let analyserData = null;
  let currentAudioEl = null;
  let speechSessionId = 0;
  let typingTimerId = null;

  function buildWidgetDom() {
    const root = document.createElement('div');
    root.className = 'bosp-widget-root';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Tanya BOS - Asisten Cerdas');

    root.innerHTML = [
      '<div id="bosp-chat-popup" class="bosp-popup" role="dialog" aria-modal="false" aria-labelledby="bosp-dialog-title" aria-hidden="true">',
      '  <header class="bosp-header">',
      '    <div class="bosp-header-brand">',
      '      <span class="bosp-header-dot" aria-hidden="true"></span>',
      '      <h2 id="bosp-dialog-title" class="bosp-header-title">' +
        CONFIG.botName +
        '</h2>',
      '    </div>',
      '    <div class="bosp-header-actions">',
      '      <button type="button" id="bosp-replay-btn" class="bosp-icon-btn" title="Ulangi suara balasan" aria-label="Ulangi suara balasan">',
      '        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>',
      '      </button>',
      '      <button type="button" id="bosp-mute-btn" class="bosp-icon-btn ' +
        (state.isMuted ? 'is-muted' : '') +
        '" title="' +
        (state.isMuted ? 'Nyalakan suara' : 'Bisukan suara') +
        '" aria-label="' +
        (state.isMuted ? 'Nyalakan suara' : 'Bisukan suara') +
        '" aria-pressed="' +
        state.isMuted +
        '">',
      '        <span id="bosp-mute-icon"></span>',
      '      </button>',
      '      <button type="button" id="bosp-close-btn" class="bosp-icon-btn" title="Tutup jendela chat" aria-label="Tutup jendela chat">',
      '        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      '      </button>',
      '    </div>',
      '  </header>',

      '  <!-- Panggung Maskot Bola Glossy 3D Bermata Kapsul Interaktif (Tanpa Mulut) -->',
      '  <div class="bosp-orb-stage" id="bosp-orb-stage" data-emotion="netral" title="Klik untuk menyapa Tanya BOS">',
      '    <span class="bosp-star bosp-star--1" aria-hidden="true"></span>',
      '    <span class="bosp-star bosp-star--2" aria-hidden="true"></span>',
      '    <span class="bosp-star bosp-star--3" aria-hidden="true"></span>',
      '    <span class="bosp-star bosp-star--4" aria-hidden="true"></span>',
      '    <span class="bosp-star bosp-star--5" aria-hidden="true"></span>',
      '    <div class="bosp-orb-rig" id="bosp-orb-rig" aria-hidden="true">',
      '      <div class="bosp-orb-aura" id="bosp-orb-aura"></div>',
      '      <div class="bosp-sw" id="bosp-sw" aria-hidden="true"></div>',
      '      <div class="bosp-orb-sphere" id="bosp-orb-sphere">',
      '        <div class="bosp-orb-shine" id="bosp-orb-shine"></div>',
      '        <div class="bosp-orb-eyes" id="bosp-orb-eyes">',
      '          <span class="bosp-orb-eye bosp-orb-eye--left" id="bosp-eye-left"></span>',
      '          <span class="bosp-orb-eye bosp-orb-eye--right" id="bosp-eye-right"></span>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',

      '  <!-- Area Balasan Tunggal -->',
      '  <div class="bosp-reply-wrapper" id="bosp-reply-scroll">',
      '    <div id="bosp-reply-card" class="bosp-reply-card" aria-live="polite" aria-atomic="true">',
      '      <p id="bosp-reply-text" class="bosp-reply-text"></p>',
      '    </div>',
      '  </div>',

      '  <!-- Input Teks + Mikrofon + Kirim -->',
      '  <form id="bosp-chat-form" class="bosp-input-bar" autocomplete="off">',
      '    <input id="bosp-chat-input" type="text" class="bosp-text-input" placeholder="Tanyakan soal BOSP atau cara pakai web..." maxlength="' +
        CONFIG.maxInputLength +
        '" aria-label="Ketik pertanyaan untuk Tanya BOS" />',
      '    <button type="button" id="bosp-mic-btn" class="bosp-mic-btn" title="Tanya dengan suara" aria-label="Tanya dengan suara">',
      '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>',
      '    </button>',
      '    <button type="submit" id="bosp-send-btn" class="bosp-send-btn" title="Kirim pertanyaan" aria-label="Kirim pertanyaan">',
      '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
      '    </button>',
      '  </form>',
      '</div>',

      '<!-- Tombol Peluncur Jelas & Mudah Dipahami -->',
      '<button type="button" id="bosp-chat-fab" data-tour-id="tour-tanya-bos" class="bosp-fab-btn" aria-label="Tanya BOS" aria-expanded="false" aria-controls="bosp-chat-popup">',
      '  <span class="bosp-fab-avatar" aria-hidden="true">',
      '    <span class="bosp-fab-eyes" id="bosp-fab-eyes">',
      '      <span class="bosp-fab-eye"></span>',
      '      <span class="bosp-fab-eye"></span>',
      '    </span>',
      '  </span>',
      '  <span class="bosp-fab-copy">',
      '    <span class="bosp-fab-title" id="bosp-fab-title">Tanya BOS</span>',
      '    <span class="bosp-fab-sub" id="bosp-fab-sub">Asisten Cerdas</span>',
      '  </span>',
      '</button>',
    ].join('\n');

    document.body.appendChild(root);
    return root;
  }

  function initController(root) {
    const popupEl = root.querySelector('#bosp-chat-popup');
    const fabBtn = root.querySelector('#bosp-chat-fab');
    const fabEyesEl = root.querySelector('#bosp-fab-eyes');
    const fabTitleEl = root.querySelector('#bosp-fab-title');
    const fabSubEl = root.querySelector('#bosp-fab-sub');
    const closeBtn = root.querySelector('#bosp-close-btn');
    const muteBtn = root.querySelector('#bosp-mute-btn');
    const muteIconEl = root.querySelector('#bosp-mute-icon');
    const replayBtn = root.querySelector('#bosp-replay-btn');

    const orbStage = root.querySelector('#bosp-orb-stage');
    const orbRig = root.querySelector('#bosp-orb-rig');
    const orbAura = root.querySelector('#bosp-orb-aura');
    const orbShine = root.querySelector('#bosp-orb-shine');
    const orbEyes = root.querySelector('#bosp-orb-eyes');

    const replyCard = root.querySelector('#bosp-reply-card');
    const replyTextEl = root.querySelector('#bosp-reply-text');
    const replyScroll = root.querySelector('#bosp-reply-scroll');
    const chatForm = root.querySelector('#bosp-chat-form');
    const chatInput = root.querySelector('#bosp-chat-input');
    const sendBtn = root.querySelector('#bosp-send-btn');
    const micBtn = root.querySelector('#bosp-mic-btn');

    let rafId = null;
    let blinkTimeoutId = null;
    let emotionResetTimerId = null;
    let startTime = performance.now();

    function setBotEmotion(emotion, autoResetMs) {
      const normalized = VALID_EMOTIONS.has(emotion) ? emotion : 'netral';
      state.currentEmotion = normalized;
      orbStage.setAttribute('data-emotion', normalized);

      if (emotionResetTimerId) {
        clearTimeout(emotionResetTimerId);
        emotionResetTimerId = null;
      }

      if (autoResetMs && normalized !== 'netral') {
        emotionResetTimerId = setTimeout(function () {
          if (!state.isThinking && !state.isSpeaking) {
            state.currentEmotion = 'netral';
            orbStage.setAttribute('data-emotion', 'netral');
          }
        }, autoResetMs);
      }
    }

    function renderMuteIcon() {
      if (state.isMuted) {
        muteIconEl.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
        muteBtn.classList.add('is-muted');
        muteBtn.setAttribute('aria-pressed', 'true');
        muteBtn.setAttribute('title', 'Nyalakan suara');
      } else {
        muteIconEl.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
        muteBtn.classList.remove('is-muted');
        muteBtn.setAttribute('aria-pressed', 'false');
        muteBtn.setAttribute('title', 'Bisukan suara');
      }
    }
    renderMuteIcon();

    // ========================================================================
    // KEDIPAN MATA NATURAL ACAK TIAP 2.2 - 4.8 DETIK
    // ========================================================================
    function triggerBlink(doubleBlink) {
      if (!state.isOpen || state.prefersReducedMotion) return;
      orbEyes.classList.add('is-blinking');
      setTimeout(function () {
        orbEyes.classList.remove('is-blinking');
        if (doubleBlink) {
          setTimeout(function () {
            orbEyes.classList.add('is-blinking');
            setTimeout(function () {
              orbEyes.classList.remove('is-blinking');
            }, 115);
          }, 120);
        }
      }, 125);
    }

    function scheduleNextBlink() {
      if (blinkTimeoutId) clearTimeout(blinkTimeoutId);
      if (!state.isOpen) return;
      const delay = 2200 + Math.random() * 2600;
      blinkTimeoutId = setTimeout(function () {
        triggerBlink(Math.random() < 0.22);
        scheduleNextBlink();
      }, delay);
    }

    // ========================================================================
    // PELACAKAN KURSOR & POSISI INPUT (MATA INTERAKTIF)
    // ========================================================================
    function handlePointerMove(clientX, clientY) {
      // Gerakkan sedikit mata pada tombol FAB saat popup tertutup
      if (!state.isOpen && fabEyesEl) {
        const fabRect = fabBtn.getBoundingClientRect();
        const fcx = fabRect.left + fabRect.width * 0.3;
        const fcy = fabRect.top + fabRect.height * 0.5;
        const fdx = Math.max(-1, Math.min(1, (clientX - fcx) / 180));
        const fdy = Math.max(-1, Math.min(1, (clientY - fcy) / 180));
        fabEyesEl.style.transform =
          'translate(' +
          (fdx * 2.5).toFixed(1) +
          'px, ' +
          (fdy * 2).toFixed(1) +
          'px)';
        return;
      }

      if (!state.isOpen) return;
      const rect = orbStage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (clientX - cx) / 220;
      const dy = (clientY - cy) / 220;
      const clampedX = Math.max(-1, Math.min(1, dx));
      const clampedY = Math.max(-1, Math.min(1, dy));

      state.targetLookX = clampedX * 13;
      state.targetLookY = clampedY * 9;
      state.lastPointerMoveAt = performance.now();
    }

    window.addEventListener(
      'mousemove',
      function (e) {
        handlePointerMove(e.clientX, e.clientY);
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      function (e) {
        if (e.touches && e.touches[0]) {
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );

    chatInput.addEventListener('focus', function () {
      state.isInputFocused = true;
      state.targetLookY = 7.5;
    });

    chatInput.addEventListener('blur', function () {
      state.isInputFocused = false;
    });

    chatInput.addEventListener('input', function () {
      const len = chatInput.value.length;
      const progress = Math.min(1, len / 32);
      state.targetLookX = -6 + progress * 12;
      state.targetLookY = 7.5;
      state.lastPointerMoveAt = performance.now();
    });

    // Interaksi langsung saat pengguna mengklik maskot Orb
    orbStage.addEventListener('click', function () {
      if (state.isThinking) return;
      triggerBlink(false);
      setBotEmotion('senang', 2200);
    });

    // ========================================================================
    // SAMPLING ENERGI SUARA & LOOP ANIMASI 60FPS
    // ========================================================================
    function sampleAudioEnergy(now) {
      if (!state.isSpeaking) {
        state.voiceEnergy = 0;
        return;
      }

      if (analyserNode && analyserData && currentAudioEl && !currentAudioEl.paused) {
        analyserNode.getByteTimeDomainData(analyserData);
        let sumSq = 0;
        for (let i = 0; i < analyserData.length; i++) {
          const norm = (analyserData[i] - 128) / 128;
          sumSq += norm * norm;
        }
        const rms = Math.sqrt(sumSq / analyserData.length);
        state.voiceEnergy = Math.min(1, rms * 4.2);
      } else {
        const t = now * 0.001;
        const wave =
          Math.abs(Math.sin(t * 14.5)) * (0.55 + 0.45 * Math.sin(t * 5.2));
        state.voiceEnergy = Math.min(1, Math.max(0.12, wave));
      }
    }

    function animationLoop(now) {
      if (!state.isOpen) {
        rafId = null;
        return;
      }

      const elapsed = (now - startTime) * 0.001;
      sampleAudioEnergy(now);
      orbStage.classList.toggle('is-speaking', state.isSpeaking);

      if (!state.prefersReducedMotion) {
        // Tentukan target arah pandangan mata (Look X / Look Y)
        let desiredLookX = state.targetLookX;
        let desiredLookY = state.targetLookY;

        if (state.isThinking) {
          // Saat berpikir, mata melirik ke atas dan memindai pelan
          desiredLookX = Math.sin(elapsed * 2.8) * 8;
          desiredLookY = -6.5 + Math.cos(elapsed * 1.9) * 1.5;
        } else if (
          !state.isInputFocused &&
          now - state.lastPointerMoveAt > 3200
        ) {
          // Saat idle tanpa gerakan kursor, sesekali melirik halus
          if (now > state.nextIdleGlanceAt) {
            state.idleLookX = (Math.random() - 0.5) * 14;
            state.idleLookY = (Math.random() - 0.5) * 8;
            state.nextIdleGlanceAt = now + 2400 + Math.random() * 2600;
          }
          desiredLookX = state.idleLookX;
          desiredLookY = state.idleLookY;
        }

        // Interpolasi pegas halus (lerp) untuk posisi mata
        state.currentLookX += (desiredLookX - state.currentLookX) * 0.14;
        state.currentLookY += (desiredLookY - state.currentLookY) * 0.14;

        // Denyut elastis mata mengikuti irama bicara (karena tanpa mulut)
        const eyeVoiceScaleY = state.isSpeaking
          ? 1 + state.voiceEnergy * 0.18
          : 1;
        const eyeVoiceScaleX = state.isSpeaking
          ? 1 + state.voiceEnergy * 0.05
          : 1;

        orbEyes.style.transform =
          'translate3d(' +
          state.currentLookX.toFixed(2) +
          'px, ' +
          state.currentLookY.toFixed(2) +
          'px, 0) scale(' +
          eyeVoiceScaleX.toFixed(3) +
          ', ' +
          eyeVoiceScaleY.toFixed(3) +
          ')';

        // Efek paralaks halus pada kilau kaca bola
        orbShine.style.transform =
          'translate3d(' +
          (state.currentLookX * -0.28).toFixed(2) +
          'px, ' +
          (state.currentLookY * -0.28).toFixed(2) +
          'px, 0)';

        // Gerak tubuh bola (napas idle, lompatan emosi, miring bingung/berpikir, ritme bicara)
        let floatY = Math.sin(elapsed * 2.3) * 3.5;
        let tiltDeg = state.currentLookX * 0.35;
        let scaleX = 1;
        let scaleY = 1;

        const emo = state.currentEmotion;
        if (state.isSpeaking) {
          floatY -= state.voiceEnergy * 5.5;
          scaleX = 1 + state.voiceEnergy * 0.05;
          scaleY = 1 + state.voiceEnergy * 0.07;
        } else if (emo === 'senang' || emo === 'menyapa' || emo === 'semangat') {
          floatY = -Math.abs(Math.sin(elapsed * 5.2)) * 5.5;
        } else if (emo === 'berpikir') {
          tiltDeg = -6 + Math.sin(elapsed * 2.5) * 3;
        } else if (emo === 'bingung') {
          tiltDeg = 9 + Math.sin(elapsed * 3) * 2.5;
        } else if (emo === 'empati') {
          floatY = 3 + Math.sin(elapsed * 1.8) * 2;
        }

        orbRig.style.transform =
          'translate3d(0, ' +
          floatY.toFixed(2) +
          'px, 0) rotate(' +
          tiltDeg.toFixed(2) +
          'deg) scale(' +
          scaleX.toFixed(3) +
          ', ' +
          scaleY.toFixed(3) +
          ')';

        // Denyut aura belakang bola
        const auraScale = state.isSpeaking
          ? 1.04 + state.voiceEnergy * 0.18
          : 1 + Math.sin(elapsed * 2.2) * 0.04;
        orbAura.style.transform =
          'scale(' + auraScale.toFixed(3) + ') rotate(' + (elapsed * 18).toFixed(1) + 'deg)';
      }

      if (swPaths.length) {
        const swT = performance.now() / 1000;
        const active = state.isSpeaking;
        swRing.style.opacity = active ? '1' : '0';
        if (active || swWasActive) {
          const isMobile = window.innerWidth <= 480;
          const baseRadius = isMobile ? 48 : 54;
          const e = active ? Math.min(1, state.voiceEnergy * 1.65 + 0.32) : 0;

          for (let l = 0; l < swPaths.length; l++) {
            const r0 = baseRadius + (2 - l) * 3.2 + e * (3.5 - l * 0.7);
            const amp = (2.2 + e * 6.8) * (1 - l * 0.14);
            const dir = l % 2 === 0 ? 1 : -1;
            const speed = (2.4 + l * 0.65) * dir;
            const k1 = 3 + l;
            const k2 = 5 + l * 2;
            let d = '';

            for (let i = 0; i <= SW_POINTS; i++) {
              const th = (i / SW_POINTS) * Math.PI * 2;
              const wave =
                Math.sin(th * k1 + swT * speed) * 0.62 +
                Math.sin(th * k2 - swT * speed * 1.35 + l * 1.4) * 0.38;
              const r = r0 + amp * wave;
              const x = (Math.cos(th) * r).toFixed(1);
              const y = (Math.sin(th) * r).toFixed(1);
              d += (i === 0 ? 'M' : 'L') + x + ' ' + y;
            }
            swPaths[l].setAttribute('d', d + 'Z');
          }
        }
        swWasActive = active;
      }

      rafId = requestAnimationFrame(animationLoop);
    }

    const swRing = document.getElementById('bosp-sw');
    const swPaths = [];
    const SW_POINTS = 96;
    let swWasActive = false;
    if (swRing) {
      const NS = 'http://www.w3.org/2000/svg';
      swRing.innerHTML =
        '<svg viewBox="-90 -90 180 180" width="180" height="180" overflow="visible">' +
        '<defs>' +
        '<linearGradient id="bosp-water-g1" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#E0F2FE" stop-opacity="0.78"/>' +
        '<stop offset="50%" stop-color="#7DD3FC" stop-opacity="0.58"/>' +
        '<stop offset="100%" stop-color="#38BDF8" stop-opacity="0.72"/>' +
        '</linearGradient>' +
        '<linearGradient id="bosp-water-g2" x1="100%" y1="0%" x2="0%" y2="100%">' +
        '<stop offset="0%" stop-color="#F0F9FF" stop-opacity="0.85"/>' +
        '<stop offset="48%" stop-color="#BAE6FD" stop-opacity="0.65"/>' +
        '<stop offset="100%" stop-color="#60A5FA" stop-opacity="0.75"/>' +
        '</linearGradient>' +
        '<linearGradient id="bosp-water-g3" x1="0%" y1="100%" x2="100%" y2="0%">' +
        '<stop offset="0%" stop-color="#A5F3FC" stop-opacity="0.88"/>' +
        '<stop offset="52%" stop-color="#E0F2FE" stop-opacity="0.92"/>' +
        '<stop offset="100%" stop-color="#7DD3FC" stop-opacity="0.82"/>' +
        '</linearGradient>' +
        '</defs>' +
        '</svg>';
      const svg = swRing.firstChild;
      const layerConfigs = [
        { fill: 'url(#bosp-water-g1)', fillOp: '0.36', stroke: 'url(#bosp-water-g2)', strokeW: '1.5', strokeOp: '0.72' },
        { fill: 'url(#bosp-water-g2)', fillOp: '0.46', stroke: 'url(#bosp-water-g3)', strokeW: '1.9', strokeOp: '0.88' },
        { fill: 'url(#bosp-water-g3)', fillOp: '0.55', stroke: '#E0F2FE', strokeW: '2.1', strokeOp: '0.95' },
      ];
      for (let l = 0; l < layerConfigs.length; l++) {
        const cfg = layerConfigs[l];
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('fill', cfg.fill);
        p.setAttribute('fill-opacity', cfg.fillOp);
        p.setAttribute('stroke', cfg.stroke);
        p.setAttribute('stroke-width', cfg.strokeW);
        p.setAttribute('stroke-opacity', cfg.strokeOp);
        p.setAttribute('stroke-linejoin', 'round');
        p.setAttribute('stroke-linecap', 'round');
        svg.appendChild(p);
        swPaths.push(p);
      }
    }

    function startAnimation() {
      if (!rafId && state.isOpen) {
        startTime = performance.now();
        scheduleNextBlink();
        rafId = requestAnimationFrame(animationLoop);
      }
    }

    function stopAnimation() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (blinkTimeoutId) {
        clearTimeout(blinkTimeoutId);
        blinkTimeoutId = null;
      }
    }

    // ========================================================================
    // WEB AUDIO API & TTS QUEUE
    // ========================================================================
    function ensureAudioContext() {
      try {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioCtx) {
          audioCtx = new AudioContextClass();
          analyserNode = audioCtx.createAnalyser();
          analyserNode.fftSize = 256;
          analyserNode.smoothingTimeConstant = 0.65;
          analyserData = new Uint8Array(analyserNode.frequencyBinCount);
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(function () {});
        }
      } catch {}
    }

    function stopCurrentSpeech() {
      speechSessionId += 1;
      state.isSpeaking = false;
      state.voiceEnergy = 0;

      if (currentAudioEl) {
        try {
          currentAudioEl.pause();
          currentAudioEl.src = '';
        } catch {}
        currentAudioEl = null;
      }

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    }

    async function fetchPiperSentenceWav(sentence) {
      const normalized = normalizeTextForSpeech(sentence);
      if (!normalized) return null;

      if (!piperAvailable) {
        return { blobUrl: null, normalizedText: normalized };
      }

      if (clientAudioCache.has(normalized)) {
        return {
          blobUrl: clientAudioCache.get(normalized),
          normalizedText: normalized,
        };
      }

      try {
        const controller = new AbortController();
        const tId = setTimeout(function () {
          controller.abort();
        }, 1500);

        const res = await fetch(CONFIG.apiBaseUrl + '/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sentence }),
          signal: controller.signal,
        });
        clearTimeout(tId);

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('audio/wav')) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          if (clientAudioCache.size >= 40) {
            const firstKey = clientAudioCache.keys().next().value;
            const oldUrl = clientAudioCache.get(firstKey);
            if (oldUrl) URL.revokeObjectURL(oldUrl);
            clientAudioCache.delete(firstKey);
          }
          clientAudioCache.set(normalized, blobUrl);
          return { blobUrl: blobUrl, normalizedText: normalized };
        } else {
          // Jika Piper tidak terpasang di host server, tandai agar kalimat selanjutnya langsung Web Speech tanpa latency
          piperAvailable = false;
        }
      } catch {
        piperAvailable = false;
      }

      return { blobUrl: null, normalizedText: normalized };
    }

    function playWavBlobWithAnalyser(blobUrl, activeSession) {
      return new Promise(function (resolve) {
        if (activeSession !== speechSessionId || state.isMuted) {
          resolve();
          return;
        }

        ensureAudioContext();
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = blobUrl;
        currentAudioEl = audio;

        if (audioCtx && analyserNode) {
          try {
            const source = audioCtx.createMediaElementSource(audio);
            source.connect(analyserNode);
            analyserNode.connect(audioCtx.destination);
          } catch {}
        }

        audio.onplay = function () {
          state.isSpeaking = true;
        };

        audio.onended = function () {
          currentAudioEl = null;
          resolve();
        };

        audio.onerror = function () {
          currentAudioEl = null;
          resolve();
        };

        audio.play().catch(function () {
          currentAudioEl = null;
          resolve();
        });
      });
    }

    function playWebSpeechFallback(normalizedSentence, activeSession) {
      return new Promise(function (resolve) {
        if (
          activeSession !== speechSessionId ||
          state.isMuted ||
          !('speechSynthesis' in window)
        ) {
          resolve();
          return;
        }

        try {
          const utter = new SpeechSynthesisUtterance(normalizedSentence);

          // Pilih suara perempuan Indonesia yang paling cantik, alami, dan merdu
          const voices = window.speechSynthesis.getVoices() || [];
          const bestVoice =
            voices.find(function (v) { return /gadis.*natural/i.test(v.name); }) ||
            voices.find(function (v) { return /gadis/i.test(v.name); }) ||
            voices.find(function (v) { return /damayanti/i.test(v.name); }) ||
            voices.find(function (v) { return /google.*(bahasa.*)?indonesia/i.test(v.name); }) ||
            voices.find(function (v) { return /siti/i.test(v.name); }) ||
            voices.find(function (v) {
              return (
                v.lang &&
                v.lang.toLowerCase().startsWith('id') &&
                /female|wanita|perempuan/i.test(v.name)
              );
            }) ||
            voices.find(function (v) {
              return (
                v.lang &&
                (v.lang.toLowerCase().startsWith('id') ||
                  v.name.toLowerCase().includes('indonesia'))
              );
            });

          if (bestVoice) {
            utter.voice = bestVoice;
            utter.lang = bestVoice.lang || 'id-ID';
          } else {
            utter.lang = 'id-ID';
          }

          // Atur intonasi (pitch) dan tempo (rate) agar suara tenang, anggun, merdu, dan terdengar lancar cepat
          let emotionPitch = 1.02;
          let emotionRate = 1.12;

          switch (state.currentEmotion) {
            case 'senang':
            case 'semangat':
            case 'menyapa':
              emotionPitch = 1.03;
              emotionRate = 1.15;
              break;
            case 'empati':
              emotionPitch = 0.99;
              emotionRate = 1.08;
              break;
            case 'berpikir':
              emotionPitch = 1.01;
              emotionRate = 1.10;
              break;
            case 'bingung':
              emotionPitch = 1.03;
              emotionRate = 1.10;
              break;
            default:
              emotionPitch = 1.02;
              emotionRate = 1.12;
          }

          utter.pitch = emotionPitch;
          utter.rate = emotionRate;

          utter.onstart = function () {
            if (activeSession === speechSessionId) {
              state.isSpeaking = true;
            }
          };

          utter.onend = function () {
            resolve();
          };

          utter.onerror = function () {
            resolve();
          };

          window.speechSynthesis.speak(utter);
        } catch {
          resolve();
        }
      });
    }

    async function speakTextQueue(fullText) {
      stopCurrentSpeech();
      const mySession = speechSessionId;

      if (state.isMuted || !fullText) {
        state.isSpeaking = false;
        return;
      }

      const sentences = splitSentences(fullText);
      if (!sentences.length) return;

      const tasks = sentences.map(function (s) {
        return fetchPiperSentenceWav(s);
      });

      for (let i = 0; i < tasks.length; i++) {
        if (mySession !== speechSessionId || state.isMuted) break;
        const item = await tasks[i];
        if (!item || mySession !== speechSessionId || state.isMuted) break;

        if (item.blobUrl) {
          await playWavBlobWithAnalyser(item.blobUrl, mySession);
        } else if (item.normalizedText) {
          await playWebSpeechFallback(item.normalizedText, mySession);
        }
      }

      if (mySession === speechSessionId) {
        state.isSpeaking = false;
        state.voiceEnergy = 0;
      }
    }

    // ========================================================================
    // RENDER BALASAN TUNGGAL + EFEK MENGETIK SELARAS SUARA & EMOSI MATA
    // ========================================================================
    function renderReplyWithTypewriter(text, emotion, shouldSpeak) {
      if (typingTimerId) {
        clearInterval(typingTimerId);
        typingTimerId = null;
      }

      state.lastReplyText = text;
      setBotEmotion(emotion || 'netral', 7000);
      triggerBlink(false);
      replyCard.classList.add('is-fading-out');

      setTimeout(function () {
        replyTextEl.innerHTML = '';
        const textNode = document.createTextNode('');
        const cursorSpan = document.createElement('span');
        cursorSpan.className = 'bosp-typing-cursor';
        cursorSpan.setAttribute('aria-hidden', 'true');

        replyTextEl.appendChild(textNode);
        replyTextEl.appendChild(cursorSpan);
        replyCard.classList.remove('is-fading-out');

        if (shouldSpeak) {
          speakTextQueue(text);
        }

        if (state.prefersReducedMotion) {
          textNode.nodeValue = text;
          cursorSpan.remove();
          return;
        }

        let charIndex = 0;
        const totalChars = text.length;
        const stepMs = Math.max(
          8,
          Math.min(18, Math.round(1100 / Math.max(totalChars, 1)))
        );

        typingTimerId = setInterval(function () {
          charIndex += 1;
          textNode.nodeValue = text.slice(0, charIndex);
          replyScroll.scrollTop = replyScroll.scrollHeight;

          if (charIndex >= totalChars) {
            clearInterval(typingTimerId);
            typingTimerId = null;
            cursorSpan.remove();
          }
        }, stepMs);
      }, 170);
    }

    function setControlsDisabled(disabled) {
      state.isBusy = disabled;
      chatInput.disabled = disabled;
      sendBtn.disabled = disabled;
      micBtn.disabled = disabled;
    }

    async function submitUserQuestion(rawQuestion) {
      const question = (rawQuestion || '').trim().slice(0, CONFIG.maxInputLength);
      if (!question || state.isBusy) return;

      ensureAudioContext();
      stopCurrentSpeech();

      chatInput.value = '';
      setControlsDisabled(true);
      state.isThinking = true;
      setBotEmotion('berpikir', 0);
      replyCard.classList.add('is-fading-out');

      let botText = '';
      let botEmotion = 'netral';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(function () {
          controller.abort();
        }, 7000);

        const res = await fetch(CONFIG.apiBaseUrl + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: question,
            history: state.conversationHistory.slice(-6),
            previousInteractionId: state.previousInteractionId,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.teks) {
            botText = data.teks;
            botEmotion = data.emosi || 'netral';
          }
          if (data && data.interactionId) {
            state.previousInteractionId = data.interactionId;
          }
        }
      } catch {}

      // Fallback opsional langsung ke Gemini API jika server proxy tidak aktif / deployment statis
      if (!botText) {
        const directKey =
          (typeof window !== 'undefined' &&
            (window.__DARADIK_GEMINI_KEY__ ||
              localStorage.getItem('daradik_gemini_key'))) ||
          '';
        if (directKey) {
          try {
            const directController = new AbortController();
            const dTimeout = setTimeout(function () {
              directController.abort();
            }, 6000);
            const dRes = await fetch(
              'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=' +
                encodeURIComponent(directKey),
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text:
                            'Kamu adalah Tanya BOS di aplikasi DARADIK yang ramah. Jawab pertanyaan pengguna berikut ini secara santai, akurat, dan jelas dalam 2-3 kalimat bahasa Indonesia tanpa markdown/simbol/bintang: ' +
                            question,
                        },
                      ],
                    },
                  ],
                }),
                signal: directController.signal,
              }
            );
            clearTimeout(dTimeout);
            if (dRes.ok) {
              const dData = await dRes.json();
              const candidate = dData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidate && candidate.trim()) {
                botText = candidate.replace(/[*_~`#>|•●]/g, '').trim();
                botEmotion = 'senang';
              }
            }
          } catch {}
        }
      }

      // Jaminan 100%: jika server/jaringan lambat atau offline, gunakan penjawab lokal pintar secara instan tanpa pernah timeout
      if (!botText) {
        const fallback = getClientFallbackReply(
          question,
          state.conversationHistory
        );
        botText = fallback.teks;
        botEmotion = fallback.emosi;
      }

      state.conversationHistory.push({ role: 'user', text: question });
      state.conversationHistory.push({ role: 'bot', text: botText });
      if (state.conversationHistory.length > 8) {
        state.conversationHistory = state.conversationHistory.slice(-8);
      }

      state.isThinking = false;
      renderReplyWithTypewriter(botText, botEmotion, true);
      setControlsDisabled(false);

      if (state.isOpen && window.innerWidth > 640) {
        chatInput.focus();
      }
    }

    function openPopup() {
      state.isOpen = true;
      popupEl.classList.add('is-open');
      popupEl.setAttribute('aria-hidden', 'false');
      fabBtn.classList.add('is-hidden');
      fabBtn.setAttribute('aria-expanded', 'true');
      ensureAudioContext();
      startAnimation();

      if (!state.hasGreeted) {
        state.hasGreeted = true;
        renderReplyWithTypewriter(CONFIG.greetingText, 'menyapa', true);
      } else {
        setBotEmotion('senang', 2200);
        triggerBlink(true);
      }

      if (window.innerWidth > 640) {
        setTimeout(function () {
          chatInput.focus();
        }, 120);
      }
    }

    function closePopup() {
      state.isOpen = false;
      popupEl.classList.remove('is-open');
      popupEl.setAttribute('aria-hidden', 'true');
      fabBtn.classList.remove('is-hidden');
      fabBtn.setAttribute('aria-expanded', 'false');
      stopCurrentSpeech();
      stopAnimation();
    }

    fabBtn.addEventListener('click', function () {
      if (state.isOpen) {
        closePopup();
      } else {
        openPopup();
      }
    });

    closeBtn.addEventListener('click', closePopup);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.isOpen) {
        closePopup();
        fabBtn.focus();
      }
    });

    muteBtn.addEventListener('click', function () {
      state.isMuted = !state.isMuted;
      localStorage.setItem(CONFIG.storageMuteKey, String(state.isMuted));
      renderMuteIcon();
      if (state.isMuted) {
        stopCurrentSpeech();
      } else if (state.lastReplyText) {
        speakTextQueue(state.lastReplyText);
      }
    });

    replayBtn.addEventListener('click', function () {
      if (state.isMuted) {
        state.isMuted = false;
        localStorage.setItem(CONFIG.storageMuteKey, 'false');
        renderMuteIcon();
      }
      if (state.lastReplyText) {
        setBotEmotion('senang', 3000);
        speakTextQueue(state.lastReplyText);
      }
    });

    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      submitUserQuestion(chatInput.value);
    });

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      micBtn.style.display = 'none';
    } else {
      let recognition = null;
      let isListening = false;

      micBtn.addEventListener('click', function () {
        if (state.isBusy) return;
        if (isListening && recognition) {
          recognition.stop();
          return;
        }

        try {
          recognition = new SpeechRecognitionClass();
          recognition.lang = 'id-ID';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          recognition.onstart = function () {
            isListening = true;
            micBtn.classList.add('is-listening');
            chatInput.placeholder = 'Mendengarkan...';
            setBotEmotion('semangat', 0);
          };

          recognition.onresult = function (event) {
            const transcript =
              event.results &&
              event.results[0] &&
              event.results[0][0] &&
              event.results[0][0].transcript;
            if (transcript) {
              chatInput.value = transcript.slice(0, CONFIG.maxInputLength);
              submitUserQuestion(chatInput.value);
            }
          };

          recognition.onend = function () {
            isListening = false;
            micBtn.classList.remove('is-listening');
            chatInput.placeholder = 'Tanyakan soal BOSP atau cara pakai web...';
          };

          recognition.onerror = function () {
            isListening = false;
            micBtn.classList.remove('is-listening');
            chatInput.placeholder = 'Tanyakan soal BOSP atau cara pakai web...';
            setBotEmotion('netral', 0);
          };

          recognition.start();
        } catch {
          isListening = false;
          micBtn.classList.remove('is-listening');
        }
      });
    }
  }

  function mount() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = function () {
          window.speechSynthesis.getVoices();
        };
      }
    }
    const root = buildWidgetDom();
    initController(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
