/* ================= MENU MOBILE ================= */
(function(){
  const btn   = document.getElementById('menuBtn');
  const sheet = document.getElementById('mobileMenu');

  if (btn && sheet) {
    const close = () => sheet.classList.remove('open');

    btn.addEventListener('click', () => sheet.classList.add('open'));
    sheet.querySelector('.mobile-dim')?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }
})();

/* ================= AVATAR GLOBAL RSL ================= */

const RSL_LOCAL_AVATAR_KEY = "rsl_avatar";          // clé unique LS
const RSL_DEFAULT_AVATAR   = "images/logo_rsl.png"; // image par défaut

function rslGetAvatarLS(){
  try{
    return localStorage.getItem(RSL_LOCAL_AVATAR_KEY);
  }catch(e){
    console.warn("Impossible de lire avatar LS", e);
    return null;
  }
}

/**
 * user = objet Supabase user ou null
 * → l’avatar est TOUJOURS le même :
 *   - si localStorage → photo uploadée
 *   - sinon → logo RSL
 */
function rslApplyAvatarToUI(user){
  const avatar   = document.getElementById('navAvatar');
  const btnLogin = document.getElementById('btnLogin');
  const btnAcc   = document.getElementById('btnAccount');

  if (!avatar) return;

  // Même image partout
  const src = rslGetAvatarLS() || RSL_DEFAULT_AVATAR;
  avatar.src = src;
  avatar.style.display = "inline-block";

  // Gestion des boutons
  if (user) {
    if (btnLogin) btnLogin.style.display = "none";
    if (btnAcc)   btnAcc.style.display   = "inline-flex";
  } else {
    if (btnLogin) btnLogin.style.display = "inline-flex";
    if (btnAcc)   btnAcc.style.display   = "none";
  }
}

/* ========= INITIALISATION GLOBALE ========= */

document.addEventListener("DOMContentLoaded", async () => {
  // Clique sur le bouton Login → page access.html
  const btnLogin = document.getElementById('btnLogin');
  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      window.location.href = "access.html";
    });
  }

  // Pas de Supabase / env → avatar invité
  if (!window.supabase || !window.env || !window.env.SUPABASE_URL || !window.env.SUPABASE_ANON) {
    console.error("Supabase ou env.js manquant → avatar en mode invité");
    rslApplyAvatarToUI(null);
    return;
  }

  // Un seul client global
  if (!window.rslSupabase) {
    window.rslSupabase = window.supabase.createClient(
      window.env.SUPABASE_URL,
      window.env.SUPABASE_ANON
    );
  }
  const sb = window.rslSupabase;

  try {
    const { data:{ user } } = await sb.auth.getUser();
    rslApplyAvatarToUI(user || null);
  } catch (e) {
    console.warn("Erreur getUser Supabase", e);
    rslApplyAvatarToUI(null);
  }
});
