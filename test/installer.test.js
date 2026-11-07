import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { installUI, UI_COMPONENTS, validateUIBlock } from '../src/install-ui.js';

const root = fileURLToPath(new URL('../', import.meta.url)), cli = path.join(root, 'bin/create-uyghur.js');
const readBlock = async (name) => JSON.parse(await readFile(path.join(root, 'registry', name + '.json'), 'utf8'));
async function temp(t) { const dir = await mkdtemp(path.join(tmpdir(), 'uyghur-ui-install-')); t.after(() => rm(dir, { recursive: true, force: true })); return dir; }
const run = (args, cwd) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
const hash = (text) => createHash('sha256').update(text).digest('hex');
const extra = (name, content = 'ordinary content') => ({ path: name, target: name, type: 'registry:file', content, sha256: hash(content) });

test('UI CLI lists six blocks, retains four template choices, and refuses mixed or incomplete modes', async (t) => {
  const cwd = await temp(t);
  assert.ok(Object.isFrozen(UI_COMPONENTS));
  const list = run(['--ui-list'], cwd); assert.equal(list.status, 0, list.stderr); assert.deepEqual(list.stdout.trim().split('\n'), [...UI_COMPONENTS]);
  assert.deepEqual(run(['--list'], cwd).stdout.trim().split('\n'), ['blog', 'docs', 'portfolio', 'community']);
  assert.match(run(['--help'], cwd).stdout, /--ui writing-field --dir/);
  for (const args of [['--ui'], ['--ui', 'dialog'], ['--ui-list', '--dir', 'site'], ['--ui', 'dialog', '--template', 'blog', '--dir', 'site'], ['--ui', 'dialog', '--ui', 'drawer', '--dir', 'site'], ['--ui', 'unknown', '--dir', 'site']]) {
    const result = run(args, cwd); assert.equal(result.status, 2); assert.match(result.stderr, /Error:/);
  }
  assert.deepEqual(await readdir(cwd), []);
});

for (const component of UI_COMPONENTS) test(`installs a complete verified ${component} block from bundled files without dependencies`, async (t) => {
  const cwd = await temp(t), block = await readBlock(component);
  const result = await installUI({ component, dir: `./nested/${component}`, cwd });
  assert.equal(result.component, component); assert.equal(result.version, '0.4.0'); assert.equal(result.files, block.files.length);
  for (const file of block.files) {
    const installed = await readFile(path.join(result.directory, ...file.path.split('/')), 'utf8');
    assert.equal(installed, file.content, file.path); assert.equal(hash(installed), file.sha256);
  }
  const manifest = JSON.parse(await readFile(path.join(result.directory, 'package.json'), 'utf8'));
  assert.equal(manifest.private, true); assert.equal(manifest.dependencies, undefined);
  assert.equal((await readdir(result.directory)).includes('node_modules'), false);
  assert.equal((await readdir(result.directory)).includes('.git'), false);
  const imported = spawnSync(process.execPath, ['--input-type=module', '-e', "import { bindUyghurInput, bindDialog, bindCombobox, bindDropdown, bindDrawer, bindDataTable } from './vendor/uyghur-ui/src/index.js'; if (![bindUyghurInput,bindDialog,bindCombobox,bindDropdown,bindDrawer,bindDataTable].every(value => typeof value === 'function')) throw Error('Missing core exports');"], { cwd: result.directory, encoding: 'utf8' });
  assert.equal(imported.status, 0, imported.stderr);
});

test('UI installer refuses existing destinations, symlinks, non-directory parents, and traversal without touching user files', async (t) => {
  const cwd = await temp(t), outside = await temp(t);
  await mkdir(path.join(cwd, 'existing')); await writeFile(path.join(cwd, 'existing/keep.txt'), 'keep exactly');
  await mkdir(path.join(cwd, 'empty')); await symlink(outside, path.join(cwd, 'linked'), 'dir');
  await writeFile(path.join(cwd, 'file'), 'ordinary file');
  for (const dir of ['existing', 'empty']) await assert.rejects(installUI({ component: 'dialog', dir, cwd }), /already exists/);
  for (const dir of ['linked', 'linked/new']) await assert.rejects(installUI({ component: 'dialog', dir, cwd }), /symbolic links/);
  await assert.rejects(installUI({ component: 'dialog', dir: 'file/new', cwd }), /not a directory/);
  for (const dir of ['..', '../escape', 'safe/../../escape', 'safe\\..\\escape', '.', './', '/tmp/escape', 'C:\\escape', 'C:escape', '', 'bad\0name']) await assert.rejects(installUI({ component: 'dialog', dir, cwd }), /directory|traversal/i, dir);
  await assert.rejects(installUI({ component: '../dialog', dir: 'new', cwd }), /Unknown UI/);
  assert.equal(await readFile(path.join(cwd, 'existing/keep.txt'), 'utf8'), 'keep exactly');
  assert.deepEqual(await readdir(path.join(cwd, 'empty')), []); assert.deepEqual(await readdir(outside), []);
  assert.deepEqual((await readdir(cwd)).sort(), ['empty', 'existing', 'file', 'linked']);
});

