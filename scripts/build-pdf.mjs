import fs from 'fs';
import path from 'path';
import { mdToPdf } from 'md-to-pdf';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const inputMd = path.resolve(root, process.argv[2] || 'README.md');
const outputPdf = path.resolve(
  root,
  process.argv[3] ||
    (inputMd.includes('AYSTECH') ? 'aystech-vocabulary-bank.pdf' : 'B1-Plus-Writing-Masterpack.pdf')
);
const tempMd = path.join(root, `.pdf-temp-${path.basename(inputMd)}`);
const isVocabBank = /AYSTECH|vocabulary/i.test(inputMd);

/** Strip decorative emoji (keep Turkish/English letters). */
function stripEmoji(text) {
  return text
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
      ''
    )
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function toPlainDocument(md) {
  // Expand <details>
  md = md.replace(
    /<details>\s*<summary>(?:<b>)?([\s\S]*?)(?:<\/b>)?<\/summary>\s*/gi,
    '\n\n### $1\n\n'
  );
  md = md.replace(/<\/details>/gi, '\n');

  // GitHub alerts → plain labelled paragraph
  md = md.replace(
    /> \[!(TIP|IMPORTANT|WARNING|CAUTION|NOTE)\]\s*\n((?:> .*\n?)+)/gi,
    (_, type, body) => {
      const text = body
        .split('\n')
        .map((line) => line.replace(/^> ?/, ''))
        .join(' ')
        .replace(/\*\*/g, '')
        .trim();
      const label = { TIP: 'IPUCU', IMPORTANT: 'ONEMLI', WARNING: 'UYARI', CAUTION: 'DIKKAT', NOTE: 'NOT' }[type] || type;
      return `\n\n${label}: ${text}\n\n`;
    }
  );

  // Remove badge / image markdown
  md = md.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

  // Remove HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Mermaid → one plain line
  md = md.replace(
    /```mermaid[\s\S]*?```/gi,
    '\nCause = WHY | Effect = SO WHAT | Opinion = I BELIEVE\n'
  );

  // Markdown links → text only (document style)
  md = md.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove PDF build line from output doc
  md = md.replace(/^📄.*build:pdf.*\n/gm, '');

  // Horizontal rules → blank line
  md = md.replace(/^---+\s*$/gm, '\n');

  // Code fences for flowchart blocks → plain
  md = md.replace(/```[\w]*\n[\s\S]*?```/g, (block) => {
    if (block.includes('flowchart')) return '\n';
    return block;
  });

  // Line-by-line emoji cleanup in headings
  md = md
    .split('\n')
    .map((line) => {
      if (/^#{1,6}\s/.test(line)) return stripEmoji(line);
      return line;
    })
    .join('\n');

  // Collapse excessive blank lines
  md = md.replace(/\n{4,}/g, '\n\n\n');

  if (isVocabBank) {
    const header = `AYSTECH
Gaziantep Universitesi Ingilizce Yazma Kelime Bankasi
Oxford English File / Inside Reading
A2 | B1 | B1+

---

`;
    return header + md.trim() + '\n';
  }

  const header = `B1+ Yazma Sinavi Rehberi
Cause, Effect ve Opinion Essay

---

`;
  return header + md.trim() + '\n';
}

const plainMd = toPlainDocument(fs.readFileSync(inputMd, 'utf8'));
fs.writeFileSync(tempMd, plainMd, 'utf8');

const css = `
@page {
  size: A4;
  margin: 20mm 18mm;
}
* {
  box-shadow: none !important;
  text-shadow: none !important;
}
body {
  font-family: Arial, Helvetica, "Liberation Sans", sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #000;
  background: #fff;
}
h1 {
  font-size: 18pt;
  font-weight: bold;
  margin: 0 0 12pt 0;
  color: #000;
  border: none;
  page-break-after: avoid;
}
h2 {
  font-size: 14pt;
  font-weight: bold;
  margin: 18pt 0 8pt 0;
  color: #000;
  border: none;
  page-break-after: avoid;
}
h3 {
  font-size: 12pt;
  font-weight: bold;
  margin: 14pt 0 6pt 0;
  color: #000;
  page-break-after: avoid;
}
h4 {
  font-size: 11pt;
  font-weight: bold;
  margin: 12pt 0 4pt 0;
  color: #000;
}
p {
  margin: 0 0 8pt 0;
  text-align: left;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 8pt 0 12pt 0;
  font-size: ${isVocabBank ? '7.5pt' : '10pt'};
}
th, td {
  border: 1px solid #000;
  padding: 4pt 6pt;
  vertical-align: top;
  text-align: left;
  background: #fff !important;
  color: #000 !important;
}
th {
  font-weight: bold;
}
tr:nth-child(even) td {
  background: #fff !important;
}
blockquote {
  margin: 8pt 0 8pt 12pt;
  padding: 0;
  border: none;
  background: none;
  color: #000;
  font-style: normal;
}
code {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10pt;
  background: none;
  padding: 0;
}
pre {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10pt;
  background: none;
  color: #000;
  border: none;
  padding: 0;
  margin: 8pt 0;
  white-space: pre-wrap;
}
a {
  color: #000;
  text-decoration: none;
}
img {
  display: none !important;
}
hr {
  display: none;
}
ul, ol {
  margin: 0 0 8pt 0;
  padding-left: 18pt;
}
li {
  margin-bottom: 4pt;
}
`;

const pdf = await mdToPdf(
  { path: tempMd },
  {
    dest: outputPdf,
    css,
    pdf_options: {
      format: 'A4',
      printBackground: false,
      margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
    },
    launch_options: {
      executablePath: '/usr/local/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  }
);

if (!pdf) {
  console.error('PDF generation failed');
  process.exit(1);
}

const stats = fs.statSync(outputPdf);
console.log(`Plain PDF: ${outputPdf} (${(stats.size / 1024).toFixed(1)} KB)`);
