// ===== Config Stripe
const STRIPE_PK    = "pk_live_51SHkA04CyXBvyjQ00N7zRHQgtLlgeEcB7ohw0ISTC7ozijz1KFJoag2EVZN3JQs3aWAV1tPvM6Tx061sb9eyVMCi00j2Dgy94j";
const PRICE_PUBLIC = "price_1SL40q4CyXBvyjQ0WchOzKhv"; // 30.–
const PRICE_MEMBRE = "price_1SL41X4CyXBvyj0Qg15rUxD4"; // 20.–
const stripe = Stripe(STRIPE_PK);

// ===== Supabase client (avec fallback démo offline)
const DEMO_MODE = !window.env || !window.env.SUPABASE_URL || !window.env.SUPABASE_ANON;
let supabase = null;
if (!DEMO_MODE) {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
  supabase = createClient(window.env.SUPABASE_URL, window.env.SUPABASE_ANON);
}

// ===== DOM
const dlg         = document.getElementById('dlg');
const lieuSelect  = document.getElementById('lieuSelect');
const daysGrid    = document.getElementById('daysGrid');
const recap       = document.getElementById('recap');
const totauxEl    = document.getElementById('totaux');
const emailInput  = document.getElementById('email');
const form        = document.getElementById('formRSL');

const fmt = (iso) => new Date(iso).toLocaleString('fr-CH',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});

// ===== State
const selected = new Map();   // id -> {starts_at, location, pricePreview?}
const takenByIso = new Map(); // iso -> id

// ===== DEMO generator (offline)
function saturdays2026At(hour="09"){
  const out=[]; let d = new Date(Date.UTC(2026,0,1,12,0,0));
  while (d.getUTCFullYear()===2026){
    if (d.getUTCDay()===6){
      out.push(new Date(Date.UTC(2026,d.getUTCMonth(),d.getUTCDate(),Number(hour),0,0)).toISOString());
    }
    d.setUTCDate(d.getUTCDate()+1);
  }
  return out;
}
const DEMO_DB = (() => {
  const base = {
    "Montreux":             { hour:"09" },
    "Lausanne — La Fièvre": { hour:"09" },
    "Lausanne — Vidy":      { hour:"10", outdoor:true },
    "Bulle":                { hour:"09", outdoor:true },
    "Yverdon":              { hour:"09", outdoor:true },
    "Martigny":             { hour:"09", outdoor:true },
    "Fribourg":             { hour:"09", outdoor:true },
    "Genève — Plainpalais": { hour:"09", outdoor:true },
  };
  const obj={};
  for (const [loc, conf] of Object.entries(base)){
    obj[loc] = saturdays2026At(conf.hour).filter(iso=>{
      if (!conf.outdoor) return true;
      const m = (new Date(iso)).getUTCMonth()+1;
      return ![1,2,11,12].includes(m); // pas janv/févr/nov/déc
    }).map((iso,i)=>({ id:`${loc}-${i}`, location:loc, starts_at:iso, remaining:15 }));
  }
  return obj;
})();

// ===== UI build
async function loadAndBuild(){
  daysGrid.innerHTML = '<span class="muted">Chargement…</span>';
  const loc = lieuSelect.value;

  let rows=[];
  if (DEMO_MODE) {
    rows = DEMO_DB[loc] || [];
  } else {
    const { data, error } = await supabase
      .from('courses_with_remaining')
      .select('id, location, starts_at, remaining')
      .eq('location', loc)
      .gte('starts_at','2026-01-01T00:00:00Z')
      .lt('starts_at', '2027-01-01T00:00:00Z')
      .order('starts_at',{ascending:true});
    if (error){ daysGrid.innerHTML = '<p class="muted">Erreur de chargement.</p>'; console.error(error); return; }
    rows = data || [];
  }

  daysGrid.innerHTML = '';
  rows.forEach(c=>{
    const iso = new Date(c.starts_at).toISOString();
    const btn = document.createElement('button');
    btn.className = 'pill'; btn.type='button';
    btn.textContent = `${fmt(iso)} — ${c.remaining} pl.`;
    btn.dataset.id = c.id; btn.dataset.iso=iso; btn.dataset.loc=c.location;

    if (c.remaining<=0){ btn.classList.add('disabled'); btn.disabled = true; }
    if (selected.has(c.id)) btn.classList.add('on');

    btn.addEventListener('click', ()=>{
      const existing = takenByIso.get(iso);
      if (existing && existing !== c.id) return; // anti-doublon même date/heure
      if (selected.has(c.id)){
        selected.delete(c.id); takenByIso.delete(iso); btn.classList.remove('on');
      }else{
        selected.set(c.id,{ starts_at:iso, location:c.location });
        takenByIso.set(iso,c.id); btn.classList.add('on');
      }
      refreshRecap();
    });

    daysGrid.appendChild(btn);
  });

  refreshRecap();
}

