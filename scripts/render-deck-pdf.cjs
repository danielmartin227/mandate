// Renders the authored deck at presentation/final-deck.html to a paged PDF via
// headless Edge, then publishes both files into public/ so the deployed site
// serves them at /deck.pdf and /deck.html with no third-party viewer in
// between. The HTML is the source of truth for the deck; presentation/
// final-deck.md is kept only as the written record of the narrative.
// Usage: node scripts/render-deck-pdf.cjs
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const src = path.resolve('presentation/final-deck.html');
const out = path.resolve('presentation/final-deck.pdf');

const edge = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find(p => fs.existsSync(p));
if (!edge) throw new Error('Edge not found');

// The deck loads Inter and JetBrains Mono from Google Fonts. Without a virtual
// time budget the print can fire before the webfonts arrive and the PDF falls
// back to a system face, so give the page room to settle first.
execFileSync(edge, [
  '--headless', '--disable-gpu', '--no-pdf-header-footer',
  '--virtual-time-budget=10000',
  `--print-to-pdf=${out}`, 'file:///' + src.split('\\').join('/'),
], { stdio: 'inherit' });
console.log('wrote', out, fs.statSync(out).size, 'bytes');

// Files under public/ are served from the deployment root, so these land on
// /deck.pdf and /deck.html. The same HTML is both the print source and the
// scrollable web version: on screen the slides simply stack.
const pub = path.resolve('public');
fs.mkdirSync(pub, { recursive: true });

for (const [from, to] of [[out, 'deck.pdf'], [src, 'deck.html']]) {
  const dest = path.join(pub, to);
  fs.copyFileSync(from, dest);
  console.log('wrote', dest, fs.statSync(dest).size, 'bytes');
}
