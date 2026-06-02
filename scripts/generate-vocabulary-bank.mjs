/**
 * AYSTECH — Gaziantep Üniversitesi B1+ Writing Kelime Bankası üretici
 * Oxford English File / Inside Reading uyumlu
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sectors } from './vocab-sectors.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outMd = path.join(root, 'AYSTECH-Vocabulary-Bank.md');

const levelOrder = { A2: 0, B1: 1, 'B1+': 2 };
let total = 0;
const levelCounts = { A2: 0, B1: 0, 'B1+': 0 };

for (const sector of sectors) {
  total += sector.words.length;
  for (const w of sector.words) levelCounts[w.level] = (levelCounts[w.level] || 0) + 1;
}

const header = `# AYSTECH Kelime Bankası

**Gaziantep Üniversitesi · Oxford English File & Inside Reading · Writing (A2 / B1 / B1+)**

| Bilgi | Değer |
|-------|--------|
| **Toplam kelime** | **${total}** |
| A2 | ${levelCounts.A2 || 0} |
| B1 | ${levelCounts.B1 || 0} |
| B1+ | ${levelCounts['B1+'] || 0} |
| Kullanım | Cause / Effect / Opinion essay |
| PDF | \`npm run build:pdf:aystech\` → \`aystech-vocabulary-bank.pdf\` |

---

## İçindekiler (sektörler)

`;

let toc = '';
sectors.forEach((s, i) => {
  toc += `${i + 1}. [${s.titleTr}](#${s.anchor}) — *${s.titleEn}*\n`;
});

const levelGuide = `## Seviye rehberi

| Seviye | Ne zaman kullan? |
|--------|------------------|
| **A2** | Temel cümleler, günlük konular |
| **B1** | Paragraf yazımı, sınav essay |
| **B1+** | Formal essay, tartışma, akademik ton |

---

`;

let body = '';
for (const sector of sectors) {
  const words = [...sector.words].sort(
    (a, b) => (levelOrder[a.level] ?? 1) - (levelOrder[b.level] ?? 1)
  );
  body += `## ${sector.titleTr} {#${sector.anchor}}\n\n`;
  body += `*${sector.titleEn} · ${words.length} kelime*\n\n`;
  body += `| # | Kelime (EN) | Türkçe | Seviye | Örnek (İngilizce) | Örnek (Türkçe) |\n`;
  body += `|---|-------------|--------|:------:|-------------------|----------------|\n`;
  words.forEach((w, i) => {
    const exEn = w.exEn.replace(/\|/g, '/');
    const exTr = w.exTr.replace(/\|/g, '/');
    body += `| ${i + 1} | **${w.en}** | ${w.tr} | ${w.level} | ${exEn} | ${exTr} |\n`;
  });
  body += '\n---\n\n';
}

const footer = `\n*AYSTECH · Gaziantep Üniversitesi · ${total} kelime · Writing kelime bankası*\n`;

fs.writeFileSync(outMd, header + toc + '\n---\n\n' + levelGuide + body + footer, 'utf8');
console.log(`Generated ${outMd}`);
console.log(`Total words: ${total} (A2: ${levelCounts.A2}, B1: ${levelCounts.B1}, B1+: ${levelCounts['B1+']})`);

if (total < 500) {
  console.error(`ERROR: Only ${total} words, need at least 500`);
  process.exit(1);
}
