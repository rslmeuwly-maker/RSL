// ===== Supabase init =====
const { createClient } = supabase;
let supa = null;
try {
  supa = createClient(window.env?.SUPABASE_URL || '', window.env?.SUPABASE_ANON || '');
} catch (_) {}

// ===== Panier helpers =====
function getPanier() {
  return JSON.parse(localStorage.getItem("rsl_panier_courses") || "[]");
}
function savePanier(p) {
  localStorage.setItem("rsl_panier_courses", JSON.stringify(p));
}
function updateBasketBar() {
  const bar  = document.getElementById("basketBar");
  const info = document.getElementById("basketInfo");
  if (!bar || !info) return;

  const panier = getPanier();
  if (panier.length > 0) {
    bar.style.display = "flex";
    info.textContent =
      panier.length + (panier.length > 1 ? " cours sélectionnés" : " cours sélectionné");
  } else {
    bar.style.display = "none";
    info.textContent = "0 cours sélectionné";
  }
}

// ===== Chargement + rendu des cours =====
async function loadCourses(){
  const list      = document.getElementById('courseList');
  const monthSel  = document.getElementById('filtreMois');
  const lieuSel   = document.getElementById('filtreLieu');
  const onlyFree  = document.getElementById('filtreDispo');

  list.innerHTML = '<div class="item"><b>Chargement...</b></div>';

  try {
    if(!supa) throw new Error('No Supabase env');
    let { data, error } = await supa
      .from('courses')
      .select('id,location,starts_at,capacity,enrollments(id)')
      .order('starts_at');

    if(error) throw error;

    render(data);
    localStorage.setItem('rsl_courses_cache', JSON.stringify(data));
  } catch(e) {
    // fallback cache local
    const cache = localStorage.getItem('rsl_courses_cache');
    if(cache){
      render(JSON.parse(cache), true);
    } else {
      list.innerHTML = '<div class="item">Impossible de charger les cours (pas de cache).</div>';
    }
  }

  function render(data){
    const mois = monthSel.value;
    const lieu = lieuSel.value;
    const only = onlyFree.checked;

    // filtre des cours
    const filt = data.filter(c=>{
      const d  = new Date(c.starts_at);
      const mm = (d.getMonth()+1).toString().padStart(2,'0');
      const r  = c.capacity - (c.enrollments?.length||0); // places restantes
      return (mois==='all' || mm===mois)
          && (lieu==='all' || c.location===lieu)
          && (!only || r>0);
    });

    // remplir le <select> des lieux
    const uniqLieux = [...new Set(data.map(c=>c.location))].sort();
    lieuSel.innerHTML =
      '<option value="all">Tous les lieux</option>' +
      uniqLieux.map(l=>`<option ${l===lieu?'selected':''}>${l}</option>`).join('');

    // panier actuel (pour marquer "Ajouté ✅")
    const panier = getPanier();

    // génération HTML pour chaque cours filtré
    list.innerHTML = filt.map(c=>{
      const d   = new Date(c.starts_at);

      // ex: "sam., 03.01."
      const dd  = d.toLocaleDateString('fr-CH', {
        weekday:'short',
        day:'2-digit',
        month:'2-digit'
      });

      // heure style "10h00"
      const hh   = String(d.getHours()).padStart(2,'0');
      const min  = String(d.getMinutes()).padStart(2,'0');
      const niceDate = dd;
      const niceTime = hh + "h" + min;

      // date ISO (AAAA-MM-JJ) -> utilisée pour bloquer deux cours le même jour
      const dateISO = d.toISOString().split('T')[0];

      // places restantes
      const rest = c.capacity - (c.enrollments?.length||0);
      const full = rest <= 0;

      // est-ce que ce cours est déjà dans le panier ?
      const inPanier = panier.some(item => String(item.id) === String(c.id));

      // texte / état bouton
      let btnLabel   = full ? "Complet" : (inPanier ? "Ajouté ✅" : "S’inscrire");
      let btnDisable = full ? "disabled" : "";
      let btnExtraCl = inPanier ? "selected" : "";

      return `
        <div class="item" style="background:linear-gradient(180deg,rgba(9,13,23,.78),rgba(7,10,18,.78));border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px;color:#e7f2eb;box-shadow:0 8px 24px rgba(0,0,0,.25);margin-bottom:12px;">
          <div>
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
              <b style="color:#fff;font-weight:700;font-size:15px;line-height:1.3;">
                ${c.location}
              </b>
              <span class="badge" style="display:inline-block;border-radius:8px;border:1px solid rgba(255,255,255,.12);padding:4px 8px;font-size:12px;line-height:1.2;font-weight:600;
                ${full
                  ? "background:rgba(239,68,68,.15);color:#f87171;"
                  : "background:rgba(34,197,94,.12);color:#22c55e;"}">
                ${full ? 'Complet' : rest+' places'}
              </span>
            </div>

            <div class="muted" style="color:#cbd5e1;font-size:14px;line-height:1.3;margin-top:4px;">
              ${niceDate} — ${niceTime}
            </div>
          </div>

          <div style="margin-top:10px;display:flex;justify-content:flex-start;align-items:center;gap:8px;">
            <button
              class="btn green inscrire-btn ${btnExtraCl}"
              data-id="${c.id}"
              data-date="${dateISO}"
              style="background:#22c55e;color:#062312;font-weight:700;border-radius:8px;padding:8px 12px;font-size:14px;line-height:1.2;border:0;cursor:${full?'not-allowed':'pointer'};min-width:90px;"
              ${btnDisable}
            >${btnLabel}</button>

            <span class="conflict-msg" style="display:none;color:#f87171;font-size:12px;font-weight:600;">
              Déjà un cours ce jour-là
            </span>
          </div>
        </div>
      `;
    }).join('');

    // après affichage, mettre à jour la barre panier en bas
    updateBasketBar();
  }
}

