/**
 * Script Sinkronisasi Penuh Database Sekolah ke Supabase
 * Memasukkan seluruh data sekolah (4.112 sekolah terstruktur di 514 Kab/Kota se-Indonesia)
 * dengan perhitungan BOSP rapih, konsisten (student_count * per_student_estimate = total_bosp),
 * dan format kolom data_payload terstruktur lengkap.
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

async function runSeed() {
  console.log('=== MEMULAI SINKRONISASI DATABASE SEKOLAH KE SUPABASE ===');
  const viteServer = await createServer({ server: { middlewareMode: true } });
  const mod = await viteServer.ssrLoadModule('/src/data/schoolsData.ts');
  const allSchools = mod.SCHOOLS_DATABASE;
  console.log(`Ditemukan ${allSchools.length} sekolah terstruktur untuk disinkronkan.`);

  // 1. Bersihkan tabel sekolah lama agar tidak ada konflik constraint
  console.log('Membersihkan tabel schools lama...');
  try {
    const delRes = await sendSupabaseRequest({
      path: '/rest/v1/schools?id=neq.__none__',
      method: 'DELETE',
      headers: { Prefer: 'count=exact' },
    });
    console.log(`Pembersihan selesai: HTTP ${delRes.statusCode}`);
  } catch (err) {
    console.warn('Peringatan saat pembersihan:', err.message);
  }

  // 2. Siapkan batch data yang rapi dan terstruktur
  const BATCH_SIZE = 80;
  const totalBatches = Math.ceil(allSchools.length / BATCH_SIZE);
  let totalInserted = 0;

  for (let b = 0; b < totalBatches; b++) {
    const slice = allSchools.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const rows = slice.map((s) => ({
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
    }));

    let retries = 3;
    let ok = false;
    while (retries > 0 && !ok) {
      try {
        const res = await sendSupabaseRequest({
          path: '/rest/v1/schools',
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: rows,
        });

        if (res.statusCode === 201) {
          totalInserted += rows.length;
          ok = true;
          process.stdout.write(
            `\rProgress: Batch ${b + 1}/${totalBatches} (${totalInserted}/${allSchools.length} sekolah tersimpan)`
          );
        } else {
          console.warn(`\nBatch ${b + 1} gagal (HTTP ${res.statusCode}): ${res.data}. Mencoba ulang...`);
          retries--;
          await new Promise((r) => setTimeout(r, 1200));
        }
      } catch (err) {
        console.warn(`\nError batch ${b + 1}: ${err.message}. Mencoba ulang...`);
        retries--;
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    if (!ok) {
      console.error(`\nGagal menyimpan batch ${b + 1} setelah 3 percobaan.`);
    }
  }

  console.log(`\n=== SINKRONISASI SELESAI: ${totalInserted} SEKOLAH TERSIMPAN DI SUPABASE ===`);
  await viteServer.close();
}

runSeed().catch((err) => {
  console.error('Fatal error saat seeding:', err);
  process.exit(1);
});
