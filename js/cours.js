/* =========================
   RSL — cours.js (ABO = comme compte.html)
   - Lit profiles.membership_code
   - Lit rsl_membership_types
   - Progression: quota gratuit basé sur rsl_course_registrations.membership_included = true
   - Calcule le prix par cours + panier localStorage
========================= */

console.log("✅ cours.js chargé (abo via profiles)", new Date().toISOString());

// ===== Supabase init =====
const { createClient } = supabase;
let supa = null;

try {
  const url  = window.env?.SUPABASE_URL  || "https://jynxifufaauoxwzjapzq.supabase.co";
  const anon = window.env?.SUPABASE_ANON || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bnhpZnVmYWF1b3h3emphcHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzODI2NzcsImV4cCI6MjA3Njk1ODY3N30.vFPGhGakPIM3Xg5rn8_BrAXl6oJMJOssO780C9nXmr4";
  supa = createClient(url, anon);
  window.supabaseClient = supa;
} catch (e) {
  console.error("❌ Erreur init Supabase dans cours.js:", e);
}

// ===== State abo =====
let currentUser = null;
let currentMembership = null; 
// shape:
// { membership_code, course_price_chf, free_courses_quota, is_unlimited, remaining_quota }

// ===== Helpers LS panier =====
const PANIER_KEY = "rsl_panier_courses";