// ===== Démarrage + filtres =====
window.addEventListener('DOMContentLoaded', ()=>{
  ['filtreMois','filtreLieu','filtreDispo'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change', loadCourses);
  });
  loadCourses();
});

// ===== Multi-sélection clic sur "S’inscrire" =====
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".inscrire-btn");
  if (!btn) return;

  const id   = btn.dataset.id;
  const date = btn.dataset.date; // "2026-01-03"
  if (!id || !date) return;

  // panier actuel
  let panier = getPanier();

  // est-ce qu'on a déjà un cours ce jour-là dans le panier ?
  const sameDay = panier.find(c => c.date === date);

  // est-ce que ce cours précis est déjà dans le panier ?
  const already = panier.find(c => String(c.id) === String(id));

  // si on essaie d'ajouter un cours différent mais le même jour -> interdit
  if (!already && sameDay && String(sameDay.id) !== String(id)) {
    const msg = btn.parentElement.querySelector('.conflict-msg');
    if (msg) {
      msg.style.display = 'inline';
      setTimeout(()=>{ msg.style.display='none'; }, 2500);
    }
    return;
  }

  // toggle
  if (already) {
    // enlever du panier
    panier = panier.filter(c => String(c.id) !== String(id));
    btn.textContent = "S’inscrire";
    btn.classList.remove("selected");
  } else {
    // ajouter dans le panier
    panier.push({ id, date });
    btn.textContent = "Ajouté ✅";
    btn.classList.add("selected");
  }

  // sauvegarder
  savePanier(panier);

  // mettre à jour barre panier
  updateBasketBar();
});

// ===== Reset complet du panier (bouton "Annuler toutes les sélections") =====
document.getElementById('basketClear')?.addEventListener('click', () => {
  // vider le panier
  localStorage.setItem("rsl_panier_courses", "[]");

  // barre panier -> vide
  updateBasketBar();

  // visuel des boutons
  document.querySelectorAll('.inscrire-btn.selected').forEach(btn => {
    btn.classList.remove('selected');
    btn.textContent = "S’inscrire";
  });
});
