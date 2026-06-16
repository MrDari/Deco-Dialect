/* Crea deco-dialect-web.zip con SOLO lo que sube a itch.io (juego web).
   Excluye node_modules, android/, www/ (pesados/regenerables). */
const { execFileSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const dest = path.join(root, 'deco-dialect-web.zip');
const ITEMS = ['index.html', 'sw.js', 'manifest.webmanifest', 'css', 'js', 'icons', 'fonts'];

const ps = `
$ErrorActionPreference='Stop';
if (Test-Path '${dest}') { Remove-Item '${dest}' }
Compress-Archive -Path ${ITEMS.map(i => `'${i}'`).join(',')} -DestinationPath '${dest}' -CompressionLevel Optimal;
`;
execFileSync('powershell', ['-NoProfile', '-Command', ps], { cwd: root, stdio: 'inherit' });
console.log('Creado:', dest);
