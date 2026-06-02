import fs from 'fs';
import path from 'path';
import { mdToPdf } from 'md-to-pdf';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const inputMd = path.join(root, 'README.md');
const outputPdf = path.join(root, 'B1-Plus-Writing-Masterpack.pdf');
const tempMd = path.join(root, '.readme-for-pdf.md');

let md = fs.readFileSync(inputMd, 'utf8');

// Expand <details> so essay tables appear in PDF
md = md.replace(
  /<details>\s*<summary><b>([\s\S]*?)<\/b><\/summary>\s*/gi,
  '\n\n#### $1\n\n'
);
md = md.replace(/<\/details>/gi, '\n');

// GitHub alert boxes → styled HTML blocks
const alertTypes = {
  TIP: { bg: '#dbeafe', border: '#2563eb', label: '💡 TIP' },
  IMPORTANT: { bg: '#fef3c7', border: '#d97706', label: '⭐ ÖNEMLİ' },
  WARNING: { bg: '#fee2e2', border: '#dc2626', label: '⚠️ UYARI' },
  CAUTION: { bg: '#f3e8ff', border: '#7c3aed', label: '🔀 DİKKAT' },
  NOTE: { bg: '#d1fae5', border: '#059669', label: '📝 NOT' },
};

md = md.replace(
  /> \[!(TIP|IMPORTANT|WARNING|CAUTION|NOTE)\]\s*\n((?:> .*\n?)+)/gi,
  (_, type, body) => {
    const style = alertTypes[type.toUpperCase()];
    const text = body
      .split('\n')
      .map((line) => line.replace(/^> ?/, ''))
      .join('\n')
      .trim();
    return `\n<div class="alert alert-${type.toLowerCase()}" style="background:${style.bg};border-left:4px solid ${style.border};padding:12px 16px;margin:16px 0;border-radius:6px;">
<strong>${style.label}</strong><br/><br/>
${text}
</div>\n\n`;
  }
);

// Remove center div wrappers (keep content)
md = md.replace(/<div align="center">\s*/gi, '\n');
md = md.replace(/<\/div>\s*/gi, '\n');

// Mermaid → simple text note for PDF
md = md.replace(/```mermaid[\s\S]*?```/gi, '\n> *Şema: Cause = WHY · Effect = SO WHAT · Opinion = I BELIEVE*\n');

fs.writeFileSync(tempMd, md, 'utf8');

const css = `
@page {
  margin: 18mm 15mm;
  size: A4;
}
body {
  font-family: 'DejaVu Sans', 'Noto Sans', 'Segoe UI', Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.45;
  color: #1e293b;
  max-width: 100%;
}
h1 {
  color: #1e3a8a;
  font-size: 22pt;
  border-bottom: 3px solid #2563eb;
  padding-bottom: 8px;
  page-break-after: avoid;
}
h2 {
  color: #1d4ed8;
  font-size: 14pt;
  margin-top: 22px;
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 4px;
  page-break-after: avoid;
}
h3 {
  color: #334155;
  font-size: 12pt;
  page-break-after: avoid;
}
h4 {
  color: #475569;
  font-size: 11pt;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0 16px;
  font-size: 9pt;
  page-break-inside: auto;
}
tr { page-break-inside: avoid; page-break-after: auto; }
th {
  background: #2563eb;
  color: white;
  padding: 6px 8px;
  text-align: left;
}
td {
  border: 1px solid #cbd5e1;
  padding: 5px 7px;
  vertical-align: top;
}
tr:nth-child(even) td { background: #f8fafc; }
blockquote {
  border-left: 4px solid #94a3b8;
  margin: 12px 0;
  padding: 8px 14px;
  background: #f1f5f9;
  color: #334155;
}
code {
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 9pt;
}
pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 6px;
  font-size: 8.5pt;
  overflow-x: auto;
}
a { color: #2563eb; text-decoration: none; }
img { max-width: 100%; }
.alert { page-break-inside: avoid; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
`;

const pdf = await mdToPdf(
  { path: tempMd },
  {
    dest: outputPdf,
    css,
    pdf_options: {
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
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
console.log(`PDF created: ${outputPdf} (${(stats.size / 1024).toFixed(1)} KB)`);
