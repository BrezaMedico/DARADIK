import { getAiClient } from '../../server/config.js';

const ai = getAiClient();
const models = process.argv.slice(2);
for (const model of models) {
  const t0 = Date.now();
  try {
    const r = await ai.models.generateContent({
      model,
      contents: 'Balas hanya satu kata: halo',
      config: { thinkingConfig: { thinkingLevel: 'high' } },
    });
    console.log(`OK   ${model} (${Date.now() - t0}ms, thinking=high): ${(r.text || '').trim().slice(0, 40)}`);
  } catch (e) {
    let msg = String(e?.message || e).replace(/\s+/g, ' ');
    const lim = msg.match(/limit: (\d+), model: ([\w.-]+)/);
    console.log(`FAIL ${model}: ${msg.slice(0, 160)}${lim ? ` | free-tier limit=${lim[1]}` : ''}`);
    try {
      const r2 = await ai.models.generateContent({ model, contents: 'Balas hanya satu kata: halo' });
      console.log(`  OK without thinking: ${(r2.text || '').trim().slice(0, 30)}`);
    } catch (e2) {
      console.log(`  FAIL without thinking: ${String(e2?.message || e2).replace(/\s+/g, ' ').slice(0, 140)}`);
    }
  }
}