test('payload validation rejects tampering, unsafe targets, case collisions, and file/directory conflicts before writing', async () => {
  const original = await readBlock('dialog');
  assert.equal(validateUIBlock(original), original);
  for (const filename of ['../escape', '/absolute', 'C:escape', 'dir\\escape', 'dir/./file', 'dir//file', 'dir/%2e%2e/file', '.git/config', 'bad\0file']) {
    const block = structuredClone(original); block.files[0].path = filename; block.files[0].target = filename;
    assert.throws(() => validateUIBlock(block), /Unsafe registry/, filename);
  }
  const corrupted = structuredClone(original); corrupted.files[0].content += '\nmalicious change';
  assert.throws(() => validateUIBlock(corrupted), /hash mismatch/);
  const target = structuredClone(original); target.files[0].target = '../other';
  assert.throws(() => validateUIBlock(target), /Unsafe registry/);
  const duplicate = structuredClone(original); duplicate.files.push(extra('INDEX.HTML'));
  assert.throws(() => validateUIBlock(duplicate), /collision/);
  const parent = structuredClone(original); parent.files.push(extra('vendor'));
  assert.throws(() => validateUIBlock(parent), /directory collision/);
  const dependency = structuredClone(original); dependency.dependencies.push('react');
  assert.throws(() => validateUIBlock(dependency), /package installation/);
  assert.throws(() => validateUIBlock(original, 'drawer'), /Invalid bundled/);
});

test('simultaneous installers reserve a new directory atomically and leave one complete result', async (t) => {
  const cwd = await temp(t);
  const results = await Promise.allSettled([installUI({ component: 'dialog', dir: 'one', cwd }), installUI({ component: 'dialog', dir: 'one', cwd })]);
  assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1);
  assert.equal(results.filter(({ status }) => status === 'rejected').length, 1);
  const block = await readBlock('dialog');
  for (const file of block.files) assert.equal(hash(await readFile(path.join(cwd, 'one', file.path), 'utf8')), file.sha256);
});

test('CLI-installed writing block serves HTML, local modules/styles, and refuses outside paths and POST', async (t) => {
  const cwd = await temp(t), installed = run(['--ui', 'writing-field', '--dir', './ui'], cwd);
  assert.equal(installed.status, 0, installed.stderr); assert.match(installed.stdout, /node server\.mjs/);
  const child = spawn(process.execPath, ['server.mjs'], { cwd: path.join(cwd, 'ui'), env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill());
  const address = await new Promise((resolve, reject) => {
    let text = ''; const timer = setTimeout(() => reject(new Error('Preview server did not start')), 5000);
    child.stdout.on('data', (chunk) => { text += chunk; const match = text.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('exit', (code) => { clearTimeout(timer); reject(new Error('Preview exited: ' + code)); });
  });
  for (const [filename, type] of [['/', 'text/html'], ['/vendor/uyghur-ui/src/index.js', 'text/javascript'], ['/vendor/uyghur-ui/src/writing.js', 'text/javascript'], ['/vendor/uyghur-ui/src/styles.css', 'text/css'], ['/vendor/uyghur-ui/src/font.css', 'text/css']]) {
    const response = await fetch(address + filename); assert.equal(response.status, 200); assert.ok(response.headers.get('content-type').startsWith(type)); assert.ok((await response.text()).length);
  }
  assert.equal((await fetch(address + '/%2e%2e%2fpackage.json')).status, 404);
  assert.equal((await fetch(address + '/', { method: 'POST' })).status, 405);
  child.kill(); await once(child, 'exit');
});
