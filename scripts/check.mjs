import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
async function walk(dir) {
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    if (['node_modules','.git','downloads'].includes(entry.name)) continue;
    const filename=path.join(dir,entry.name);
    if (entry.isDirectory()) await walk(filename);
    else if (/\.(?:js|mjs)$/.test(entry.name)) {
      const result=spawnSync(process.execPath,['--check',filename],{encoding:'utf8'});
      if (result.status !== 0) throw new Error(result.stderr);
    }
  }
}
await walk(root);
console.log('All JavaScript syntax checks passed.');