function getPanier() {
  try {
    const raw = localStorage.getItem(PANIER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePanier(p) {
  try { localStorage.setItem(PANIER_KEY, JSON.stringify(Array.isArray(p) ? p : [])); } catch {}
}

function updateBasketBar() {
  const bar  = document.getElementById("basketBar");
  const info = document.getElementById("basketInfo");
  if (!bar || !info) return;

  const panier = getPanier();
  const n = panier.length;

  if (n > 0) {
    bar.style.display = "flex";
    info.textContent = n + (n > 1 ? " cours sélectionnés" : " cours sélectionné");
  } else {
    bar.style.display = "none";
    info.textContent = "0 cours sélectionné";
  }

  const mobileBtn = document.getElementById("mobileInscrireBtn");
  if (mobileBtn) mobileBtn.textContent = n > 0 ? `Continuer (${n})` : "S’inscrire";
}

// ===== Lire abo EXACTEMENT comme compte.html =====
async function fetchMembershipLikeCompte(sbClient, userId) {
  if (!sbClient?.from || !userId) return null;

  try {
    // 1) profiles.membership_code
    const { data: profile, error: profErr } = await sbClient
      .from("profiles")
      .select("membership_code")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      console.warn("Erreur lecture profiles:", profErr);
      return null;
    }

    const codeRaw = (profile?.membership_code || "aucun").trim();
    const codeLower = codeRaw.toLowerCase();

    // 2) rsl_membership_types (anti-casse: essaie exact, puis ilike)
    let rules = null;

    // exact raw
    {
      const r = await sbClient
        .from("rsl_membership_types")
        .select("code, course_price_chf, free_courses_quota, is_unlimited")
        .eq("code", codeRaw)
        .maybeSingle();
      if (!r.error) rules = r.data || null;
    }

    // exact lower (si table stocke en lower)
    if (!rules) {
      const r = await sbClient
        .from("rsl_membership_types")
        .select("code, course_price_chf, free_courses_quota, is_unlimited")
        .eq("code", codeLower)
        .maybeSingle();
      if (!r.error) rules = r.data || null;
    }

    // ilike fallback
    if (!rules && codeLower !== "aucun") {
      const r = await sbClient
        .from("rsl_membership_types")
        .select("code, course_price_chf, free_courses_quota, is_unlimited")
        .ilike("code", codeLower)
        .maybeSingle();
      if (!r.error) rules = r.data || null;
    }

    const finalRules = rules || {
      code: "aucun",
      course_price_chf: 30,
      free_courses_quota: 0,
      is_unlimited: false
    };

    // 3) Progression quota restant = free_courses_quota - count(registrations where membership_included=true)
    let remaining = 0;
    if (String(finalRules.code || "").toLowerCase() === "progression" && Number(finalRules.free_courses_quota || 0) > 0) {
      const { count } = await sbClient
        .from("rsl_course_registrations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("membership_included", true);

      remaining = Math.max(0, Number(finalRules.free_courses_quota || 0) - (count || 0));
    }

    return {
      membership_code: finalRules.code,
      course_price_chf: Number(finalRules.course_price_chf ?? 30),
      free_courses_quota: Number(finalRules.free_courses_quota ?? 0),
      is_unlimited: !!finalRules.is_unlimited,
      remaining_quota: remaining
    };
  } catch (e) {
    console.warn("Erreur fetchMembershipLikeCompte:", e);
    return null;
  }
}

// ===== Prix d’un cours selon abo + panier (comme ton système) =====
function computeCoursePrice(membership, panier) {
  const full = 30; // plein tarif
  if (!membership) return full;

  const code = String(membership.membership_code || "").toLowerCase();
  const isUnlimited = membership.is_unlimited === true || code === "premium";

  // Premium / unlimited = 0
  if (isUnlimited) return 0;

  // Progression: quota gratuit -> 0 tant qu'il reste
  if (code === "progression") {
    const remaining = Number(membership.remaining_quota || 0);
    if (remaining > 0) return 0;
    // après quota: prix membership_types (souvent 20)
    return Number(membership.course_price_chf || 20);
  }

  // Autres types: prix membership_types
  const p = Number(membership.course_price_chf || 20);
  // sécurité
  return isFinite(p) ? p : full;
}

// ===== Util: date =====
function dateISO(d) {
  try { return new Date(d).toISOString().split("T")[0]; } catch { return ""; }
}

// ===== Chargement cours + rendu =====
async function loadCourses() {
  const list      = document.getElementById("courseList");
  const monthSel  = document.getElementById("filtreMois");
  const lieuSel   = document.getElementById("filtreLieu");
  const onlyDispo = document.getElementById("filtreDispo");

  if (!list) return;

  list.innerHTML = `<div class="item"><b>Chargement...</b></div>`;

  // 1) user + abo
  try {
    if (!supa?.auth) throw new Error("Supabase auth missing");
    const { data: { user } = {} } = await supa.auth.getUser();
    currentUser = user || null;

    if (currentUser) {
      currentMembership = await fetchMembershipLikeCompte(supa, currentUser.id);
    } else {
      currentMembership = null;
    }
  } catch (e) {
    console.warn("Supabase non disponible → abo null", e);
    currentUser = null;
    currentMembership = null;
  }

  // 2) fetch courses
  let courses = [];
  try {
    if (!supa?.from) throw new Error("Supabase client missing");

    const { data, error } = await supa
      .from("courses")
      .select("id,location,starts_at,capacity,enrollments(id)")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });

    if (error) throw error;
    courses = data || [];
    try { localStorage.setItem("rsl_courses_cache", JSON.stringify(courses)); } catch {}
  } catch (e) {
    console.warn("loadCourses → fallback cache", e);
    try {
      const cache = localStorage.getItem("rsl_courses_cache");
      courses = cache ? (JSON.parse(cache) || []) : [];
    } catch {
      courses = [];
    }
  }

  // 3) render
  renderCourses(courses, monthSel, lieuSel, onlyDispo);
}

function renderCourses(data, monthSel, lieuSel, onlyDispo) {
  const list = document.getElementById("courseList");
  if (!list) return;

  const mois = monthSel?.value || "all";
  const lieu = lieuSel?.value || "all";
  const only = !!onlyDispo?.checked;

  // lieux uniques
  const uniqLieux = [...new Set((data || []).map(c => c.location).filter(Boolean))].sort();
  if (lieuSel) {
    const currentValue = lieuSel.value || "all";
    lieuSel.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "Tous les lieux";
    lieuSel.appendChild(optAll);

    uniqLieux.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l;
      opt.textContent = l;
      if (l === currentValue) opt.selected = true;
      lieuSel.appendChild(opt);
    });

    // trigger custom select sync si ton UI le fait via change
    lieuSel.dispatchEvent(new Event("change", { bubbles: true }));
  }

  let panier = getPanier();

  const filt = (data || []).filter(c => {
    const d = new Date(c.starts_at);
    if (isNaN(d.getTime())) return false;

    const mm = String(d.getMonth() + 1).padStart(2, "0");

    const used = Array.isArray(c.enrollments) ? c.enrollments.length : 0;
    const cap  = (typeof c.capacity === "number") ? c.capacity : null;

    let full = false;
    if (cap !== null) full = Math.max(cap - used, 0) === 0;

    return (mois === "all" || mm === mois)
      && (lieu === "all" || c.location === lieu)
      && (!only || !full);
  });

  const html = filt.map(c => {
    const d = new Date(c.starts_at);
    const niceDate = d.toLocaleDateString("fr-CH", { weekday: "short", day: "2-digit", month: "2-digit" });
    const hh  = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const niceTime = `${hh}h${min}`;
    const dayISO = dateISO(d);

    const used = Array.isArray(c.enrollments) ? c.enrollments.length : 0;
    const cap  = (typeof c.capacity === "number") ? c.capacity : null;

    let full = false, badgeText = "", badgeStyle = "";
    if (cap === null) {
      badgeText = "Places illimitées";
      badgeStyle = "background:rgba(34,197,94,.12);color:#22c55e;";
    } else {
      const rest = Math.max(cap - used, 0);
      full = rest === 0;
      if (full) {
        badgeText = "Complet";
        badgeStyle = "background:rgba(239,68,68,.15);color:#f87171;";
      } else {
        badgeText = `${rest}/${cap} places`;
        badgeStyle = "background:rgba(34,197,94,.12);color:#22c55e;";
      }
    }

    const inPanier = panier.some(item => String(item.id) === String(c.id));
    const price = computeCoursePrice(currentMembership, panier);

    const btnLabel   = full ? "Complet" : (inPanier ? "Ajouté ✅" : "S’inscrire");
    const btnDisable = full ? "disabled" : "";
    const btnExtraCl = inPanier ? "selected" : "";

    return `
      <div class="item" data-id="${c.id}">
        <div class="item-top">
          <div>
            <b class="course-title" style="color:#fff;">${c.location}</b>
            <div class="course-meta" style="margin-top:6px;">
              <span class="course-date">${niceDate}</span>
              <span class="course-time">${niceTime}</span>
            </div>
            <span class="course-place" style="display:none;">${c.location}</span>
            <div class="course-price" style="margin-top:8px;">CHF ${price}.–</div>
          </div>
          <span class="badge" style="display:inline-block;border-radius:8px;border:1px solid rgba(255,255,255,.12);padding:4px 8px;font-size:12px;font-weight:800;${badgeStyle}">
            ${badgeText}
          </span>
        </div>

        <div style="margin-top:10px;">
          <button
            class="inscrire-btn ${btnExtraCl}"
            data-id="${c.id}"
            data-date="${dayISO}"
            data-location="${(c.location || "").replace(/"/g, "&quot;")}"
            data-time="${niceTime}"
            data-label-date="${niceDate}"
            data-price="${price}"
            ${btnDisable}
          >${btnLabel}</button>

          <span class="conflict-msg" style="display:none;color:#f87171;font-size:12px;font-weight:800;margin-top:8px;">
            Déjà un cours ce jour-là
          </span>
        </div>
      </div>
    `;
  }).join("");

  list.innerHTML = html || `<div class="item">Aucun cours ne correspond à ces filtres.</div>`;
  updateBasketBar();
}

