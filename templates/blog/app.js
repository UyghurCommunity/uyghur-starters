import { el, normalize, announcement, loadData, showLoadError } from './ui.js';
const grid = document.getElementById('post-grid');
const search = document.getElementById('search');
const filters = document.getElementById('category-filters');
let posts = [], category = 'all';
function renderPosts() {
  const query = normalize(search.value);
  const matches = posts.filter((post) => (category === 'all' || post.category === category) && normalize([post.title,post.excerpt,...post.body].join(' ')).includes(query));
  grid.replaceChildren(...matches.map((post) => {
    const card = el('article', undefined, 'card');
    const art = el('div', post.symbol, 'card-art'); art.setAttribute('aria-hidden','true');
    card.append(art,el('span',post.category,'tag'),el('h3',post.title),el('p',post.excerpt));
    const link = el('a','داۋامىنى ئوقۇش ←','text-link'); link.href = '#post-' + post.id; link.setAttribute('aria-label',post.title + ' — داۋامىنى ئوقۇش');
    card.append(link); return card;
  }));
  document.getElementById('empty').hidden = matches.length > 0;
  announcement(matches.length + ' ئۈلگە يازما كۆرسىتىلدى.');
}
function renderFilters() {
  filters.replaceChildren(...['all',...new Set(posts.map((post) => post.category))].map((value) => {
    const button = el('button',value === 'all' ? 'ھەممىسى' : value,'filter'); button.type = 'button'; button.setAttribute('aria-pressed',String(category === value));
    button.addEventListener('click',() => { category=value; renderFilters(); renderPosts(); filters.querySelector('[aria-pressed="true"]').focus({preventScroll:true}); }); return button;
  }));
}
function route() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { id = ''; }
  const post = id.startsWith('post-') ? posts.find((item) => item.id === id.slice(5)) : null;
  document.getElementById('feed').hidden = Boolean(post);
  document.getElementById('reader').hidden = !post;
  if (!post) {
    if (id.startsWith('post-')) announcement('بۇ يازما تېپىلمىدى. تۆۋەندىكى يازمىلارنى كۆرۈڭ.');
    document.title = 'بەتلەر · ئۇيغۇرچە قېلىپ'; return;
  }
  const content = document.getElementById('article-content');
  const head = el('div',undefined,'reading-head');
  const title = el('h1',post.title); title.tabIndex=-1;
  head.append(el('span',post.category,'tag'),title,el('p','ئەسلىدىن يېزىلغان ئۈلگە مەزمۇن','muted'));
  content.replaceChildren(head,...post.body.map((paragraph) => el('p',paragraph)));
  document.title = post.title + ' · بەتلەر';
  title.focus({preventScroll:true});
  document.getElementById('reader').scrollIntoView({block:'start'});
}
search.addEventListener('input',renderPosts);
window.addEventListener('hashchange',route);
try {
  const data = await loadData(); posts = data.posts;
  renderFilters(); renderPosts(); route();
} catch { showLoadError(); }
