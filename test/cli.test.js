import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, writeFile, mkdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { createSite, TEMPLATES } from '../src/create.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const cli=path.join(root,'bin/create-uyghur.js');
async function temp(t) {
  const cwd=await mkdtemp(path.join(tmpdir(),'uyghur-starters-'));
  t.after(() => rm(cwd,{recursive:true,force:true})); return cwd;
}
function run(args,cwd) { return spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8'}); }
test('CLI lists exactly the four bundled templates and prints useful help',async (t) => {
  const cwd=await temp(t);
  const list=run(['--list'],cwd); assert.equal(list.status,0); assert.deepEqual(list.stdout.trim().split('\n'),TEMPLATES);
  const help=run(['--help'],cwd); assert.equal(help.status,0); assert.match(help.stdout,/--template blog --dir/);
  assert.deepEqual(await readdir(cwd),[]);
});
for (const template of TEMPLATES) test('copies complete independent ' + template + ' template from unrelated cwd',async (t) => {
  const cwd=await temp(t);
  const result=run(['--template',template,'--dir','./nested/my-site'],cwd);
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/node server\.mjs/);
  const output=path.join(cwd,'nested/my-site');
  for (const file of ['index.html','app.js','ui.js','style.css','data.json','server.mjs','package.json','README.md','LICENSE','.nojekyll']) {
    assert.equal(await readFile(path.join(output,file),'utf8'),await readFile(path.join(root,'templates',template,file),'utf8'),file);
  }
  const manifest=JSON.parse(await readFile(path.join(output,'package.json'),'utf8'));
  assert.equal(manifest.private,true); assert.equal(manifest.scripts.start,'node server.mjs');
  assert.equal(manifest.dependencies,undefined);
  assert.equal((await readdir(output)).includes('.git'),false);
});
test('existing nonempty and empty destinations are refused without modifying contents',async (t) => {
  const cwd=await temp(t);
  await mkdir(path.join(cwd,'existing')); await writeFile(path.join(cwd,'existing/keep.txt'),'keep exactly');
  await assert.rejects(createSite({template:'blog',dir:'existing',cwd}),/already exists/);
  assert.equal(await readFile(path.join(cwd,'existing/keep.txt'),'utf8'),'keep exactly');
  await mkdir(path.join(cwd,'empty'));
  await assert.rejects(createSite({template:'blog',dir:'empty',cwd}),/already exists/);
  assert.deepEqual(await readdir(path.join(cwd,'empty')),[]);
});
test('traversal, absolute paths, current directory and invalid templates create nothing',async (t) => {
  const cwd=await temp(t);
  for (const dir of ['..','../escape','safe/../../escape','safe\\..\\escape','.','./','/tmp/escape','C:\\escape','C:escape','']) {
    await assert.rejects(createSite({template:'blog',dir,cwd}),/directory|traversal/i,dir);
  }
  await assert.rejects(createSite({template:'../blog',dir:'new',cwd}),/Unknown template/);
  assert.deepEqual(await readdir(cwd),[]);
});
test('symlinked ancestors/destinations and non-directory parents are refused',async (t) => {
  const cwd=await temp(t), outside=await temp(t);
  await symlink(outside,path.join(cwd,'linked'),'dir');
  await assert.rejects(createSite({template:'docs',dir:'linked/site',cwd}),/symbolic links/);
  await assert.rejects(createSite({template:'docs',dir:'linked',cwd}),/symbolic links/);
  await writeFile(path.join(cwd,'file'),'do not replace');
  await assert.rejects(createSite({template:'docs',dir:'file/site',cwd}),/not a directory/);
  assert.deepEqual(await readdir(outside),[]);
  assert.equal(await readFile(path.join(cwd,'file'),'utf8'),'do not replace');
});
test('unknown, duplicate and incomplete arguments fail clearly without creating output',async (t) => {
  const cwd=await temp(t);
  for (const args of [['--template','blog'],['--dir','site'],['--template','blog','--dir'],['--unknown'],['--list','--dir','site'],['--template','blog','--template','docs','--dir','site'],['--help','--dir','site']]) {
    const result=run(args,cwd); assert.equal(result.status,2); assert.match(result.stderr,/Error:/);
  }
  assert.deepEqual(await readdir(cwd),[]);
});
test('copied template serves its own HTML, module and JSON without gallery dependencies',async (t) => {
  const cwd=await temp(t);
  const {directory}=await createSite({template:'docs',dir:'site',cwd});
  const child=spawn(process.execPath,['server.mjs'],{cwd:directory,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
  t.after(() => child.kill());
  const address=await new Promise((resolve,reject) => {
    let output=''; const timer=setTimeout(() => reject(new Error('Server did not start')),5000);
    child.stdout.on('data',(chunk) => { output+=chunk; const match=output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer);resolve(match[0]); } });
    child.once('error',(error) => { clearTimeout(timer);reject(error); });
    child.once('exit',(code) => { clearTimeout(timer);reject(new Error('Server exited: ' + code)); });
  });
  for (const [file,type] of [['/','text/html'],['/app.js','text/javascript'],['/ui.js','text/javascript'],['/data.json','application/json']]) {
    const response=await fetch(address + file); assert.equal(response.status,200); assert.match(response.headers.get('content-type'),new RegExp(type)); assert.ok((await response.text()).length > 0);
  }
  const missing=await fetch(address + '/missing'); assert.equal(missing.status,404);
  const outside=await fetch(address + '/%2e%2e%2fpackage.json'); assert.equal(outside.status,404);
  const post=await fetch(address,{method:'POST'}); assert.equal(post.status,405);
  child.kill(); await once(child,'exit');
});
