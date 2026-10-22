const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const dest = path.join(root, 'dist');
fs.mkdirSync(dest, { recursive: true });
for (const name of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons']) {
  fs.cpSync(path.join(root, name), path.join(dest, name), { recursive: true });
}
console.log('Packaged Bloomora public assets into dist/.');
