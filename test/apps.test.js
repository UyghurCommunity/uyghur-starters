import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const templates=new URL('../templates/',import.meta.url);
class Element {
  constructor(tag='div',text='') { this.tagName=tag;this._text=text;this.children=[];this.attributes={};this.handlers={};this.dataset={};this.style={};this.hidden=false;this.value=''; }
  get textContent() { return this._text + this.children.map((child) => child.textContent).join(' '); }
  set textContent(text) { this._text=String(text);this.children=[]; }
  append(...nodes) { this.children.push(...nodes.flatMap((node) => node.tagName === 'fragment' ? node.children : [node])); }
  replaceChildren(...nodes) { this.children=[];this._text='';this.append(...nodes); }
  setAttribute(key,value) { this.attributes[key]=String(value); }
  addEventListener(name,handler) { this.handlers[name]=handler; }
  querySelector(selector) { return descendants(this).find((node) => selector === '[aria-pressed="true"]' && node.attributes['aria-pressed'] === 'true'); }
  focus() { this.focused=true; }
  scrollIntoView() {}
  showModal() { this.open=true; }
  close() { this.open=false; }
}
function descendants(node) { return node.children.flatMap((child) => [child,...descendants(child)]); }
async function app(template) {
  const html=await readFile(new URL(template + '/index.html',templates),'utf8');
  const data=JSON.parse(await readFile(new URL(template + '/data.json',templates),'utf8'));
  const nodes=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => [match[1],new Element()]));
  const events={}; const location={hash:''}; let copied='';
  const kindButtons=['all','project','event'].map((kind) => {const button=new Element('button');button.dataset.kind=kind;return button;});
  const document={title:'',getElementById:(id) => nodes.get(id),createDocumentFragment:() => new Element('fragment'),querySelectorAll:() => kindButtons};
  const source=(await readFile(new URL(template + '/app.js',templates),'utf8')).replace(/^import .*?\n/,'');
  const context={document,location,URL,window:{addEventListener:(name,handler) => {events[name]=handler;}},navigator:{clipboard:{writeText:async (text) => {copied=text;}}},el:(tag,text,className) => {const node=new Element(tag,text === undefined ? '' : text);node.className=className;return node;},normalize:(text) => String(text).normalize('NFC').trim().toLowerCase(),announcement:(text) => {nodes.get('result-status').textContent=text;},loadData:async () => data,showLoadError:() => {throw new Error('Unexpected content loading error');}};
  await vm.runInNewContext('(async () => {\n' + source + '\n})()',context,{filename:template + '/app.js'});
  return {nodes,events,location,document,kindButtons,copied:() => copied};
}
test('blog combines content search/category filtering and opens full hash-routed posts',async () => {
  const {nodes,events,location,document}=await app('blog');
  assert.equal(nodes.get('post-grid').children.length,6);
  const search=nodes.get('search');search.value='كەشتىنىڭ';search.handlers.input();
  assert.equal(nodes.get('post-grid').children.length,1);
  assert.match(nodes.get('post-grid').textContent,/كەشتىنىڭ رىتىمى/);
  search.value='unmatched-query';search.handlers.input();assert.equal(nodes.get('empty').hidden,false);
  search.value='';search.handlers.input();
  const category=nodes.get('category-filters').children.find((node) => node.textContent === 'تور');
  category.handlers.click();assert.equal(nodes.get('post-grid').children.length,2);
  location.hash='#post-first-letter';events.hashchange();
  assert.equal(nodes.get('reader').hidden,false);assert.equal(nodes.get('feed').hidden,true);
  assert.match(nodes.get('article-content').textContent,/تور بېتىنى باشلاش/);
  assert.match(document.title,/بىر ھەرپتىن/);
  location.hash='#posts';events.hashchange();assert.equal(nodes.get('feed').hidden,false);
});
test('docs searches article bodies, routes articles, exposes section links and copies real code',async () => {
  const {nodes,events,location,copied}=await app('docs');
  const search=nodes.get('search');search.value='باغلاش';
  search.value='ئارىلاش';search.handlers.input();
  assert.match(nodes.get('article-nav').textContent,/ئۇيغۇرچە ۋە يۆنىلىش/);
  search.value='';search.handlers.input();
  location.hash='#article-rtl';events.hashchange();
  assert.match(nodes.get('article-content').textContent,/ئاساسىي بەت/);
  const links=descendants(nodes.get('article-content')).filter((node) => node.tagName === 'a');
  assert.equal(links[0].href,'#section-rtl-0');
  const button=descendants(nodes.get('article-content')).find((node) => node.tagName === 'button');
  await button.handlers.click();assert.equal(copied(),'<html lang="ug" dir="rtl">');
  const current=descendants(nodes.get('article-nav')).find((node) => node.attributes['aria-current'] === 'page');
  assert.equal(current.href,'#article-rtl');
});
test('portfolio filters real dataset entries and opens/closes the selected native dialog',async () => {
  const {nodes}=await app('portfolio');
  assert.equal(nodes.get('project-grid').children.length,4);
  nodes.get('category-filters').children.find((node) => node.textContent === 'قورال').handlers.click();
  assert.equal(nodes.get('project-grid').children.length,1);
  const detail=descendants(nodes.get('project-grid')).find((node) => node.tagName === 'button');
  detail.handlers.click();
  assert.equal(nodes.get('project-dialog').open,true);
  assert.equal(nodes.get('dialog-title').textContent,'سۆز كۆزنىكى');
  assert.match(nodes.get('dialog-content').textContent,/ئۈلگە تۈر/);
  nodes.get('dialog-close').handlers.click();assert.equal(nodes.get('project-dialog').open,false);
});
test('community combines project/event type filtering with search and exposes honest event details',async () => {
  const {nodes,kindButtons}=await app('community');
  assert.equal(nodes.get('directory-grid').children.length,7);
  kindButtons[2].handlers.click();assert.equal(nodes.get('directory-grid').children.length,3);
  assert.ok(descendants(nodes.get('directory-grid')).some((node) => node.tagName === 'details'));
  const search=nodes.get('search');search.value='سۆز';search.handlers.input();
  assert.equal(nodes.get('directory-grid').children.length,1);
  assert.match(nodes.get('directory-grid').textContent,/تەسەۋۋۇرىي/);
  kindButtons[1].handlers.click();assert.equal(nodes.get('empty').hidden,false);
  search.value='';search.handlers.input();assert.equal(nodes.get('directory-grid').children.length,4);
  const links=descendants(nodes.get('directory-grid')).filter((node) => node.tagName === 'a');
  assert.equal(links.length,4);
  links.forEach((link) => assert.match(link.href,/^https:\/\/github.com\/UyghurCommunity\//));
});
