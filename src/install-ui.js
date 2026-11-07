import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const UI_COMPONENTS = Object.freeze(['writing-field', 'dialog', 'combobox', 'dropdown', 'drawer', 'data-table']);
const registryRoot = new URL('../registry/', import.meta.url);
const sha256 = (content) => createHash('sha256').update(content, 'utf8').digest('hex');
const safeFile = (name) => typeof name === 'string' && name.length <= 240 && name.split('/').every((part) => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(part)) && !name.includes('\\') && !name.includes(':');

/** Validate the complete bundled payload before creating an output directory. */
export function validateUIBlock(block, expectedName = block?.name) {
  if (!block || !UI_COMPONENTS.includes(expectedName) || block.name !== expectedName || block.type !== 'registry:block' || !Array.isArray(block.files) || !block.files.length || block.files.length > 256) throw new Error('Invalid bundled UI block.');
  if (block.dependencies?.length || block.devDependencies?.length || block.registryDependencies?.length) throw new Error('Offline UI blocks cannot require package installation.');
  const paths = new Set(); let bytes = 0;
  for (const file of block.files) {
    if (!safeFile(file.path) || file.target !== file.path) throw new Error('Unsafe registry file path.');
    const normalized = file.path.toLowerCase();
    if (paths.has(normalized)) throw new Error('Registry file collision.');
    paths.add(normalized);
    if (typeof file.content !== 'string' || typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(file.sha256) || sha256(file.content) !== file.sha256) throw new Error('Registry content hash mismatch.');
    bytes += Buffer.byteLength(file.content);
    if (Buffer.byteLength(file.content) > 2_000_000 || bytes > 10_000_000) throw new Error('Registry block exceeds the offline size limit.');
  }
  for (const filename of paths) {
    const parts = filename.split('/');
    for (let index = 1; index < parts.length; index++) if (paths.has(parts.slice(0, index).join('/'))) throw new Error('Registry file and directory collision.');
  }
  if (!paths.has('index.html') || !paths.has('server.mjs')) throw new Error('UI blocks need a standalone page and local preview server.');
  return block;
}
async function inspect(filename) {
  try { return await lstat(filename); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function outputParts(dir) {
  if (typeof dir !== 'string' || !dir.trim() || /[\0-\x1f\x7f]/.test(dir)) throw new Error('Choose a new relative output directory with --dir ./my-ui.');
  if (path.isAbsolute(dir) || path.win32.isAbsolute(dir) || dir.includes(':')) throw new Error('Output must be a relative directory inside the current working directory.');
  const parts = dir.replaceAll('\\', '/').split('/').filter((part) => part && part !== '.');
  if (!parts.length || parts.includes('..')) throw new Error('Output traversal and the current directory are not allowed.');
  return parts;
}

/** Install only local, allowlisted source files. No network, subprocess, or dependency install. */
export async function installUI({ component, dir, cwd = process.cwd() } = {}) {
  if (!UI_COMPONENTS.includes(component)) throw new Error('Unknown UI component. Choose: ' + UI_COMPONENTS.join(', ') + '.');
  const parts = outputParts(dir), source = new URL(`${component}.json`, registryRoot);
  const sourceInfo = await lstat(source);
  if (!sourceInfo.isFile() || sourceInfo.isSymbolicLink()) throw new Error('UI registry snapshots must be ordinary bundled files.');
  const block = validateUIBlock(JSON.parse(await readFile(source, 'utf8')), component);
  const base = await realpath(cwd), destination = path.join(base, ...parts);
  let cursor = base;
  for (let index = 0; index < parts.length; index++) {
    cursor = path.join(cursor, parts[index]); const info = await inspect(cursor);
    if (info?.isSymbolicLink()) throw new Error('Output paths cannot contain symbolic links.');
    if (info && index === parts.length - 1) throw new Error('Output already exists; choose a new directory. Nothing was overwritten.');
    if (info && !info.isDirectory()) throw new Error('An output parent is not a directory.');
  }
  cursor = base;
  for (const part of parts.slice(0, -1)) {
    cursor = path.join(cursor, part);
    try { await mkdir(cursor); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    const info = await lstat(cursor);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Output parents must be ordinary directories.');
  }
  try { await mkdir(destination); } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Output already exists; choose a new directory. Nothing was overwritten.');
    throw error;
  }
  try {
    for (const file of block.files) {
      const target = path.join(destination, ...file.path.split('/'));
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, file.content, { flag: 'wx' });
    }
  } catch (error) { await rm(destination, { recursive: true, force: true }); throw error; }
  return { component, directory: destination, files: block.files.length, version: block.meta?.version };
}
