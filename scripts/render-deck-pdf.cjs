// Renders presentation/final-deck.md to a paged PDF via headless Edge, then
// publishes both the PDF and a scrollable HTML version into public/ so the
// deployed site serves them directly (no third-party PDF viewer in between).
// Usage: node scripts/render-deck-pdf.cjs
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

// Becomes the PDF's internal /Title, which is the text a reader sees in the
// browser tab. Without an explicit <title> the print engine falls back to the
// temp file name, so this must stay in sync with the deck itself.
const DECK_TITLE = 'Mandate - Final Submission Deck';

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

const bodies = slides.map(render);

const html = `<!doctype html><meta charset="utf-8"><title>${esc(DECK_TITLE)}</title><style>
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
</style>` + bodies.map(b => `<section>${b}</section>`).join('');

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

// Publish into the Next.js static directory: files under public/ are served
// from the deployment root, so these land on /deck.pdf and /deck.html.
const pub = path.resolve('public');
fs.mkdirSync(pub, { recursive: true });

const pdfCopy = path.join(pub, 'deck.pdf');
fs.copyFileSync(out, pdfCopy);
console.log('wrote', pdfCopy, fs.statSync(pdfCopy).size, 'bytes');

// Same slides, stacked as a scrollable page for readers who would rather not
// open a PDF. Slides become auto-height cards instead of fixed 720px pages.
const page = `<!doctype html><html lang="en"><meta charset="utf-8">
<title>${esc(DECK_TITLE)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* { box-sizing:border-box; }
body { margin:0; padding:32px 16px 64px; background:#eef1f5; color:#10233a;
  font-family:"Segoe UI", Arial, sans-serif; }
.wrap { max-width:1000px; margin:0 auto; }
.bar { display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-bottom:24px; font-size:15px; }
.bar a { color:#0b3b6f; font-weight:600; text-decoration:none; }
.bar a:hover { text-decoration:underline; }
section { background:#fff; border-radius:12px; padding:40px 44px; margin-bottom:24px;
  box-shadow:0 1px 4px rgba(16,35,58,0.10); }
h1 { font-size:36px; margin:0 0 16px; letter-spacing:-0.5px; }
h2 { font-size:27px; margin:0 0 18px; color:#0b3b6f; }
h3 { font-size:21px; margin:0 0 12px; color:#0b3b6f; }
p { font-size:17px; line-height:1.6; margin:0 0 12px; }
li { font-size:17px; line-height:1.6; margin-bottom:8px; }
ul, ol { margin:0 0 12px; padding-left:24px; }
code { font-family:Consolas, monospace; font-size:15px; background:#eef2f7; padding:1px 5px; border-radius:3px; }
.scroll { overflow-x:auto; }
table { border-collapse:collapse; width:100%; margin:8px 0 12px; }
th, td { border:1px solid #c8d4e2; padding:8px 11px; font-size:15px; text-align:left; vertical-align:top; }
th { background:#0b3b6f; color:#fff; font-weight:600; }
strong { color:#0b3b6f; }
@media (max-width:600px) { section { padding:28px 20px; } h1 { font-size:28px; } h2 { font-size:22px; } }
</style>
<div class="wrap">
<div class="bar"><a href="/">&larr; Mandate</a><span>&middot;</span><a href="/deck.pdf">Download PDF</a></div>
${bodies.map(b => `<section>${b.split('<table>').join('<div class="scroll"><table>').split('</table>').join('</table></div>')}</section>`).join('\n')}
</div>
</html>`;

const htmlCopy = path.join(pub, 'deck.html');
fs.writeFileSync(htmlCopy, page);
console.log('wrote', htmlCopy, fs.statSync(htmlCopy).size, 'bytes');
