// Converte os PNGs exportados do Canva em WebP otimizado (1600x900) com o nome do slug.
// Uso: node scripts/converter-ilustracoes.mjs <pasta-dos-png>
// Mapeamento: arquivos ordenados pelo número no nome. 100 arquivos = página 1 ignorada.
// 99 arquivos = artigos 002 a 100. O artigo 001 usa a imagem do Luiz (001.png/jpg na mesma pasta, opcional).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = process.argv[2] || 'blog-conteudo/ilustracoes';
const mapa = JSON.parse(fs.readFileSync(new URL('./mapa-ilustracoes.json', import.meta.url)));
const outDir = 'blog/img';
fs.mkdirSync(outDir, { recursive: true });

const num = f => { const m = path.parse(f).name.match(/\d+/g); return m ? parseInt(m[m.length - 1], 10) : NaN; };
let files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g)$/i.test(f) && !/^001\./.test(f));
files.sort((a, b) => num(a) - num(b));
if (files.length === 100) files = files.slice(1);
if (files.length !== 99) { console.error(`Esperava 99 imagens, achei ${files.length}`); process.exit(1); }

const alvo = mapa.filter(m => m.num !== '001');
const jobs = files.map((f, i) => [path.join(dir, f), alvo[i]]);
const capa001 = fs.readdirSync(dir).find(f => /^001\.(png|jpe?g|webp)$/i.test(f));
if (capa001) jobs.unshift([path.join(dir, capa001), mapa[0]]);

for (const [src, m] of jobs) {
  const out = path.join(outDir, `${m.slug}.webp`);
  await sharp(src).resize(1600, 900, { fit: 'cover' }).webp({ quality: 80, effort: 6 }).toFile(out);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${m.num} ${path.basename(src)} -> ${out} (${kb} KB)`);
}
console.log(`OK: ${jobs.length} imagens convertidas`);