// ===== Click sur un cours : multi-select + 1 cours par jour =====
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".inscrire-btn");
  if (!btn) return;

  // si complet
  if (btn.disabled) return;

  const id = btn.dataset.id;
  const date = btn.dataset.date;
  const location = btn.dataset.location || "";
  const time = btn.dataset.time || "";
  const labelDate = btn.dataset.labelDate || btn.getAttribute("data-label-date") || "";
  const price = Number(btn.dataset.price || "30");

  if (!id || !date) return;

  let panier = getPanier();

  // 1 seul cours par jour
  const sameDay = panier.find(c => c.date === date);
  const already = panier.find(c => String(c.id) === String(id));

  if (!already && sameDay && String(sameDay.id) !== String(id)) {
    const msg = btn.parentElement.querySelector(".conflict-msg");
    if (msg) {
      msg.style.display = "inline-block";
      setTimeout(() => { msg.style.display = "none"; }, 2200);
    }
    return;
  }

  if (already) {
    panier = panier.filter(c => String(c.id) !== String(id));
    btn.textContent = "S’inscrire";
    btn.classList.remove("selected");
  } else {
    panier.push({
      id,
      date,
      dateLabel: labelDate,
      time,
      location,
      price
    });
    btn.textContent = "Ajouté ✅";
    btn.classList.add("selected");
  }

  savePanier(panier);
  updateBasketBar();
});

// ===== Reset panier =====
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("basketClear")?.addEventListener("click", () => {
    savePanier([]);
    document.querySelectorAll(".inscrire-btn.selected").forEach(b => {
      b.classList.remove("selected");
      b.textContent = "S’inscrire";
    });
    updateBasketBar();
  });

  // Continuer → panier
  const goToBasket = () => {
    const panier = getPanier();
    if (!panier.length) return alert("Sélectionne au moins un cours.");
    // compat ancienne clé si tu veux
    try { localStorage.setItem("rsl_panier_cours", JSON.stringify(panier)); } catch {}
    window.location.href = "panier/panier.html";
  };

  document.getElementById("basketPay")?.addEventListener("click", goToBasket);
  document.getElementById("mobileInscrireBtn")?.addEventListener("click", () => {
    const panier = getPanier();
    if (panier.length) return goToBasket();
    document.getElementById("courseList")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, { passive: true });

  // Filtres
  ["filtreMois", "filtreLieu", "filtreDispo"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", loadCourses);
  });

  loadCourses();
});
