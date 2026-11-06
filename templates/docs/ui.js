const root = document.documentElement;
const toggle = document.getElementById('motion-toggle');
const media = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = false;
let visible = true;
function syncMotion() {
  const stopped = paused || media.matches;
  root.dataset.motion = stopped || document.hidden || !visible ? 'paused' : 'running';
  if (!toggle) return;
  toggle.disabled = media.matches;
  toggle.setAttribute('aria-pressed', String(stopped));
  toggle.textContent = media.matches ? 'ھەرىكەت ئازايتىلغان' : paused ? 'ھەرىكەتنى قوزغىتىش ▷' : 'ھەرىكەتنى توختىتىش Ⅱ';
}
if (toggle) {
  toggle.hidden = false;
  toggle.addEventListener('click', () => { paused = !paused; syncMotion(); });
}
media.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
const art = document.querySelector('.motif');
if (art && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncMotion(); });
  observer.observe(art);
  window.addEventListener('pagehide', (event) => { if (!event.persisted) observer.disconnect(); });
}
syncMotion();
export function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) { node.textContent = text; node.lang = /[\u0600-\u06ff]/u.test(String(text)) ? 'ug' : 'en'; }
  if (className) node.className = className;
  return node;
}
export function normalize(text) { return String(text).normalize('NFC').trim().toLocaleLowerCase(); }
export function announcement(text) { const node = document.getElementById('result-status'); if (node) node.textContent = text; }
export async function loadData() {
  const response = await fetch(new URL('./data.json', import.meta.url));
  if (!response.ok) throw new Error('Data request failed.');
  return response.json();
}
export function showLoadError() {
  announcement('مەزمۇن يۈكلەنمىدى. بۇ قىسقۇچنى يەرلىك HTTP مۇلازىمېتىرى بىلەن ئېچىڭ؛ README نى كۆرۈڭ.');
}
