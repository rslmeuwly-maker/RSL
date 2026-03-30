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

/* ================= PANIER STRIPE (ADD / TOTAL / UI) =================
   - Ajoute un produit Stripe (priceId) au panier sans écraser les autres
   - Stockage: localStorage "cart"
   - Boutons:
       .addCartBtn  (data-price="price_..."; data-qty="1" optionnel)
       #checkoutBtn (si présent)
       .cartCount   (si présent, affiche nb d’articles)
==================================================================== */

const RSL_CART_KEY = "cart";

function cartGet(){
  try{
    return JSON.parse(localStorage.getItem(RSL_CART_KEY) || "[]");
  }catch(e){
    console.warn("cartGet JSON error", e);
    return [];
  }
}
function cartSet(cart){
  try{
    localStorage.setItem(RSL_CART_KEY, JSON.stringify(cart || []));
  }catch(e){
    console.warn("cartSet LS error", e);
  }
}
function cartAdd(priceId, qty = 1){
  if(!priceId) return;
  const q = Math.max(1, parseInt(qty, 10) || 1);
  const cart = cartGet();
  const item = cart.find(i => i.priceId === priceId);
  if(item) item.qty += q;
  else cart.push({ priceId, qty: q });
  cartSet(cart);
  cartUpdateBadges();
}
function cartRemove(priceId){
  const cart = cartGet().filter(i => i.priceId !== priceId);
  cartSet(cart);
  cartUpdateBadges();
}
function cartClear(){
  cartSet([]);
  cartUpdateBadges();
}
function cartCountItems(){
  return cartGet().reduce((sum, i) => sum + (parseInt(i.qty,10)||0), 0);
}
function cartUpdateBadges(){
  const n = cartCountItems();
  document.querySelectorAll(".cartCount").forEach(el => {
    el.textContent = String(n);
    el.style.display = n > 0 ? "" : "none";
  });
}

/**
 * Lance Stripe Checkout en créant UNE session serveur avec tous les line_items
 * => nécessite une Netlify Function: /.netlify/functions/create-checkout-session
 */
async function cartCheckout(){
  const cart = cartGet();
  if(!cart.length){
    alert("Ton panier est vide.");
    return;
  }

  try{
    const res = await fetch("/.netlify/functions/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart })
    });
    const data = await res.json().catch(()=> ({}));

    if(!res.ok){
      console.error("Checkout error:", data);
      alert(data?.error || "Erreur paiement. Réessaie.");
      return;
    }

    if(data?.url){
      window.location.href = data.url;
      return;
    }

    alert("Erreur: URL de paiement manquante.");
  }catch(e){
    console.error("cartCheckout fetch error:", e);
    alert("Erreur réseau. Réessaie.");
  }
}

/* ========= INITIALISATION GLOBALE ========= */

document.addEventListener("DOMContentLoaded", async () => {
  // --- (1) PANIER: bind boutons + badge ---
  cartUpdateBadges();

  // Boutons "Ajouter au panier"
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".addCartBtn");
    if(!btn) return;

    const priceId = btn.dataset.price;
    const qty = btn.dataset.qty || "1";

    if(!priceId){
      console.warn("addCartBtn sans data-price");
      return;
    }

    cartAdd(priceId, qty);

    // feedback léger (sans casser ton UI)
    btn.classList.add("added");
    setTimeout(()=>btn.classList.remove("added"), 400);
  });

  // Bouton "Payer"
  const checkoutBtn = document.getElementById("checkoutBtn");
  if(checkoutBtn){
    checkoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      cartCheckout();
    });
  }

  // --- (2) TON CODE EXISTANT (inchangé) ---

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

/* ================= (OPTIONNEL) EXPORT DEBUG ================= */
// window.RSL_CART = { cartGet, cartAdd, cartRemove, cartClear, cartCheckout };
