import { el, normalize, announcement, loadData, showLoadError } from './ui.js';
const nav = document.getElementById('article-nav');
const search = document.getElementById('search');
let articles = [], active = 'welcome';
function renderNav() {
  const query = normalize(search.value);
  const matches = articles.filter((article) => normalize([article.title,article.intro,...article.sections.map((section) => section.title + ' ' + section.text + ' ' + (section.code || ''))].join(' ')).includes(query));
  const fragment = document.createDocumentFragment();
  [...new Set(matches.map((article) => article.group))].forEach((group) => {
    fragment.append(el('h3',group));
    matches.filter((article) => article.group === group).forEach((article) => {
      const link = el('a',article.title); link.href='#article-' + article.id;
      if (article.id === active) link.setAttribute('aria-current','page');
      fragment.append(link);
    });
  });
  nav.replaceChildren(fragment);
  document.getElementById('empty').hidden = matches.length > 0;
  announcement(matches.length + ' قوللانما ماس كەلدى.');
}
function showArticle(id, focus = false) {
  const article = articles.find((item) => item.id === id);
  if (!article) return;
  active = id;
  const content = document.getElementById('article-content');
  const head = el('div',undefined,'reading-head');
  const title = el('h1',article.title); title.tabIndex=-1;
  head.append(el('span',article.group,'tag'),title,el('p',article.intro));
  const toc = el('nav',undefined,'docs-toc'); toc.setAttribute('aria-label','بۇ ماقالىدە');
  const sections = article.sections.map((section,index) => {
    const block = el('section'); const sectionId='section-' + article.id + '-' + index;
    const heading = el('h2',section.title); heading.id=sectionId; block.append(heading,el('p',section.text));
    const anchor = el('a',section.title); anchor.href='#' + sectionId; toc.append(anchor);
    if (section.code) {
      const pre = el('pre',undefined,'code-block'); pre.lang='en'; pre.dir='ltr'; pre.append(el('code',section.code));
      const copy = el('button','كودنى كۆچۈرۈش ⧉','copy-code'); copy.type='button';
      copy.addEventListener('click',async () => {
        try { await navigator.clipboard.writeText(section.code); announcement('كود كۆچۈرۈلدى.'); }
        catch { announcement('ئاپتوماتىك كۆچۈرۈلمىدى؛ كودنى تاللاپ قولدا كۆچۈرۈڭ.'); }
      }); block.append(pre,copy);
    }
    return block;
  });
  content.replaceChildren(head,toc,...sections);
  document.title=article.title + ' · يولخەت';
  renderNav();
  if (focus) { title.focus({preventScroll:true}); content.scrollIntoView({block:'start'}); }
}
function route(focus = true) {
  let hash;
  try { hash=decodeURIComponent(location.hash.slice(1)); } catch { hash=''; }
  if (hash.startsWith('article-')) {
    const id=hash.slice(8);
    if (articles.some((item) => item.id === id)) showArticle(id,focus);
    else announcement('بۇ قوللانما تېپىلمىدى. تىزىملىكتىن بىر بۆلەكنى تاللاڭ.');
  }
}
search.addEventListener('input',renderNav);
window.addEventListener('hashchange',() => route());
try {
  const data=await loadData(); articles=data.articles;
  showArticle(articles[0].id); route(false);
} catch { showLoadError(); }
