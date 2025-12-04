/* ================= MOBILE MENU ================= */
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

/* ================= AVATAR GLOBAL ================= */
const DEFAULT_AVATAR = "images/default-avatar.png";

function getAvatarLS(){
  try{ return localStorage.getItem('rsl_avatar'); }
  catch{ return null; }
}

function applyAvatarUI(){
  const avatar = document.getElementById('navAvatar');
  if(!avatar) return;
  avatar.src = getAvatarLS() || DEFAULT_AVATAR;
}

document.addEventListener("DOMContentLoaded", async () => {
  const navAvatar = document.getElementById('navAvatar');
  const btnLogin  = document.getElementById('btnLogin');
  const btnAccount= document.getElementById('btnAccount');

  if(!window.supabase || !navAvatar) return;

  const sb = window.supabase.createClient(
      "https://jynxifufaauoxwzjapzq.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bnhpZnVmYWF1b3h3emphcHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzODI2NzcsImV4cCI6MjA3Njk1ODY3N30.vFPGhGakPIM3Xg5rn8_BrAXl6oJMJOssO780C9nXmr4"
  );

  /* Vérifie connexion user */
  const { data:{ user } } = await sb.auth.getUser();

  if(user){ // connecté
    applyAvatarUI();
    navAvatar.style.display="inline-block";
    btnLogin && (btnLogin.style.display="none");
    btnAccount && (btnAccount.style.display="inline-flex");
  } else {
    navAvatar.style.display="none";
    btnLogin && (btnLogin.style.display="inline-block");
    btnAccount && (btnAccount.style.display="none");
  }
});
