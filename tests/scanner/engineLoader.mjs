import { build } from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Bundel modul TS (engine + data sekolah) menjadi ESM Node sementara agar bisa diuji tanpa browser.
export async function loadEngine() {
  const outfile = path.join(os.tmpdir(), `daradik-scanner-engine-${process.pid}.mjs`);
  const entry = path.join(os.tmpdir(), `daradik-scanner-entry-${process.pid}.ts`);
  fs.writeFileSync(
    entry,
    `export { analyzeDirectTextMessage } from ${JSON.stringify(path.join(ROOT, 'src/features/wa-scanner/engine/bospLegalMatcher.ts').replace(/\\/g, '/'))};\n` +
      `export { SMK_TI_BAZMA } from ${JSON.stringify(path.join(ROOT, 'src/data/bazmaSchoolData.ts').replace(/\\/g, '/'))};\n` +
      (fs.existsSync(path.join(ROOT, 'src/features/wa-scanner/engine/aiJudge.ts'))
        ? `export * from ${JSON.stringify(path.join(ROOT, 'src/features/wa-scanner/engine/aiJudge.ts').replace(/\\/g, '/'))};\n`
        : '')
  );
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'error',
    alias: { '@': path.join(ROOT, 'src') },
  });
  return import(pathToFileURL(outfile).href + `?t=${Date.now()}`);
}

export function schoolCtx(school, overrides = {}) {
  return {
    schoolName: school.name,
    studentCount: school.studentCount,
    schoolType: overrides.schoolType || 'Negeri',
    educationLevel: school.educationLevel,
    totalBosp: school.totalBosp,
    compositions: school.compositions,
    tahap1Compositions: school.tahap1Compositions,
    tahap2Compositions: school.tahap2Compositions,
  };
}
