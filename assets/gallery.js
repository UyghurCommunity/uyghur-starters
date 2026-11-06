const select=document.getElementById('template-select');
const command=document.getElementById('create-command');
const status=document.getElementById('copy-status');
select.addEventListener('change',() => {
  command.textContent='node bin/create-uyghur.js --template ' + select.value + ' --dir ./my-site';
  status.textContent='';
});
document.getElementById('copy-command').addEventListener('click',async () => {
  try { await navigator.clipboard.writeText(command.textContent); status.textContent='بۇيرۇق كۆچۈرۈلدى.'; }
  catch { status.textContent='ئاپتوماتىك كۆچۈرۈلمىدى؛ بۇيرۇقنى تاللاپ قولدا كۆچۈرۈڭ.'; }
});
