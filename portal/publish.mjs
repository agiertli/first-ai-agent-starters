// Stage a tested static build for GitHub Pages. No tokens or .env files are used.
import { readFile, writeFile, readdir, mkdir, rm, cp, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const source = fileURLToPath(new URL('./frontend/dist/', import.meta.url));
const target = fileURLToPath(new URL('../docs/', import.meta.url));
await access(join(source, 'index.html'));
await access(join(target, '.workshop-site')); // Refuse to replace unrelated content.
const files = {};
async function inspect(folder) {
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, item.name);
    if (item.isDirectory()) await inspect(path);
    else {
      if (item.name.startsWith('.env') || item.name.endsWith('.map')) throw new Error('Unexpected private file or source map in build');
      const data = await readFile(path);
      if (item.name.endsWith('.js') && (data.includes('/api/config') || data.includes('/api/workshop/run'))) throw new Error('Build contains a portal-backend dependency; use static mode');
      files[relative(source, path)] = createHash('sha256').update(data).digest('hex');
    }
  }
}
await inspect(source);
await rm(target, { recursive: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
await writeFile(join(target, '.workshop-site'), 'Generated static workshop. Source: portal/\n');
await writeFile(join(target, '.nojekyll'), '');
await writeFile(join(target, 'build-manifest.json'), JSON.stringify({ built_at: new Date().toISOString(), runtime: 'browser-only', files }, null, 2) + '\n');
console.log(`Staged ${Object.keys(files).length} public files in docs/. Review, commit and push to deploy.`);
