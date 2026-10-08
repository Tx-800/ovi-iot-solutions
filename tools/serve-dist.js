/* ==========================================================================
   serve-dist.js — serve dist/ the way a host will: security headers applied,
   a real 404 status with 404.html, and no .html -> clean-URL redirect.

   For checking the Content-Security-Policy and 404 routing before deploying;
   `npx serve .` does neither. Headers are read from whichever host file is in
   dist/ or the repo root (_headers, vercel.json or .htaccess). No
   dependencies — Node's http module only.

   Usage:
     node tools/build-dist.js --preview && node tools/serve-dist.js   # http://localhost:4322
   ========================================================================== */

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 4322);

if (!existsSync(DIST)) {
  console.error('serve-dist: no dist/ — run: node tools/build-dist.js --preview');
  process.exit(1);
}

function hostHeaders() {
  const at = (f) => [join(DIST, f), join(ROOT, f)].find(existsSync);
  const h = at('_headers');
  if (h) {
    return readFileSync(h, 'utf8').split('\n').filter((l) => /^\s+[\w-]+:/.test(l))
      .map((l) => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; });
  }
  const v = at('vercel.json');
  if (v) return JSON.parse(readFileSync(v, 'utf8')).headers[0].headers.map((x) => [x.key, x.value]);
  const a = at('.htaccess');
  if (a) return [...readFileSync(a, 'utf8').matchAll(/Header always set ([\w-]+) "([^"]*)"/g)].map((m) => [m[1], m[2]]);
  return [];
}
const HEADERS = hostHeaders();

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = normalize(join(DIST, path));
  if (!file.startsWith(DIST)) { res.writeHead(400).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  let status = 200;
  if (!existsSync(file) || /(^|[\\/])(_headers|\.htaccess)$/.test(file)) { file = join(DIST, '404.html'); status = 404; }
  for (const [k, v] of HEADERS) res.setHeader(k, v);
  res.writeHead(status, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(PORT, () => {
  console.log(`serve-dist: http://localhost:${PORT}  (${HEADERS.length} host header(s) applied)`);
});
