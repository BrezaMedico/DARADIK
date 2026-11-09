import { CORPUS } from './corpus.mjs';
import { HELD_OUT } from './corpusHeldOut.mjs';
import { loadEngine } from './engineLoader.mjs';
import { handleScanJudge } from '../../server/scanJudgeService.js';

const engine = await loadEngine();
const school = engine.SMK_TI_BAZMA;
const useHeldOut = process.argv.includes('--heldout');
const all = process.argv.includes('--all');
const cases = all ? [...CORPUS, ...HELD_OUT] : useHeldOut ? HELD_OUT : CORPUS;

const schoolPayload = {
  name: school.name,
  schoolType: 'Negeri',
  educationLevel: school.educationLevel,
  studentCount: school.studentCount,
  items: school.items.map((i) => ({ code: i.code, name: i.name, amount: i.amount, stage: i.stage, allocation: i.allocation })),
  compositions: (school.compositions || []).map((c) => ({ label: c.label, amount: c.amount })),
};

async function mapLimit(list, limit, fn) {
  const out = new Array(list.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < list.length) {
        const i = next++;
        out[i] = await fn(list[i], i);
      }
    })
  );
  return out;
}

const results = await mapLimit(cases, 5, async (c) => {
  const t0 = Date.now();
  const res = await handleScanJudge({ text: c.text, school: schoolPayload }, `test-${c.id}`);
  return { c, res, ms: Date.now() - t0 };
});

let ok = 0;
const fails = [];
for (const { c, res, ms } of results) {
  if (res.status !== 200) {
    fails.push({ id: c.id, why: `HTTP ${res.status} ${res.payload?.error}`, exp: c.expect });
    continue;
  }
  const j = res.payload.judgement;
  const got = j.verdict === 'PUNGLI' ? 'pungli' : 'bukan';
  if (got === c.expect) ok++;
  else fails.push({ id: c.id, exp: c.expect, got, cat: j.category, conf: j.confidence, why: j.alasan, text: c.text.slice(0, 100) });
}
const avgMs = Math.round(results.reduce((a, r) => a + r.ms, 0) / results.length);
console.log(`\nAI JUDGE: ${ok}/${cases.length} benar (${((ok / cases.length) * 100).toFixed(1)}%), rata-rata ${avgMs} ms, model ${results.find((r) => r.res.payload?.model)?.res.payload.model}`);
for (const f of fails) console.log(`  ✗ ${f.id} harusnya ${f.exp}, dapat ${f.got ?? ''} [${f.cat ?? ''} ${f.conf ?? ''}] ${f.why}\n      "${f.text ?? ''}"`);

