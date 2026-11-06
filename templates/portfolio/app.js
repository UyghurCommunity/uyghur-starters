import { el, announcement, loadData, showLoadError } from './ui.js';
const grid = document.getElementById('project-grid');
const filters = document.getElementById('category-filters');
const dialog = document.getElementById('project-dialog');
let projects = [], category = 'all';
function openProject(project) {
  const content = document.getElementById('dialog-content');
  document.getElementById('dialog-title').textContent = project.title;
  const list = el('ul'); project.features.forEach((feature) => list.append(el('li',feature)));
  content.replaceChildren(el('span',project.category,'tag'),el('p',project.description),el('h3','لايىھەدىكى نۇقتىلار'),list,el('p','ئۈلگە تۈر: ئۆز ئىجادىيىتىڭىز، رەسىملىرىڭىز ۋە ھەقىقىي ئۇلىنىشلىرىڭىزنى قوشۇڭ.','muted'));
  dialog.showModal();
}
function render() {
  const matches=projects.filter((project) => category === 'all' || project.category === category);
  grid.replaceChildren(...matches.map((project) => {
    const card=el('article',undefined,'card');
    const art=el('div',project.symbol,'card-art'); art.setAttribute('aria-hidden','true');
    const button=el('button','تەپسىلاتنى كۆرۈش ↗','button'); button.type='button'; button.setAttribute('aria-label',project.title + ' — تەپسىلاتنى كۆرۈش');
    button.addEventListener('click',() => openProject(project)); button.style.marginTop='22px'; button.style.alignSelf='start';
    card.append(art,el('span',project.category + ' / ئۈلگە','tag'),el('h3',project.title),el('p',project.summary),button); return card;
  }));
  announcement(matches.length + ' ئۈلگە تۈر كۆرسىتىلدى.');
}
function renderFilters() {
  filters.replaceChildren(...['all',...new Set(projects.map((project) => project.category))].map((value) => {
    const button=el('button',value === 'all' ? 'ھەممىسى' : value,'filter'); button.type='button'; button.setAttribute('aria-pressed',String(value === category));
    button.addEventListener('click',() => { category=value; renderFilters(); render(); filters.querySelector('[aria-pressed="true"]').focus({preventScroll:true}); }); return button;
  }));
}
document.getElementById('dialog-close').addEventListener('click',() => dialog.close());
dialog.addEventListener('click',(event) => {
  const bounds=dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
try { const data=await loadData(); projects=data.projects; renderFilters(); render(); } catch { showLoadError(); }
