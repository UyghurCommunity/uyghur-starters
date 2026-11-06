import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES } from '../src/create.js';
const root=fileURLToPath(new URL('../',import.meta.url));
for (const template of TEMPLATES) {
  test(template + ' has valid local links, controls, metadata and independent assets',async () => {
    const base=path.join(root,'templates',template);
    const html=await readFile(path.join(base,'index.html'),'utf8');
    assert.match(html,/<html lang="ug" dir="rtl">/);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(ids.length,new Set(ids).size,'duplicate IDs');
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const target=match[1];
      if (/^(?:https:|mailto:)/.test(target)) continue;
      if (target.startsWith('#')) { assert.ok(ids.includes(target.slice(1)), 'missing anchor ' + target); continue; }
      const filename=path.resolve(base,target.endsWith('/') ? target + 'index.html' : target);
      assert.ok(!path.relative(base,filename).startsWith('..'),'template external dependency ' + target);
      assert.ok((await stat(filename)).isFile(),'missing ' + target);
    }
    const app=await readFile(path.join(base,'app.js'),'utf8');
    const ui=await readFile(path.join(base,'ui.js'),'utf8');
    for (const source of [app,ui]) {
      for (const match of source.matchAll(/getElementById\('([^']+)'\)/g)) assert.ok(ids.includes(match[1]),'missing control ' + match[1]);
      for (const match of source.matchAll(/from '(\.[^']+)'/g)) assert.ok((await stat(path.resolve(base,match[1]))).isFile(),'missing module');
    }
    const css=await readFile(path.join(base,'style.css'),'utf8');
    assert.match(css,/font-family:"ALKATIP Basma"/);
    for (const ext of ['woff2','woff','ttf']) assert.ok(css.includes('3c16518f40da2fc2901f37666c0556a7.' + ext));
    assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
    assert.match(css,/animation-play-state:paused/);
    assert.match(html,/id="motion-toggle"[^>]*hidden/);
    assert.match(html,/<noscript>/);
    assert.ok(!(await readdir(base)).some((name) => /\.(?:woff2?|ttf)$/.test(name)),'font binary bundled');
  });
}
test('all sample content has explicit status and unique routable identifiers',async () => {
  for (const template of TEMPLATES) {
    const data=JSON.parse(await readFile(path.join(root,'templates',template,'data.json'),'utf8'));
    assert.equal(data.contentStatus,'illustrative-original-draft');
    const entries=Object.values(data).filter(Array.isArray).flat();
    assert.ok(entries.length >= 4);
    assert.equal(entries.length,new Set(entries.map((entry) => entry.id)).size);
    for (const entry of entries) { assert.match(entry.id,/^[a-z][a-z0-9-]*$/); assert.ok(entry.title.length > 0); }
  }
});
test('gallery points to all real previews and the four intended ZIP artifacts',async () => {
  const html=await readFile(path.join(root,'index.html'),'utf8');
  for (const name of TEMPLATES) {
    assert.ok(html.includes('href="templates/' + name + '/"'));
    assert.ok(html.includes('href="downloads/' + name + '.zip" download'));
    assert.ok((await stat(path.join(root,'templates',name,'index.html'))).isFile());
  }
});
test('community project URLs use real public repository namespace, events stay unscheduled',async () => {
  const data=JSON.parse(await readFile(path.join(root,'templates/community/data.json'),'utf8'));
  data.projects.forEach((project) => assert.match(project.url,/^https:\/\/github\.com\/UyghurCommunity\/[a-z-]+$/));
  data.events.forEach((event) => { assert.equal(event.status,'illustrative-unscheduled'); assert.equal(event.date,undefined); assert.equal(event.attendees,undefined); });
});