function refreshRecap(){
  recap.innerHTML = '';
  const arr = [...selected.entries()].map(([id,info])=>({id, ...info}))
    .sort((a,b)=> new Date(a.starts_at)-new Date(b.starts_at));

  arr.forEach(it=>{
    const row = document.createElement('div');
    row.className='item';
    row.innerHTML = `<span>${fmt(it.starts_at)}</span><span>${it.location}</span>
    <button class="btn small red" data-rm="${it.id}">Retirer</button>`;
    recap.appendChild(row);
  });

  recap.querySelectorAll('[data-rm]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const id = b.dataset.rm;
      const iso = new Date(selected.get(id).starts_at).toISOString();
      selected.delete(id); takenByIso.delete(iso);
      refreshRecap();
      daysGrid.querySelectorAll('.pill').forEach(p=>{ if(p.dataset.id===id) p.classList.remove('on'); });
    });
  });

  totauxEl.textContent = `Sélection : ${arr.length} cours${DEMO_MODE?' (lecture seule/hors-ligne)':''}`;
}

// boutons “S’inscrire”
document.querySelectorAll('button[data-open]').forEach(b=>{
  b.addEventListener('click', async ()=>{
    lieuSelect.value = b.dataset.open;
    await loadAndBuild();
    dlg.showModal();
  });
});
lieuSelect.addEventListener('change', loadAndBuild);

// Submit → RPC + Stripe
form.addEventListener('submit', async (e)=>{
  e.preventDefault();

  const ids = [...selected.keys()];
  if (ids.length===0){ alert('Choisis au moins une date.'); return; }

  if (DEMO_MODE){
    alert('Hors-ligne: affichage seulement. Connecte le site à Supabase pour réserver.');
    return;
  }

  const { data:auth, error:authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user){ alert('Connecte-toi (bouton “Se connecter”).'); return; }
  const userId = auth.user.id;

  const { data, error } = await supabase.rpc('book_courses', { p_user: userId, p_course_ids: ids });
  if (error){ alert(error.message); console.error(error); return; }

  const total = data.length ? data[data.length-1].total_to_pay : 0;
  const c20 = data.filter(x=>x.price_chf===20).length;
  const c30 = data.filter(x=>x.price_chf===30).length;

  if (total<=0){
    alert('Réservation confirmée (tarif 0.–).');
    dlg.close(); selected.clear(); takenByIso.clear(); refreshRecap(); await loadAndBuild();
    return;
  }

  const lineItems=[];
  if (c20>0) lineItems.push({ price: PRICE_MEMBRE, quantity: c20 });
  if (c30>0) lineItems.push({ price: PRICE_PUBLIC, quantity: c30 });

  stripe.redirectToCheckout({
    mode:'payment',
    lineItems,
    successUrl: `${location.origin}/success.html`,
    cancelUrl: `${location.origin}/cours.html#cancel`,
    customerEmail: (emailInput.value || undefined),
    billingAddressCollection:'auto'
  }).then(res=>{ if(res && res.error){ alert(res.error.message || "Paiement interrompu."); } });
});

// Premier rendu si la modale est déjà ouverte (pas nécessaire mais safe)
