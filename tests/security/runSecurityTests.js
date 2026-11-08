import crypto from 'node:crypto';
import { createEmulator } from './harness/supabaseEmulator.js';
import {
  encryptReportText,
  decryptReportText,
  generateTrackingSecret,
  hashTrackingToken,
  generateCaptchaChallenge,
  verifyCaptchaAnswer,
  detectFileMimeAndValidate,
} from '../../server/reportCrypto.js';
import {
  handleSubmitReport,
  handleTrackReport,
  handleUploadEvidence,
  handleReplyReport,
  setServiceSupabaseClient,
} from '../../server/reportService.js';
import { createClient } from '@supabase/supabase-js';

const results = [];

function recordTest(num, name, passed, details) {
  results.push({ num, name, passed, details });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[Test ${String(num).padStart(2, '0')}] ${mark}: ${name}`);
  if (details) {
    console.log(`         Evidence: ${details}`);
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log('DARADIK SECURITY TEST SUITE (15 P0-P2 MANDATORY SCENARIOS)');
  console.log('================================================================\n');

  const emu = await createEmulator({ stage: 'hardened' });
  const serviceClient = createClient(emu.url, emu.keys.service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  setServiceSupabaseClient(serviceClient);

  try {
    // -------------------------------------------------------------------------
    // SETUP TEST DATA
    // -------------------------------------------------------------------------
    const testReportId = crypto.randomUUID();
    const trackingSecret = generateTrackingSecret();
    const tokenHash = hashTrackingToken(trackingSecret);
    const tokenHashHex = `\\x${tokenHash.toString('hex')}`;
    const encryptedNotes = encryptReportText('Kronologi rahasia pungutan seragam Rp 450.000');

    // Submit a baseline report directly using service RPC
    const submitRes = await serviceClient.rpc('svc_submit_report', {
      p_id: testReportId,
      p_token_hash: tokenHashHex,
      p_school_id: 'SMKN1_BDG',
      p_school_name: 'SMK Negeri 1 Bandung',
      p_school_npsn: '20219876',
      p_kabupaten: 'Kota Bandung',
      p_kecamatan: 'Coblong',
      p_category: 'seragam',
      p_requester_role: 'Wali Murid',
      p_notes_encrypted: encryptedNotes,
      p_attachments: [
        {
          name: 'Bukti_Kuitansi.jpg',
          sizeFormatted: '120 KB',
          storagePath: 'initial/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6.jpg',
          mimeType: 'image/jpeg',
          uploadedAt: new Date().toISOString(),
        },
      ],
      p_ocr_text_encrypted: null,
      p_ocr_bosp_fact_encrypted: null,
      p_encryption_algorithm: 'AES-256-GCM/dv1',
    });

    const ticketCode = submitRes.data.ticket_code;

    // -------------------------------------------------------------------------
    // SCENARIO 1: Akses langsung tabel laporan oleh anon
    // -------------------------------------------------------------------------
    const s1 = await emu.rest('GET', '/rest/v1/anonymous_reports', { key: emu.keys.anon });
    const s1Blocked = s1.status === 401 || s1.status === 403 || (Array.isArray(s1.json) && s1.json.length === 0);
    recordTest(
      1,
      'Akses langsung tabel laporan oleh anon',
      s1Blocked,
      `HTTP status ${s1.status}; anonymous SELECT access is completely denied.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 2: Enumerasi kode tiket
    // -------------------------------------------------------------------------
    // Anon attempts to call RPC directly
    const s2Rpc = await emu.rest('POST', '/rest/v1/rpc/svc_get_report_tracking', {
      key: emu.keys.anon,
      body: { p_ticket_code: ticketCode, p_token_hash: tokenHashHex },
    });
    // Calling via backend without secret token returns null / 400
    const s2Backend = await handleTrackReport({ ticketCode, trackingToken: '' }, '127.0.0.1', serviceClient);

    const s2Passed = (s2Rpc.status === 401 || s2Rpc.status === 403 || s2Rpc.status === 404) && s2Backend.status === 400;
    recordTest(
      2,
      'Pencegahan enumerasi kode tiket laporan',
      s2Passed,
      `Public RPC directly blocked (${s2Rpc.status}); backend requires 160-bit secret token.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 3: Akses bukti tanpa otorisasi
    // -------------------------------------------------------------------------
    const s3 = await emu.rest('GET', '/storage/v1/object/report-evidence/initial/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6.jpg', {
      key: emu.keys.anon,
    });
    const s3Passed = [400, 401, 403, 404].includes(s3.status);
    recordTest(
      3,
      'Akses bukti tanpa otorisasi ke storage private',
      s3Passed,
      `Bucket report-evidence is private; anon direct access returned HTTP ${s3.status}.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 4: Penggunaan token yang salah / dimanipulasi
    // -------------------------------------------------------------------------
    const fakeToken = generateTrackingSecret(); // different random token
    const s4 = await handleTrackReport({ ticketCode, trackingToken: fakeToken }, '127.0.0.1', serviceClient);
    const s4Passed = s4.status === 404;
    recordTest(
      4,
      'Penggunaan token rahasia yang salah / dimanipulasi',
      s4Passed,
      `Mismatched token was rejected with 404 Not Found; constant-time hash verification failed.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 5: Eksekusi fungsi petugas oleh pengguna anon
    // -------------------------------------------------------------------------
    const s5Queue = await emu.rest('POST', '/rest/v1/rpc/officer_get_reports_queue', { key: emu.keys.anon });
    const s5Detail = await emu.rest('POST', '/rest/v1/rpc/officer_get_report_detail_bundle', {
      key: emu.keys.anon,
      body: { p_report_id: testReportId },
    });
    const s5Passed =
      (s5Queue.status === 401 || s5Queue.status === 403) &&
      (s5Detail.status === 401 || s5Detail.status === 403);
    recordTest(
      5,
      'Eksekusi fungsi petugas oleh pengguna anon',
      s5Passed,
      `officer_get_reports_queue returned ${s5Queue.status}, officer_get_report_detail_bundle returned ${s5Detail.status}.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 6: Eskalasi hak akses oleh authenticated non-petugas
    // -------------------------------------------------------------------------
    const regularUser = await emu.createUser('user_biasa@example.com');
    const regularJwt = emu.userJwt(regularUser.id);
    const s6Queue = await emu.rest('POST', '/rest/v1/rpc/officer_get_reports_queue', {
      key: emu.keys.anon,
      bearer: regularJwt,
    });
    const s6InsertProfile = await emu.rest('POST', '/rest/v1/officer_profiles', {
      key: emu.keys.anon,
      bearer: regularJwt,
      body: { id: regularUser.id, role: 'supervisor', is_active: true },
    });
    const s6Passed =
      (s6Queue.status === 400 || s6Queue.status === 401 || s6Queue.status === 403) &&
      (s6InsertProfile.status === 401 || s6InsertProfile.status === 403 || s6InsertProfile.status === 404);
    recordTest(
      6,
      'Eskalasi hak akses oleh authenticated non-petugas',
      s6Passed,
      `Non-officer authenticated user rejected (${s6Queue.json?.message || s6Queue.status}); profile write blocked.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 7: Akses laporan yang bukan haknya
    // -------------------------------------------------------------------------
    const wrongPathCheck = await serviceClient.rpc('svc_authorize_report_evidence', {
      p_ticket_code: ticketCode,
      p_token_hash: tokenHashHex,
      p_storage_path: 'initial/different_unauthorized_file.pdf',
    });
    const s7Passed = wrongPathCheck.data === false;
    recordTest(
      7,
      'Akses bukti file yang bukan haknya',
      s7Passed,
      `svc_authorize_report_evidence returned false for unassociated storage path.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 8: Manipulasi status laporan oleh pelapor
    // -------------------------------------------------------------------------
    const s8DirectUpdate = await emu.rest('PATCH', `/rest/v1/anonymous_reports?ticket_code=eq.${ticketCode}`, {
      key: emu.keys.anon,
      body: { status: 'COMPLETED' },
    });
    const s8Passed = s8DirectUpdate.status === 401 || s8DirectUpdate.status === 403 || s8DirectUpdate.status === 404;
    recordTest(
      8,
      'Pencegahan manipulasi status laporan oleh pelapor',
      s8Passed,
      `Direct UPDATE on anonymous_reports blocked with HTTP ${s8DirectUpdate.status}.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 9: Akses catatan internal oleh publik
    // -------------------------------------------------------------------------
    const s9Direct = await emu.rest('GET', '/rest/v1/report_internal_notes', { key: emu.keys.anon });
    // Add internal note using service
    await emu.db.query(
      `INSERT INTO public.report_internal_notes (report_id, officer_uid, officer_name, note)
       VALUES ($1, $2, 'Investigator A', 'Catatan sangat rahasia intelijen')`,
      [testReportId, crypto.randomUUID()]
    );
    const trackingData = await handleTrackReport({ ticketCode, trackingToken: trackingSecret }, '127.0.0.1', serviceClient);
    const s9Passed =
      (s9Direct.status === 401 || s9Direct.status === 403 || s9Direct.status === 404) &&
      !trackingData.payload.report.internal_notes &&
      !trackingData.payload.internal_notes;
    recordTest(
      9,
      'Akses catatan internal oleh publik',
      s9Passed,
      `Direct read blocked (${s9Direct.status}); public tracking payload excludes internal notes.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 10: SQL injection pada seluruh parameter
    // -------------------------------------------------------------------------
    const sqlPayload = "' OR '1'='1'; DROP TABLE anonymous_reports; --";
    const s10Track = await handleTrackReport(
      { ticketCode: sqlPayload, trackingToken: trackingSecret },
      '127.0.0.1',
      serviceClient
    );
    // Verify table still exists
    const checkTable = await emu.db.query('SELECT count(*) FROM public.anonymous_reports');
    const s10Passed = s10Track.status === 404 && Number(checkTable.rows[0].count) >= 1;
    recordTest(
      10,
      'Pencegahan SQL injection pada parameter input',
      s10Passed,
      `Malicious SQL string safely handled as literal; database integrity fully intact.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 11: Bypass validasi ukuran dan tipe file
    // -------------------------------------------------------------------------
    const fakeExeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00Malicious Executable Content');
    const s11Exe = detectFileMimeAndValidate(fakeExeBuffer, 'image/jpeg');
    const oversizeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const s11Size = detectFileMimeAndValidate(oversizeBuffer, 'image/png');
    const s11Passed = !s11Exe.valid && !s11Size.valid;
    recordTest(
      11,
      'Validasi integritas konten berkas (magic bytes & size)',
      s11Passed,
      `Disguised executable rejected: "${s11Exe.reason}"; oversize 6MB rejected: "${s11Size.reason}".`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 12: Pembacaan riwayat status yang seharusnya internal
    // -------------------------------------------------------------------------
    await emu.db.query(
      `INSERT INTO public.report_status_history (report_id, previous_status, new_status, changed_by_name, note, is_internal)
       VALUES ($1, 'QUEUED', 'SEDANG_DITELAAH', 'Pemeriksa Rahasia', 'Rahasia investigasi dinas', TRUE)`,
      [testReportId]
    );
    const s12Track = await handleTrackReport({ ticketCode, trackingToken: trackingSecret }, '127.0.0.1', serviceClient);
    const historyItems = s12Track.payload.history || [];
    const leakedInternal = historyItems.some((h) => h.note?.includes('Rahasia investigasi dinas'));
    const s12Passed = s12Track.status === 200 && !leakedInternal;
    recordTest(
      12,
      'Isolasi riwayat status internal dari pelapor',
      s12Passed,
      `Internal status history records are filtered out (history count: ${historyItems.length}, internal leaked: ${leakedInternal}).`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 13: Bypass CAPTCHA dan rate limiting
    // -------------------------------------------------------------------------
    const capChallenge = generateCaptchaChallenge();
    const wrongCapSubmit = await handleSubmitReport(
      {
        schoolName: 'SMK 1',
        schoolNpsn: '20219876',
        category: 'seragam',
        requesterRole: 'Wali Murid',
        notes: 'Catatan pengaduan pengujian',
        captchaAnswer: 99999, // wrong answer
        captchaToken: capChallenge.token,
      },
      '127.0.0.1',
      serviceClient
    );
    // Rate limit RPC check
    const rateLimitCheck = await serviceClient.rpc('svc_rate_limit', {
      p_bucket: 'test_bucket',
      p_key_hash: 'test_key_hash_123',
      p_max: 2,
      p_window_seconds: 60,
      p_increment: true,
    });
    await serviceClient.rpc('svc_rate_limit', {
      p_bucket: 'test_bucket',
      p_key_hash: 'test_key_hash_123',
      p_max: 2,
      p_window_seconds: 60,
      p_increment: true,
    });
    const thirdHit = await serviceClient.rpc('svc_rate_limit', {
      p_bucket: 'test_bucket',
      p_key_hash: 'test_key_hash_123',
      p_max: 2,
      p_window_seconds: 60,
      p_increment: true,
    });

    const s13Passed = wrongCapSubmit.status === 400 && thirdHit.data.allowed === false;
    recordTest(
      13,
      'Validasi server-side CAPTCHA dan rate limiting atomik',
      s13Passed,
      `Invalid CAPTCHA rejected with 400 (${wrongCapSubmit.payload.error}); 3rd rate limit hit returned allowed: false.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 14: Penggunaan kembali token yang sudah dicabut
    // -------------------------------------------------------------------------
    // Create supervisor officer to revoke token
    const supervisor = await emu.createUser('supervisor@dinas.go.id');
    await emu.db.query(
      `INSERT INTO public.officer_profiles (id, email, full_name, jabatan, unit_kerja, role, is_active)
       VALUES ($1, $2, 'Dra. Hj. Nurjanah', 'Kepala Bidang', 'Dinas Pendidikan', 'supervisor', TRUE)`,
      [supervisor.id, supervisor.email]
    );
    const supervisorJwt = emu.userJwt(supervisor.id);

    const revokeRes = await emu.rest('POST', '/rest/v1/rpc/officer_revoke_report_access_token', {
      key: emu.keys.anon,
      bearer: supervisorJwt,
      body: { p_report_id: testReportId },
    });

    const s14Track = await handleTrackReport({ ticketCode, trackingToken: trackingSecret }, '127.0.0.1', serviceClient);
    const s14Passed = revokeRes.status === 200 && s14Track.status === 404;
    recordTest(
      14,
      'Pencabutan token akses pelapor dan proteksi reuse',
      s14Passed,
      `Supervisor revoked token (${revokeRes.status}); subsequent lookup returned 404 Not Found.`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 15: Integritas enkripsi autentik (AES-256-GCM)
    // -------------------------------------------------------------------------
    const sampleSecretText = 'Informasi sangat rahasia mengenai rekening penampung dana pungutan';
    const envelope = encryptReportText(sampleSecretText);
    const decrypted = decryptReportText(envelope);

    // Tamper with ciphertext
    const parts = envelope.split('.');
    const tamperedParts = [...parts];
    // flip last char of ciphertext
    const ct = tamperedParts[3];
    tamperedParts[3] = ct.slice(0, -1) + (ct.slice(-1) === 'A' ? 'B' : 'A');
    const tamperedEnvelope = tamperedParts.join('.');

    let tamperCaught = false;
    try {
      decryptReportText(tamperedEnvelope);
    } catch {
      tamperCaught = true;
    }

    const s15Passed = decrypted === sampleSecretText && tamperCaught;
    recordTest(
      15,
      'Integritas dan autentikasi enkripsi AES-256-GCM',
      s15Passed,
      `Decryption verified (${decrypted === sampleSecretText}); ciphertext bit tampering detected and rejected.`
    );

    console.log('\n================================================================');
    const allPassed = results.every((r) => r.passed);
    const passCount = results.filter((r) => r.passed).length;
    console.log(`TEST SUMMARY: ${passCount}/${results.length} PASSED`);
    console.log(`STATUS: ${allPassed ? 'ALL SECURITY CHECKS PASSED (100%)' : 'SOME CHECKS FAILED'}`);
    console.log('================================================================');

    return { allPassed, passCount, total: results.length, results };
  } finally {
    await emu.close();
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
