// Mobile nav toggle
const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav-toggle');
if (toggle) {
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
}

// Dialog popup after 10s on index only if #dlg exists
const dlg = document.getElementById('dlg');
if (dlg && typeof dlg.showModal === 'function') {
  setTimeout(() => dlg.showModal(), 10000);
  dlg.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close')) dlg.close();
  });
}

// Formation capacity per date (client-side demo using localStorage)
function setupCapacity(formId, selectId, capacity = 20) {
  const form = document.getElementById(formId);
  const sel = document.getElementById(selectId);
  if (!form || !sel) return;

  const key = 'rsl_capacity_2026';
  let counts = {};
  try { counts = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}

  Array.from(sel.options).forEach(opt => {
    const c = counts[opt.value] || 0;
    if (opt.value && c >= capacity) {
      opt.disabled = true;
      opt.textContent += ' — COMPLET';
      opt.style.color = '#E10600';
    }
  });

  form.addEventListener('submit', () => {
    const date = sel.value;
    if (!date) return;
    counts[date] = (counts[date] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(counts));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupCapacity('formationForm', 'formationDate', 20);
});
