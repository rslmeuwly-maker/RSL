
(function(){
  const btn = document.getElementById('menuBtn');
  const sheet = document.getElementById('mobileMenu');
  if(btn && sheet){
    const close = () => sheet.classList.remove('open');
    btn.addEventListener('click', ()=> sheet.classList.add('open'));
    sheet.querySelector('.mobile-dim')?.addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
  }
})();
