import { lstat, mkdir, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEMPLATES = Object.freeze(['blog','docs','portfolio','community']);
const templateRoot = fileURLToPath(new URL('../templates/', import.meta.url));

async function inspect(filename) {
  try { return await lstat(filename); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function outputParts(dir) {
  if (typeof dir !== 'string' || !dir.trim() || dir.includes('\0')) throw new Error('Choose a new output directory with --dir ./my-site.');
  if (path.isAbsolute(dir) || path.win32.isAbsolute(dir) || dir.includes(':')) throw new Error('Output must be a relative directory inside the current working directory.');
  const parts = dir.replaceAll('\\','/').split('/').filter((part) => part !== '' && part !== '.');
  if (!parts.length || parts.some((part) => part === '..')) throw new Error('Output traversal and the current directory are not allowed.');
  return parts;
}
async function copyTree(source, destination) {
  const entries = await readdir(source, {withFileTypes:true});
  for (const entry of entries) {
    const from=path.join(source,entry.name), to=path.join(destination,entry.name);
    if (entry.isDirectory()) { await mkdir(to); await copyTree(from,to); }
    else if (entry.isFile()) await writeFile(to,await readFile(from),{flag:'wx'});
    else throw new Error('Templates must contain only ordinary files and directories.');
  }
}
/** Copies only a bundled, allowlisted template. Never runs commands or downloads packages. */
export async function createSite({ template, dir, cwd = process.cwd() } = {}) {
  if (!TEMPLATES.includes(template)) throw new Error('Unknown template. Choose: ' + TEMPLATES.join(', ') + '.');
  const parts = outputParts(dir);
  const base = await realpath(cwd);
  const destination = path.join(base,...parts);
  // Check every ancestor before creating anything; never follow output symlinks.
  let cursor = base;
  for (let index=0;index<parts.length;index++) {
    cursor=path.join(cursor,parts[index]);
    const info=await inspect(cursor);
    if (info?.isSymbolicLink()) throw new Error('Output paths cannot contain symbolic links.');
    if (info && index === parts.length-1) throw new Error('Output already exists; choose a new directory. Nothing was overwritten.');
    if (info && !info.isDirectory()) throw new Error('An output parent is not a directory.');
  }
  cursor=base;
  for (const part of parts.slice(0,-1)) {
    cursor=path.join(cursor,part);
    try { await mkdir(cursor); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    const info=await lstat(cursor);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Output parents must be ordinary directories.');
  }
  // mkdir reserves a new output atomically; an existing directory is always refused.
  try { await mkdir(destination); } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Output already exists; choose a new directory. Nothing was overwritten.');
    throw error;
  }
  try { await copyTree(path.join(templateRoot,template),destination); }
  catch (error) { await rm(destination,{recursive:true,force:true}); throw error; }
  return { template, directory:destination };
}
