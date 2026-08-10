// Renders presentation/final-deck.md to a paged PDF via headless Edge.
// Usage: node scripts/render-deck-pdf.cjs
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const md = fs.readFileSync('presentation/final-deck.md', 'utf8');
const slides = md.split(/\n---\n/).map(s => s.trim()).filter(Boolean);

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Minimal markdown: headings, tables, lists, bold, inline code, plain paragraphs.
function render(block) {
  const lines = block.split('\n');
  let out = '', i = 0;
  const inline = t => esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  while (i < lines.length) {
    const l = lines[i];
    if (/^#{1,3} /.test(l)) {
      const lvl = l.match(/^#+/)[0].length;
      out += `<h${lvl}>${inline(l.replace(/^#+ /, ''))}</h${lvl}>`; i++;
    } else if (/^\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = r => r.split('|').slice(1, -1).map(c => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out += '<table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' +
        body.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table>';
    } else if (/^(\d+\.|-) /.test(l)) {
      const ordered = /^\d+\./.test(l);
      const items = [];
      while (i < lines.length && /^(\d+\.|-) /.test(lines[i])) items.push(lines[i++].replace(/^(\d+\.|-) /, ''));
      const tag = ordered ? 'ol' : 'ul';
      out += `<${tag}>` + items.map(t => `<li>${inline(t)}</li>`).join('') + `</${tag}>`;
    } else if (l.trim() === '') { i++; }
    else { out += `<p>${inline(l)}</p>`; i++; }
  }
  return out;
}

const html = `<!doctype html><meta charset="utf-8"><style>
@page { size: 1280px 720px; margin: 0; }
* { box-sizing: border-box; }
body { margin:0; font-family: "Segoe UI", Arial, sans-serif; color:#10233a; }
section { width:1280px; height:720px; padding:64px 76px; page-break-after:always; overflow:hidden; background:#fff; }
section:last-child { page-break-after:auto; }
h1 { font-size:52px; margin:0 0 18px; letter-spacing:-0.5px; }
h2 { font-size:38px; margin:0 0 22px; color:#0b3b6f; }
p { font-size:21px; line-height:1.5; margin:0 0 14px; }
li { font-size:20px; line-height:1.5; margin-bottom:9px; }
ul, ol { margin:0 0 14px; padding-left:26px; }
code { font-family:Consolas, monospace; font-size:17px; background:#eef2f7; padding:1px 5px; border-radius:3px; }
table { border-collapse:collapse; width:100%; margin:8px 0 14px; }
th, td { border:1px solid #c8d4e2; padding:8px 11px; font-size:17px; text-align:left; vertical-align:top; }
th { background:#0b3b6f; color:#fff; font-weight:600; }
strong { color:#0b3b6f; }
</style>` + slides.map(s => `<section>${render(s)}</section>`).join('');

const tmp = path.resolve('presentation/.deck-render.html');
fs.writeFileSync(tmp, html);

const edge = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find(p => fs.existsSync(p));
if (!edge) throw new Error('Edge not found');

const out = path.resolve('presentation/final-deck.pdf');
execFileSync(edge, [
  '--headless', '--disable-gpu', '--no-pdf-header-footer',
  `--print-to-pdf=${out}`, 'file:///' + tmp.split('\\').join('/'),
], { stdio: 'inherit' });
fs.unlinkSync(tmp);
console.log('wrote', out, fs.statSync(out).size, 'bytes');
