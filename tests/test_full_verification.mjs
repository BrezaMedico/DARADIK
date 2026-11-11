import crypto from 'node:crypto';
import http from 'node:http';
import assert from 'node:assert';
import { createEmulator } from './security/harness/supabaseEmulator.js';
import { createClient } from '@supabase/supabase-js';
import {
  setServiceSupabaseClient,
  getServiceSupabaseClient,
} from '../server/reportService.js';
import { createExpressApp } from '../server/server.js';
import {
  verifyCaptchaAnswer,
  decryptReportText,
} from '../server/reportCrypto.js';

async function runFullVerification() {
  console.log('================================================================');
  console.log('DARADIK COMPREHENSIVE END-TO-END VERIFICATION');
  console.log('================================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  async function test(name, fn) {
    totalCount++;
    try {
      await fn();
      passedCount++;
      console.log(`[PASS] ${name}`);
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // 1. Inisialisasi Database Emulator dengan Migrasi Hardening Lengkap
  console.log('[1/7] Menyiapkan Supabase Emulator & Database Postgres...');
  const emu = await createEmulator({ stage: 'hardened' });
  const serviceClient = createClient(emu.url, emu.keys.service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  setServiceSupabaseClient(serviceClient);

  // 2. Siapkan Server Express untuk Pengujian HTTP Nyata
  console.log('[2/7] Menjalankan Server Express lokal untuk integrasi endpoint...');
  const app = createExpressApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const serverPort = server.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  async function api(path, opts = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, data: json };
  }

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: UJI KEAMANAN KONFIGURASI SUPABASE & SERVICE ROLE
    // -------------------------------------------------------------------------
    await test('Backend menolak inisialisasi tanpa SUPABASE_SERVICE_ROLE_KEY dan tidak fallback ke publishable key', async () => {
      setServiceSupabaseClient(null);
      const originalRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const originalPub = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      try {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dummy_key';
        let threw = false;
        try {
          getServiceSupabaseClient();
        } catch (err) {
          threw = true;
          assert(err.message.includes('SUPABASE_SERVICE_ROLE_KEY wajib dikonfigurasi'));
        }
        assert.strictEqual(threw, true, 'getServiceSupabaseClient harus melempar error saat service_role absen');
      } finally {
        if (originalRoleKey) process.env.SUPABASE_SERVICE_ROLE_KEY = originalRoleKey;
        if (originalPub) process.env.VITE_SUPABASE_PUBLISHABLE_KEY = originalPub;
        setServiceSupabaseClient(serviceClient);
      }
    });

    // -------------------------------------------------------------------------
    // SECTION 2: UJI SERVER-SIDE CAPTCHA
    // -------------------------------------------------------------------------
    let validCaptcha = null;
    await test('GET /api/reports/captcha mengembalikan soal matematika dengan token ber-signature HMAC-SHA256', async () => {
      const res = await api('/api/reports/captcha');
      assert.strictEqual(res.status, 200);
      assert(res.data.question, 'question harus ada');
      assert(res.data.token, 'token harus ada');
      const parts = res.data.token.split('.');
      assert.strictEqual(parts.length, 2, 'token wajib terdiri dari 2 bagian (payload.signature)');
      validCaptcha = res.data;
    });

    await test('Validasi CAPTCHA menolak jawaban salah dan token manipulasi', async () => {
      const wrong = verifyCaptchaAnswer(999999, validCaptcha.token);
      assert.strictEqual(wrong.valid, false);

      const manipulated = verifyCaptchaAnswer(validCaptcha.expectedAnswer || 10, 'tokenpalsu.tandatanganpalsu');
      assert.strictEqual(manipulated.valid, false);

      const bypass = verifyCaptchaAnswer(10, 'token_tanpa_signature');
      assert.strictEqual(bypass.valid, false);
    });

    // -------------------------------------------------------------------------
    // SECTION 3: UJI UNGGAH BUKTI LAPORAN (EVIDENCE UPLOAD)
    // -------------------------------------------------------------------------
    let uploadedEvidence = null;
    await test('POST /api/reports/upload menolak berkas berbahaya / format palsu', async () => {
      const fakeExe = Buffer.from('MZ\x90\x00\x03\x00\x00\x00Program too big to fit in memory').toString('base64');
      const res = await api('/api/reports/upload', {
        method: 'POST',
        body: {
          fileBase64: fakeExe,
          originalName: 'bukti.jpg',
          mimeType: 'image/jpeg',
        },
      });
      assert.strictEqual(res.status, 400);
      assert(res.data.error.includes('Hanya menerima format berkas JPG, PNG, WebP, atau PDF asli'));
    });

    await test('POST /api/reports/upload menolak berkas melebihi batas 5MB', async () => {
      const bigBuf = Buffer.alloc(5.5 * 1024 * 1024, 0xff);
      bigBuf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
      const res = await api('/api/reports/upload', {
        method: 'POST',
        body: {
          fileBase64: bigBuf.toString('base64'),
          originalName: 'big.png',
          mimeType: 'image/png',
        },
      });
      assert.strictEqual(res.status, 400);
      assert(res.data.error.includes('melebihi batas 5MB'));
    });

    await test('POST /api/reports/upload berhasil mengunggah berkas gambar asli', async () => {
      const validPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      const res = await api('/api/reports/upload', {
        method: 'POST',
        body: {
          fileBase64: validPng.toString('base64'),
          originalName: 'kuitansi_asli.png',
          mimeType: 'image/png',
        },
      });
      assert.strictEqual(res.status, 200);
      assert(res.data.storagePath, 'storagePath harus dibuat');
      assert.strictEqual(res.data.mimeType, 'image/png');
      uploadedEvidence = res.data;
    });

    // -------------------------------------------------------------------------
    // SECTION 4: UJI PENGIRIMAN LAPORAN ANONIM (REPORT SUBMISSION)
    // -------------------------------------------------------------------------
    let createdReport = null;
    let newCaptcha = null;

    await test('POST /api/reports/submit menolak jika CAPTCHA salah atau hilang', async () => {
      const res = await api('/api/reports/submit', {
        method: 'POST',
        body: {
          schoolId: 'SMKN1_BDG',
          schoolName: 'SMK Negeri 1 Bandung',
          schoolNpsn: '20219876',
          category: 'seragam',
          requesterRole: 'Wali Murid',
          notes: 'Dugaan pungli seragam Rp 300.000',
          captchaAnswer: 999,
          captchaToken: 'dummy.token',
        },
      });
      assert.strictEqual(res.status, 400);
      assert(res.data.error, 'Pesan error validasi harus dikembalikan');
    });

    await test('POST /api/reports/submit berhasil membuat laporan anonim terenkripsi', async () => {
      const cRes = await api('/api/reports/captcha');
      newCaptcha = cRes.data;

      const match = newCaptcha.question.match(/(\d+)\s*([\+\-\*×])\s*(\d+)/);
      assert(match, 'Format soal matematika harus cocok');
      const a = parseInt(match[1], 10);
      const op = match[2];
      const b = parseInt(match[3], 10);
      let ans = op === '+' ? a + b : op === '-' ? a - b : a * b;

      const res = await api('/api/reports/submit', {
        method: 'POST',
        body: {
          schoolId: 'SMKN1_BDG',
          schoolName: 'SMK Negeri 1 Bandung',
          schoolNpsn: '20219876',
          kabupaten: 'Kota Bandung',
          kecamatan: 'Coblong',
          category: 'seragam',
          requesterRole: 'Wali Murid',
          notes: 'Dugaan pungli seragam Rp 300.000 via transfer rekening pribadi komite',
          attachments: [uploadedEvidence],
          captchaAnswer: ans,
          captchaToken: newCaptcha.token,
        },
      });

      assert.strictEqual(res.status, 200);
      assert(res.data.ticket_code, 'ticket_code harus dihasilkan');
      assert(res.data.tracking_token, 'tracking_token harus dihasilkan');
      assert(res.data.status === 'QUEUED' || res.data.status === 'diajukan', 'status awal harus QUEUED atau diajukan');
      createdReport = res.data;
    });

    await test('Anti-replay: token CAPTCHA yang sama tidak dapat dipakai ulang untuk submit kedua', async () => {
      const match = newCaptcha.question.match(/(\d+)\s*([\+\-\*×])\s*(\d+)/);
      const a = parseInt(match[1], 10);
      const op = match[2];
      const b = parseInt(match[3], 10);
      let ans = op === '+' ? a + b : op === '-' ? a - b : a * b;

      const res = await api('/api/reports/submit', {
        method: 'POST',
        body: {
          schoolId: 'SMKN1_BDG',
          schoolName: 'SMK Negeri 1 Bandung',
          schoolNpsn: '20219876',
          category: 'seragam',
          notes: 'Percobaan submit ulang replay',
          captchaAnswer: ans,
          captchaToken: newCaptcha.token,
        },
      });
      assert.strictEqual(res.status, 400);
      assert(res.data.error.includes('sudah pernah digunakan'));
    });

    await test('Verifikasi database: data tersimpan terenkripsi AES-256-GCM tanpa plaintext bocor', async () => {
      const dbResult = await emu.db.query(
        `SELECT id, ticket_code, notes_encrypted, encryption_algorithm, attachments_json FROM public.anonymous_reports WHERE id = $1`,
        [createdReport.id]
      );
      assert.strictEqual(dbResult.rows.length, 1);
      const row = dbResult.rows[0];
      assert(row.notes_encrypted.startsWith('dv1.'), 'Catatan harus terenkripsi dengan envelope format dv1');
      assert.strictEqual(row.encryption_algorithm, 'AES-256-GCM/dv1');
      const decrypted = decryptReportText(row.notes_encrypted);
      assert.strictEqual(decrypted, 'Dugaan pungli seragam Rp 300.000 via transfer rekening pribadi komite');
    });

    // -------------------------------------------------------------------------
    // SECTION 5: UJI PELACAKAN STATUS LAPORAN (TRACK REPORT)
    // -------------------------------------------------------------------------
    await test('POST /api/reports/track menolak nomor tiket atau token salah', async () => {
      const res1 = await api('/api/reports/track', {
        method: 'POST',
        body: { ticketCode: 'LAP-SALAH-999', trackingToken: createdReport.tracking_token },
      });
      assert.strictEqual(res1.status, 404);

      const res2 = await api('/api/reports/track', {
        method: 'POST',
        body: { ticketCode: createdReport.ticket_code, trackingToken: 'trk_tokentidaksah123456789' },
      });
      assert.strictEqual(res2.status, 404);
    });

    await test('POST /api/reports/track berhasil membaca laporan dan mendekripsi catatan tanpa membocorkan info internal', async () => {
      const res = await api('/api/reports/track', {
        method: 'POST',
        body: {
          ticketCode: createdReport.ticket_code,
          trackingToken: createdReport.tracking_token,
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.report.ticket_code, createdReport.ticket_code);
      assert.strictEqual(
        res.data.report.notes,
        'Dugaan pungli seragam Rp 300.000 via transfer rekening pribadi komite'
      );
      assert.strictEqual(res.data.report.notes_encrypted, undefined, 'notes_encrypted tidak boleh dikirim ke klien');
      assert.strictEqual(res.data.report.token_hash, undefined, 'token_hash tidak boleh bocor');
      assert(Array.isArray(res.data.history), 'history harus berbentuk array');
    });

    // -------------------------------------------------------------------------
    // SECTION 6: UJI PENOLAKAN REQUEST TANPA AUTENTIKASI / OTORISASI
    // -------------------------------------------------------------------------
    await test('Pengguna publik/anon ditolak total saat mengakses tabel anonymous_reports secara langsung via REST', async () => {
      const res = await emu.rest('GET', '/rest/v1/anonymous_reports', { key: emu.keys.anon });
      const blocked = res.status === 401 || res.status === 403 || (Array.isArray(res.json) && res.json.length === 0);
      assert.strictEqual(blocked, true, `Anon direct SELECT harus ditolak, status: ${res.status}`);
    });

    await test('Pengguna publik/anon ditolak total saat mencoba memanipulasi status laporan via REST', async () => {
      const res = await emu.rest('PATCH', `/rest/v1/anonymous_reports?id=eq.${createdReport.id}`, {
        key: emu.keys.anon,
        body: { status: 'selesai' },
      });
      assert.strictEqual(res.status, 401, 'Anon direct UPDATE wajib ditolak 401');
    });

    await test('Akses berkas storage report-evidence ditolak bagi publik tanpa otorisasi', async () => {
      const res = await emu.rest('GET', `/storage/v1/object/report-evidence/${uploadedEvidence.storagePath}`, {
        key: emu.keys.anon,
      });
      const blocked = res.status === 401 || res.status === 403 || res.status === 404;
      assert.strictEqual(blocked, true, 'Public storage direct access harus ditolak / 401/404');
    });

    // -------------------------------------------------------------------------
    // SECTION 7: UJI DASHBOARD & HAK AKSES PETUGAS (OFFICER ACCESS)
    // -------------------------------------------------------------------------
    const officerUser = await emu.createUser('petugas@disdik.go.id');
    const nonOfficerUser = await emu.createUser('user@biasa.com');

    await emu.db.query(
      `INSERT INTO public.officer_profiles (id, email, full_name, jabatan, unit_kerja, role, is_active)
       VALUES ($1, 'petugas@disdik.go.id', 'Budi Santoso, S.Pd', 'Pengawas', 'Disdik', 'officer', TRUE)`,
      [officerUser.id]
    );

    const tokenOfficer = emu.userJwt(officerUser.id);
    const tokenNonOfficer = emu.userJwt(nonOfficerUser.id);

    await test('Pengguna authenticated non-petugas ditolak saat mengakses antrean laporan', async () => {
      const res = await emu.rest('POST', '/rest/v1/rpc/officer_get_reports_queue', {
        key: emu.keys.anon,
        bearer: tokenNonOfficer,
      });
      assert(res.status === 400 || res.status === 401 || res.status === 403, 'Non-petugas harus ditolak');
      assert(
        res.json?.message?.includes('UNAUTHORIZED') ||
        res.json?.error?.includes('UNAUTHORIZED') ||
        res.text?.includes('UNAUTHORIZED'),
        'Pesan penolakan harus mengandung UNAUTHORIZED'
      );
    });

    await test('Petugas resmi yang aktif berhasil membuka antrean laporan dan detail bundle', async () => {
      const queueRes = await emu.rest('POST', '/rest/v1/rpc/officer_get_reports_queue', {
        key: emu.keys.anon,
        bearer: tokenOfficer,
      });
      assert.strictEqual(queueRes.status, 200);
      assert(Array.isArray(queueRes.json), 'Antrean laporan harus berbentuk array');
      const found = queueRes.json.find((r) => r.id === createdReport.id);
      assert(found, 'Laporan yang baru dibuat harus tampak di antrean petugas');

      const detailRes = await emu.rest('POST', '/rest/v1/rpc/officer_get_report_detail_bundle', {
        key: emu.keys.anon,
        bearer: tokenOfficer,
        body: { p_report_id: createdReport.id },
      });
      assert.strictEqual(detailRes.status, 200);
      assert.strictEqual(detailRes.json.report.ticket_code, createdReport.ticket_code);
    });

    // -------------------------------------------------------------------------
    // SECTION 8: AUDIT PERBAIKAN 4 MASALAH KEAMANAN KRITIS (CORS, NO-FALLBACK, STORAGE 300S, RLS ROLE)
    // -------------------------------------------------------------------------
    await test('Upload bukti tidak mengekspos URL publik dan track menerbitkan signed URL 5 menit (300 detik)', async () => {
      assert.strictEqual(uploadedEvidence.url, undefined, 'Upload endpoint tidak boleh mengembalikan getPublicUrl');
      const trackSignLog = emu.requestLog.filter(
        (entry) => entry.type === 'storage-sign' && entry.bucket === 'report-evidence'
      );
      assert(trackSignLog.length >= 1, 'Signed URL harus dibuat saat pelacakan');
      assert(
        trackSignLog.every((entry) => entry.expiresIn === 300),
        `Semua signed URL bukti wajib berumur 300 detik (5 menit), ditemukan: ${JSON.stringify(trackSignLog)}`
      );
    });

    await test('Endpoint bukti petugas memverifikasi JWT + role DB (menolak spoofing role frontend) dan pakai TTL 300s', async () => {
      const noAuth = await api('/api/reports/officer-evidence-urls', {
        method: 'POST',
        body: { reportId: createdReport.id, storagePaths: [uploadedEvidence.storagePath], role: 'supervisor' },
      });
      assert.strictEqual(noAuth.status, 401);

      const nonOfficerAttempt = await api('/api/reports/officer-evidence-urls', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenNonOfficer}` },
        body: { reportId: createdReport.id, storagePaths: [uploadedEvidence.storagePath], role: 'supervisor' },
      });
      assert.strictEqual(nonOfficerAttempt.status, 403, 'Non-petugas walau mengirim role=supervisor di body wajib ditolak 403');

      const authorizedRes = await api('/api/reports/officer-evidence-urls', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOfficer}` },
        body: {
          reportId: createdReport.id,
          storagePaths: [uploadedEvidence.storagePath, 'initial/unauthorized_other.png'],
        },
      });
      assert.strictEqual(authorizedRes.status, 200);
      assert.strictEqual(authorizedRes.data.expiresIn, 300);
      assert(authorizedRes.data.signedUrls[uploadedEvidence.storagePath], 'Path milik laporan harus dapat signed URL');
      assert.strictEqual(
        authorizedRes.data.signedUrls['initial/unauthorized_other.png'],
        undefined,
        'Path yang bukan milik laporan tidak boleh diberi signed URL'
      );
    });

    await test('RLS & RPC petugas menolak petugas non-aktif, non-supervisor, dan eskalasi officer_profiles', async () => {
      const inactiveUser = await emu.createUser('nonaktif@disdik.go.id');
      await emu.db.query(
        `INSERT INTO public.officer_profiles (id, email, full_name, jabatan, unit_kerja, role, is_active)
         VALUES ($1, 'nonaktif@disdik.go.id', 'Ex Petugas', 'Pengawas', 'Disdik', 'officer', FALSE)`,
        [inactiveUser.id]
      );
      const tokenInactive = emu.userJwt(inactiveUser.id);
      const rpcRes = await emu.rest('POST', '/rest/v1/rpc/officer_get_reports_queue', {
        key: emu.keys.anon,
        bearer: tokenInactive,
      });
      assert(rpcRes.status === 400 || rpcRes.status === 401 || rpcRes.status === 403, 'Petugas non-aktif harus ditolak');

      const officerRevokeRes = await emu.rest('POST', '/rest/v1/rpc/officer_revoke_report_access_token', {
        key: emu.keys.anon,
        bearer: tokenOfficer,
        body: { p_report_id: createdReport.id },
      });
      assert(
        officerRevokeRes.status === 400 || officerRevokeRes.status === 401 || officerRevokeRes.status === 403,
        'Petugas role=officer harus ditolak untuk aksi supervisor'
      );

      const escalateRes = await emu.rest('PATCH', `/rest/v1/officer_profiles?id=eq.${officerUser.id}`, {
        key: emu.keys.anon,
        bearer: tokenOfficer,
        body: { role: 'supervisor' },
      });
      assert(escalateRes.status === 401 || escalateRes.status === 403, 'Petugas dilarang memodifikasi role di officer_profiles');
    });

    await test('CORS menolak origin tidak terdaftar dan memisahkan konfigurasi dev vs production', async () => {
      const { createExpressApp } = await import('../server/server.js');
      const prodApp = createExpressApp({
        corsEnv: {
          nodeEnv: 'production',
          rawAllowedOrigins: 'http://localhost:5173,*',
        },
      });
      const prodServer = prodApp.listen(0, '127.0.0.1');
      await new Promise((r) => prodServer.once('listening', r));
      const prodPort = prodServer.address().port;
      try {
        const allowOfficial = await fetch(`http://127.0.0.1:${prodPort}/api/reports/captcha`, {
          headers: { Origin: 'https://daradik.vercel.app' },
        });
        assert.strictEqual(allowOfficial.headers.get('access-control-allow-origin'), 'https://daradik.vercel.app');
        assert.strictEqual(allowOfficial.headers.get('access-control-allow-credentials'), 'true');

        const rejectEvil = await fetch(`http://127.0.0.1:${prodPort}/api/reports/captcha`, {
          headers: { Origin: 'https://evil-attacker.example' },
        });
        assert.strictEqual(rejectEvil.status, 403);
        assert.strictEqual(rejectEvil.headers.get('access-control-allow-origin'), null);

        const rejectWildcardVercel = await fetch(`http://127.0.0.1:${prodPort}/api/reports/captcha`, {
          headers: { Origin: 'https://fake-daradik.vercel.app' },
        });
        assert.strictEqual(rejectWildcardVercel.status, 403);

        const rejectLocalInProd = await fetch(`http://127.0.0.1:${prodPort}/api/reports/captcha`, {
          headers: { Origin: 'http://localhost:5173' },
        });
        assert.strictEqual(rejectLocalInProd.status, 403, 'Origin localhost wajib ditolak di mode production');

        const { default: http } = await import('node:http');
        const sameOriginStatus = await new Promise((resolve, reject) => {
          const r = http.request(
            {
              host: '127.0.0.1',
              port: prodPort,
              path: '/api/reports/captcha',
              method: 'GET',
              headers: {
                Host: 'daradik-preview-custom.vercel.app',
                Origin: 'https://daradik-preview-custom.vercel.app',
              },
            },
            (res) => {
              res.resume();
              resolve({
                status: res.statusCode,
                acao: res.headers['access-control-allow-origin'],
                acac: res.headers['access-control-allow-credentials'],
              });
            }
          );
          r.on('error', reject);
          r.end();
        });
        assert.strictEqual(sameOriginStatus.status, 200, 'Same-origin deployment HTTPS harus diizinkan');
        assert.strictEqual(sameOriginStatus.acao, 'https://daradik-preview-custom.vercel.app');
        assert.strictEqual(sameOriginStatus.acac, 'true');

        const rejectNullOrigin = await fetch(`http://127.0.0.1:${prodPort}/api/reports/captcha`, {
          headers: { Origin: 'null' },
        });
        assert.strictEqual(rejectNullOrigin.status, 403, 'Origin literal null wajib ditolak');
      } finally {
        prodServer.close();
      }
    });

    await test('Tidak ada fallback plaintext RPC jika svc_submit_report/track/reply gagal', async () => {
      const { handleGetCaptcha, handleSubmitReport, handleTrackReport, handleReplyReport } =
        await import('../server/reportService.js');
      const cap = await handleGetCaptcha();
      const match = cap.payload.question.match(/(\d+)\s*([\+\-\*×])\s*(\d+)/);
      const a = parseInt(match[1], 10);
      const op = match[2];
      const b = parseInt(match[3], 10);
      const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;

      const calledRpcs = [];
      const failingClient = {
        rpc: async (fnName) => {
          calledRpcs.push(fnName);
          if (fnName === 'svc_rate_limit') {
            return { data: { allowed: true, retry_after: 0 }, error: null };
          }
          return {
            data: null,
            error: { code: 'PGRST202', message: `Could not find function public.${fnName}` },
          };
        },
      };

      const submitAttempt = await handleSubmitReport(
        {
          schoolId: 'SMKN1_BDG',
          schoolName: 'SMK Negeri 1 Bandung',
          schoolNpsn: '20219876',
          category: 'seragam',
          requesterRole: 'Wali Murid',
          notes: 'Pungutan sensitif tidak boleh dikirim plaintext',
          captchaAnswer: ans,
          captchaToken: cap.payload.token,
        },
        '127.0.0.1',
        failingClient
      );
      assert.strictEqual(submitAttempt.status, 500);

      const trackAttempt = await handleTrackReport(
        { ticketCode: createdReport.ticket_code, trackingToken: createdReport.tracking_token },
        '127.0.0.1',
        failingClient
      );
      assert.strictEqual(trackAttempt.status, 500);

      const replyAttempt = await handleReplyReport(
        {
          ticketCode: createdReport.ticket_code,
          trackingToken: createdReport.tracking_token,
          message: 'Balasan sensitif wajib terenkripsi',
        },
        '127.0.0.1',
        failingClient
      );
      assert.strictEqual(replyAttempt.status, 500);

      assert.strictEqual(calledRpcs.includes('submit_public_report'), false);
      assert.strictEqual(calledRpcs.includes('get_public_report_tracking'), false);
      assert.strictEqual(calledRpcs.includes('submit_reporter_additional_info'), false);
    });

    await test('Pengiriman laporan dengan Referensi Data (BOSP/WA Scanner) & tanpa lampiran berhasil, path palsu tetap ditolak', async () => {
      const capRef = await api('/api/reports/captcha');
      const mRef = capRef.data.question.match(/(\d+)\s*([\+\-\*×])\s*(\d+)/);
      const a1 = parseInt(mRef[1], 10);
      const b1 = parseInt(mRef[3], 10);
      const ansRef = mRef[2] === '+' ? a1 + b1 : mRef[2] === '-' ? a1 - b1 : a1 * b1;

      const refRes = await api('/api/reports/submit', {
        method: 'POST',
        body: {
          schoolId: 'SMKN1_BDG',
          schoolName: 'SMK Negeri 1 Bandung',
          schoolNpsn: '20219876',
          kabupaten: 'Kota Bandung',
          kecamatan: 'Coblong',
          category: `Lainnya: Kejanggalan Item ${'X'.repeat(320)}`,
          requesterRole: 'Komite Sekolah',
          notes: 'Laporan dengan referensi item BOSP dan screenshot terunggah',
          attachments: [
            { name: 'Arsip Nota INV-01 & Geotag', sizeFormatted: 'Referensi Data' },
            uploadedEvidence,
          ],
          ocrText: 'Halo wali murid '.repeat(900),
          ocrBospFact: 'Fakta BOSP',
          captchaAnswer: ansRef,
          captchaToken: capRef.data.token,
        },
      });
      assert.strictEqual(refRes.status, 200, `Laporan referensi gagal: ${JSON.stringify(refRes.data)}`);
      assert(refRes.data.ticket_code, 'ticket_code harus terbit untuk laporan dengan Referensi Data');

      const capEmpty = await api('/api/reports/captcha');
      const mEmp = capEmpty.data.question.match(/(\d+)\s*([\+\-\*×])\s*(\d+)/);
      const a2 = parseInt(mEmp[1], 10);
      const b2 = parseInt(mEmp[3], 10);
      const ansEmpty = mEmp[2] === '+' ? a2 + b2 : mEmp[2] === '-' ? a2 - b2 : a2 * b2;

      const emptyRes = await api('/api/reports/submit', {
        method: 'POST',
        body: {
          schoolId: 'SMKN1_BDG',
          schoolName: 'SMK Negeri 1 Bandung',
          schoolNpsn: '20219876',
          category: 'seragam',
          requesterRole: 'Wali Murid',
          notes: 'Laporan teks lengkap tanpa berkas lampiran apa pun',
          attachments: [],
          captchaAnswer: ansEmpty,
          captchaToken: capEmpty.data.token,
        },
      });
      assert.strictEqual(emptyRes.status, 200);

      const capBad = await api('/api/reports/captcha');
      const mBad = capBad.data.question.match(/(\d+)\s*([\+\-\*×])\s*(\d+)/);
      const a3 = parseInt(mBad[1], 10);
      const b3 = parseInt(mBad[3], 10);
      const ansBad = mBad[2] === '+' ? a3 + b3 : mBad[2] === '-' ? a3 - b3 : a3 * b3;

      const badPathRes = await api('/api/reports/submit', {
        method: 'POST',
        body: {
          schoolId: 'SMKN1_BDG',
          schoolName: 'SMK Negeri 1 Bandung',
          schoolNpsn: '20219876',
          category: 'seragam',
          requesterRole: 'Wali Murid',
          notes: 'Percobaan injeksi jalur lampiran tidak valid',
          attachments: [
            { name: 'evil.jpg', sizeFormatted: '10 KB', storagePath: 'unauthorized/evil.jpg' },
          ],
          captchaAnswer: ansBad,
          captchaToken: capBad.data.token,
        },
      });
      assert.strictEqual(badPathRes.status, 400);
      assert(badPathRes.data.error.includes('Jalur berkas lampiran tidak valid'));
    });

    await test('Admin/petugas aktif dapat membaca dekripsi kronologi laporan, sedangkan non-petugas ditolak', async () => {
      const unauthDecrypt = await api('/api/reports/officer-decrypt', {
        method: 'POST',
        body: { reportId: createdReport.id },
      });
      assert.strictEqual(unauthDecrypt.status, 401);

      const nonOfficerDecrypt = await api('/api/reports/officer-decrypt', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenNonOfficer}` },
        body: { reportId: createdReport.id },
      });
      assert.strictEqual(nonOfficerDecrypt.status, 403);

      const officerDecrypt = await api('/api/reports/officer-decrypt', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOfficer}` },
        body: { reportId: createdReport.id },
      });
      assert.strictEqual(officerDecrypt.status, 200);
      assert.strictEqual(
        officerDecrypt.data.notes,
        'Dugaan pungli seragam Rp 300.000 via transfer rekening pribadi komite'
      );
    });

    console.log('\n================================================================');
    console.log(`HASIL: ${passedCount}/${totalCount} PENGUJIAN LENGKAP LOLOS`);
    console.log(
      passedCount === totalCount
        ? 'STATUS: SEMUA FUNGSIONALITAS BERJALAN LANCAR TANPA MASALAH'
        : 'STATUS: ADA PENGUJIAN YANG GAGAL'
    );
    console.log('================================================================');
  } finally {
    server.close();
    await emu.close();
    process.exit(passedCount === totalCount && totalCount > 0 ? 0 : 1);
  }
}

runFullVerification().catch((err) => {
  console.error('\n[FATAL ERROR DALAM PENGUJIAN]:', err);
  process.exit(1);
});
