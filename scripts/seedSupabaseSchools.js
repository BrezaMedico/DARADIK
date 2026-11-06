/**
 * Script Sinkronisasi Database Sekolah ke Supabase Berdasarkan Jenjang (SD, SMP, SMA, SMK)
 * Memisahkan data per jenjang ke tabel masing-masing:
 * - schools_sd (1.028 SD Negeri & Swasta)
 * - schools_smp (1.028 SMP Negeri & Swasta)
 * - schools_sma (1.028 SMA Negeri & Swasta)
 * - schools_smk (1.028 SMK Negeri & Swasta)
 * Serta menyinkronkan ke tabel schools utama / view schools_all.
 */

import { createServer } from 'vite';
import https from 'node:https';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eteimuixvdbcnzokckff.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable__L_ZAHdcCN9NXZn1myW90A_QfDZyD8J';
const HOSTNAME = new URL(SUPABASE_URL).hostname;

function sendSupabaseRequest({ path, method = 'GET', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payloadStr = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...headers,
    };
    if (payloadStr) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payloadStr);
    }

    const options = {
      hostname: HOSTNAME,
      port: 443,
      path,
      method,
      headers: reqHeaders,
      family: 4,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (payloadStr) req.write(payloadStr);
    req.end();
  });
}

function mapSchoolToRow(s) {
  return {
    id: s.id,
    name: s.name,
    npsn: s.npsn,
    student_count: s.studentCount,
    total_bosp: s.totalBosp,
    per_student_estimate: s.perStudentEstimate,
    kabupaten: s.kabupaten,
    kecamatan: s.kecamatan,
    provinsi: s.provinsi,
    address: s.address,
    status: s.status,
    school_type: s.schoolType || 'Negeri',
    data_payload: {
      id: s.id,
      name: s.name,
      npsn: s.npsn,
      sampleNisn: s.sampleNisn,
      principalName: s.principalName,
      treasurerName: s.treasurerName,
      provinsi: s.provinsi,
      kabupaten: s.kabupaten,
      kecamatan: s.kecamatan,
      address: s.address,
      status: s.status,
      schoolType: s.schoolType,
      educationLevel: s.educationLevel,
      jenjang: s.jenjang,
      maxHonorariumLimit: s.maxHonorariumLimit,
      regionCostZone: s.regionCostZone,
      studentCount: s.studentCount,
      perStudentEstimate: s.perStudentEstimate,
      totalBosp: s.totalBosp,
      tahap1: s.tahap1,
      tahap2: s.tahap2,
      compositions: s.compositions,
    },
    updated_at: new Date().toISOString(),
  };
}

async function seedTable(tableName, schools) {
  console.log(`\nMenyinkronkan ${schools.length} sekolah ke tabel '${tableName}'...`);

  // Cek apakah tabel ada
  const checkRes = await sendSupabaseRequest({
    path: `/rest/v1/${tableName}?limit=1`,
    method: 'GET',
  });

  if (checkRes.statusCode === 404) {
    console.warn(`[Info] Tabel '${tableName}' belum dibuat di Supabase.`);
    console.warn(`Jalankan script 'supabase_schema.sql' di SQL Editor Supabase untuk membuat tabel.`);
    return false;
  }

  // Bersihkan data lama di tabel spesifik
  await sendSupabaseRequest({
    path: `/rest/v1/${tableName}?id=neq.__none__`,
    method: 'DELETE',
  });

  const BATCH_SIZE = 80;
  const totalBatches = Math.ceil(schools.length / BATCH_SIZE);
  let inserted = 0;

  for (let b = 0; b < totalBatches; b++) {
    const slice = schools.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const rows = slice.map(mapSchoolToRow);

    let retries = 3;
    let ok = false;
    while (retries > 0 && !ok) {
      try {
        const res = await sendSupabaseRequest({
          path: `/rest/v1/${tableName}`,
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: rows,
        });

        if (res.statusCode === 201) {
          inserted += rows.length;
          ok = true;
          process.stdout.write(
            `\r[${tableName}] Progress: Batch ${b + 1}/${totalBatches} (${inserted}/${schools.length} tersimpan)`
          );
        } else {
          retries--;
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch {
        retries--;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  console.log(`\n[${tableName}] Selesai: ${inserted} sekolah tersimpan.`);
  return true;
}

async function runSeed() {
  console.log('=== MEMULAI SINKRONISASI DATABASE PER JENJANG KE SUPABASE ===');
  const viteServer = await createServer({ server: { middlewareMode: true } });
  const mod = await viteServer.ssrLoadModule('/src/data/schoolsData.ts');
  const allSchools = mod.SCHOOLS_DATABASE;

  const sdSchools = allSchools.filter((s) => (s.jenjang || s.educationLevel) === 'SD');
  const smpSchools = allSchools.filter((s) => (s.jenjang || s.educationLevel) === 'SMP');
  const smaSchools = allSchools.filter((s) => (s.jenjang || s.educationLevel) === 'SMA');
  const smkSchools = allSchools.filter((s) => (s.jenjang || s.educationLevel) === 'SMK');

  console.log(`Rincian Data Terstruktur:`);
  console.log(`- SD  (Negeri & Swasta): ${sdSchools.length} sekolah`);
  console.log(`- SMP (Negeri & Swasta): ${smpSchools.length} sekolah`);
  console.log(`- SMA (Negeri & Swasta): ${smaSchools.length} sekolah`);
  console.log(`- SMK (Negeri & Swasta): ${smkSchools.length} sekolah`);

  // Coba sinkronisasi ke tabel masing-masing
  await seedTable('schools_sd', sdSchools);
  await seedTable('schools_smp', smpSchools);
  await seedTable('schools_sma', smaSchools);
  await seedTable('schools_smk', smkSchools);

  // Pastikan tabel schools utama juga tetap terisi
  await seedTable('schools', allSchools);

  console.log('\n=== SELURUH PROSES SINKRONISASI SELESAI ===');
  await viteServer.close();
}

runSeed().catch((err) => {
  console.error('Fatal error saat seeding:', err);
  process.exit(1);
});
