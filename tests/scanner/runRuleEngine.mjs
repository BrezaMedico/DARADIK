import { CORPUS } from './corpus.mjs';
import { HELD_OUT } from './corpusHeldOut.mjs';
import { loadEngine, schoolCtx } from './engineLoader.mjs';

const engine = await loadEngine();
const school = engine.SMK_TI_BAZMA;
const verbose = process.argv.includes('--verbose');
const cases = process.argv.includes('--all') ? [...CORPUS, ...HELD_OUT] : process.argv.includes('--heldout') ? HELD_OUT : CORPUS;

let ok = 0;
const fails = [];
for (const c of cases) {
  const ctx = schoolCtx(school);
  const r = engine.analyzeDirectTextMessage(c.text, school.items, school.name, school.studentCount, ctx);
  const got = r.statusType === 'danger' ? 'pungli' : 'bukan';
  const pass = got === c.expect;
  if (pass) ok++;
  else fails.push({ id: c.id, cat: c.cat, expect: c.expect, got, title: r.statusTitle, text: c.text.slice(0, 90) });
  if (verbose) console.log(`${pass ? 'OK  ' : 'FAIL'} ${c.id} exp=${c.expect} got=${got} :: ${r.statusTitle}`);
}
console.log(`\nRULE ENGINE: ${ok}/${cases.length} benar (${((ok / cases.length) * 100).toFixed(1)}%)`);
for (const f of fails) console.log(`  ✗ ${f.id} [${f.cat}] harusnya ${f.expect}, dapat ${f.got} — ${f.title}\n      "${f.text}…"`);
