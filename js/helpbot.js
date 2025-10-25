
(function(){
  const $ = (sel, root=document)=> root.querySelector(sel);
  const panel = $('#hbPanel');
  const openBtn = $('#hbOpen');
  const closeBtn = $('#hbClose');
  const minBtn = $('#hbMin');
  const body = $('#hbBody');
  const input = $('#hbInput');
  const send = $('#hbSend');

  const KB = [
    { kw: ['cours','samedi','réserver','inscription cours','prix cours','tarif'],
      answer: "Pour les cours :\n• Prix public 30.– / membre 20.–\n• Réserve les samedis depuis la page Cours.\n• Modification possible selon conditions.\n\n➡️ Ouvrir la page Cours.",
      links: [{label:'Aller à Cours', href:'cours.html'}]},
    { kw: ['membre','adhésion','devenir membre','licence'],
      answer: "Adhésion RSL : avantages, tarifs et conditions sur la page dédiée.",
      links: [{label:'Devenir membre', href:'membres.html'}]},
    { kw: ['formation','moniteur','prof','formateur'],
      answer: "Programme, objectifs et inscriptions des formations RSL.",
      links: [{label:'Voir Formation RSL', href:'formation.html'}]},
    { kw: ['événement','contest','compétition','calendrier','event'],
      answer: "Calendrier RSL (Montreux, Valais, Fribourg…).",
      links: [{label:'Calendrier 2026', href:'evenements.html'}]},
    { kw: ['paiement','stripe','twint','facture','facturation','prix','tarif','remboursement','rétractation'],
      answer: "Paiement : cartes (Stripe) et TWINT. Détails et remboursements dans nos CGU/CGV.",
      links: [{label:'Lire CGU — Paiement', href:'reglement.html#paiement'}]},
    { kw: ['cgu','cgv','conditions','rétractation','responsabilité','données','cookies','modifications','for'],
      answer: "Toutes les conditions (CGU/CGV), droit de rétractation, responsabilité et données sont ici :",
      links: [{label:'Lire les CGU/CGV', href:'reglement.html'}]},
    { kw: ['contact','email','téléphone','whatsapp','aide','humain','message'],
      answer: "Besoin d’écrire directement ?",
      links: [
        {label:'Page Contact', href:'contact.html'},
        {label:'Envoyer un e-mail', href:'mailto:rsl.meuwly@gmail.com'}
      ]},
  ];

  const QUICK = [
    {label:'Cours', q:'cours'},
    {label:'Devenir membre', q:'membre'},
    {label:'Formation', q:'formation'},
    {label:'Événements', q:'événement'},
    {label:'Paiement', q:'paiement'},
    {label:'CGU/CGV', q:'conditions'},
    {label:'Contact', q:'contact'},
  ];

  function open(){ if(panel){ panel.style.display='block'; } if(openBtn){ openBtn.style.display='none'; } }
  function close(){ if(panel){ panel.style.display='none'; } if(openBtn){ openBtn.style.display='flex'; } }

  if(openBtn){ openBtn.addEventListener('click', ()=>{ open(); if(body && body.dataset.boot!=='1'){ greet(); body.dataset.boot='1'; }}); }
  if(closeBtn){ closeBtn.addEventListener('click', close); }
  if(minBtn){ minBtn.addEventListener('click', close); }

  if(send){ send.addEventListener('click', onSend); }
  if(input){ input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ onSend(); }}); }

  function addMsg(text, who='bot', links=null){
    if(!body) return;
    const row = document.createElement('div');
    row.className = `hb-msg ${who}`;
    const bubble = document.createElement('div');
    bubble.className='bubble';
    bubble.textContent=text;
    row.appendChild(bubble);
    if(links && links.length){
      const linksWrap = document.createElement('div');
      linksWrap.className='hb-quick hb-links';
      links.forEach(l=>{
        const a=document.createElement('a');
        a.href=l.href; a.textContent=l.label; a.target = l.href.startsWith('http') ? '_blank' : '_self';
        a.style.display='inline-block'; a.style.marginRight='8px';
        linksWrap.appendChild(a);
      });
      row.appendChild(linksWrap);
    }
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
  }

  function greet(){
    addMsg("Salut 👋 Je peux t’aider : cours, adhésion, paiement, événements ou conditions. Tape ta question ou choisis un raccourci ci-dessous.");
    const wrap = document.createElement('div');
    wrap.className='hb-quick';
    QUICK.forEach(q=>{
      const b=document.createElement('button');
      b.className='hb-chip'; b.textContent=q.label;
      b.addEventListener('click', ()=> handleQuery(q.q));
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
  }

  function onSend(){
    if(!input) return;
    const text = input.value.trim();
    if(!text) return;
    addMsg(text, 'user');
    input.value='';
    handleQuery(text);
  }

  function handleQuery(text){
    const q = (text||'').toLowerCase();
    let best=null, score=0;
    for(const item of KB){
      let s=0;
      for(const k of item.kw){ if(q.includes(k)) s++; }
      if(s>score){ score=s; best=item; }
    }
    if(best && score>0){
      addMsg(best.answer,'bot',best.links);
    }else{
      addMsg("Je n’ai pas trouvé exactement. Tu peux consulter les CGU/CGV ou m’écrire :", 'bot', [
        {label:'CGU/CGV', href:'reglement.html'},
        {label:'Page Contact', href:'contact.html'},
        {label:'Envoyer un e-mail', href:'mailto:rsl.meuwly@gmail.com'}
      ]);
    }
  }
})();
