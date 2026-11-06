import { el, normalize, announcement, loadData, showLoadError } from './ui.js';
const grid=document.getElementById('directory-grid');
const search=document.getElementById('search');
const buttons=[...document.querySelectorAll('[data-kind]')];
let entries=[], kind='all';
function render() {
  const query=normalize(search.value);
  const matches=entries.filter((entry) => (kind === 'all' || entry.kind === kind) && normalize(entry.title + ' ' + entry.category + ' ' + entry.description).includes(query));
  grid.replaceChildren(...matches.map((entry) => {
    const card=el('article',undefined,'card');
    const art=el('div',entry.symbol,'card-art'); art.setAttribute('aria-hidden','true');
    card.append(art,el('span',entry.kind === 'project' ? 'مەنبە / ' + entry.category : 'تەسەۋۋۇرىي پائالىيەت','tag'),el('h3',entry.title),el('p',entry.description));
    if (entry.kind === 'project') {
      const url=new URL(entry.url);
      if (url.protocol === 'https:') { const link=el('a','مەنبە كودنى ئېچىش ↗','text-link'); link.href=url.href; card.append(link); }
    } else {
      const detail=el('details'); detail.append(el('summary','ئۈلگە ھەققىدە'),el('p',entry.details)); card.append(detail);
    }
    return card;
  }));
  document.getElementById('empty').hidden=matches.length > 0;
  announcement(matches.length + ' كارتا كۆرسىتىلدى. پائالىيەت كارتىلىرى تەسەۋۋۇرىي ئۈلگە.');
}
buttons.forEach((button) => button.addEventListener('click',() => {
  kind=button.dataset.kind;
  buttons.forEach((item) => item.setAttribute('aria-pressed',String(item === button)));
  render();
}));
search.addEventListener('input',render);
try {
  const data=await loadData();
  entries=[...data.projects.map((entry) => ({...entry,kind:'project'})),...data.events.map((entry) => ({...entry,kind:'event'}))];
  render();
} catch { showLoadError(); }
