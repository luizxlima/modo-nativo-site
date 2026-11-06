// Baixa as 10 capas exportadas do Canva e salva como blog/img/<slug>.webp (1600x900)
// Uso: node scripts/baixar-capas-161-170.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const lista = JSON.parse(fs.readFileSync(new URL('./capas-161-170-urls.json', import.meta.url), 'utf8'));
const destino = path.resolve('blog/img');
fs.mkdirSync(destino, { recursive: true });

let ok = 0, falhas = [];
for (const { num, slug, url } of lista) {
  const out = path.join(destino, `${slug}.webp`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf).resize(1600, 900, { fit: 'cover' }).webp({ quality: 82 }).toFile(out);
    ok++; console.log(`${num} ok -> ${slug}.webp`);
  } catch (e) {
    falhas.push({ num, slug, erro: e.message }); console.error(`${num} FALHOU: ${e.message}`);
  }
}
console.log(`\n${ok} capas salvas em blog/img/`);
if (falhas.length) { console.log('Falhas:', JSON.stringify(falhas, null, 1)); process.exitCode = 1; }
