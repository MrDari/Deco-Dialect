/* Copia los archivos web (fuente única para itch.io) a www/ para Capacitor/Android.
   Así mantienes UN solo código y ambos destinos quedan siempre sincronizados. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');

const FILES = ['index.html', 'manifest.webmanifest', 'sw.js'];
const DIRS = ['css', 'js', 'icons', 'fonts'];

function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

rmrf(out);
fs.mkdirSync(out, { recursive: true });
for (const f of FILES) {
  const s = path.join(root, f);
  if (fs.existsSync(s)) fs.copyFileSync(s, path.join(out, f));
}
for (const d of DIRS) {
  const s = path.join(root, d);
  if (fs.existsSync(s)) copyDir(s, path.join(out, d));
}
console.log('www/ sincronizado desde la raíz.');
