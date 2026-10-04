let selected = null;
const USD_TO_MGA = 4451.14;
const money = n => new Intl.NumberFormat('fr-FR').format(n) + ' Ar';

const toast = msg => {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => t.classList.remove('show'), 3500);
};

function updatePaymentDetails(){
  if(!selected){
    document.getElementById('cryptoAmount').textContent = 'Sélectionne un pack';
    document.getElementById('ussdBox').innerHTML = '*111*1*2*0381093212*<span>MONTANT</span>*2*0*#';
    return;
  }
  const usdt = (selected.price / USD_TO_MGA).toFixed(2);
  document.getElementById('cryptoAmount').textContent = `≈ ${usdt} USDT`;
  document.getElementById('ussdBox').innerHTML = `*111*1*2*0381093212*<span>${selected.price}</span>*2*0*#`;
}

document.querySelectorAll('.product').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.product').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    selected = {
      game: btn.dataset.game,
      pack: btn.dataset.pack,
      price: Number(btn.dataset.price)
    };
    document.getElementById('selectedProduct').textContent = selected.pack + ' • ' + selected.game;
    document.getElementById('selectedPrice').textContent = money(selected.price);
    updatePaymentDetails();
    document.getElementById('order').scrollIntoView({behavior:'smooth', block:'start'});
  });
});

document.querySelectorAll('.pay-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pay-tab').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    const payment = tab.dataset.payment;
    document.getElementById('payment').value = payment;
    document.getElementById('mvolaPanel').classList.toggle('active', payment === 'MVola');
    document.getElementById('binancePanel').classList.toggle('active', payment === 'Binance Pay');
  });
});

document.getElementById('copyUssd').addEventListener('click', async () => {
  const box = document.getElementById('ussdBox');
  const text = box.textContent;
  try {
    await navigator.clipboard.writeText(text);
    toast('Code USSD copié.');
  } catch {
    toast('Impossible de copier automatiquement. Sélectionne le code.');
  }
});

document.getElementById('orderForm').addEventListener('submit', e => {
  e.preventDefault();
  if(!selected){
    toast('Choisis d’abord un pack de recharge.');
    return;
  }

  const uid = document.getElementById('uid').value.trim();
  const nick = document.getElementById('nickname').value.trim();
  const customer = document.getElementById('customer').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const payment = document.getElementById('payment').value;
  const proof = document.getElementById('proof').value.trim() || 'Non renseignée';

  const history = JSON.parse(localStorage.getItem('zonegame-orders') || '[]');
  history.unshift({
    id: Date.now(),
    game: selected.game,
    pack: selected.pack,
    price: selected.price,
    payment,
    uid,
    proof,
    date: new Date().toLocaleString('fr-FR')
  });
  localStorage.setItem('zonegame-orders', JSON.stringify(history.slice(0, 30)));
  localStorage.setItem('zonegame-new-notification', '1');

  const text =
`Bonjour Game Zone X Store 👋

🎮 Jeu : ${selected.game}
💎 Pack : ${selected.pack}
💰 Montant : ${money(selected.price)}
🆔 UID : ${uid}
👤 Pseudo : ${nick || 'Non renseigné'}
🙋 Client : ${customer}
📱 Téléphone : ${phone}
💳 Paiement : ${payment}
🧾 Référence : ${proof}

Merci de vérifier mon paiement et de traiter la commande.`;

  // Remplace ce numéro par ton WhatsApp professionnel au format international.
  const whatsappNumber = '261XXXXXXXXX';

  if(whatsappNumber.includes('X')){
    navigator.clipboard?.writeText(text);
    toast('Commande copiée. Remplace le numéro WhatsApp dans app.js.');
  } else {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  }
});

const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('zonegame-theme') || 'light';
document.documentElement.dataset.theme = savedTheme;
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('zonegame-theme', next);
  themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
});

updatePaymentDetails();

const openBinanceQr = document.getElementById('openBinanceQr');
const closeBinanceQr = document.getElementById('closeBinanceQr');
const binanceQrModal = document.getElementById('binanceQrModal');

function setBinanceQrModal(open){
  if(!binanceQrModal) return;
  binanceQrModal.classList.toggle('open', open);
  binanceQrModal.setAttribute('aria-hidden', open ? 'false' : 'true');
}

openBinanceQr?.addEventListener('click', () => setBinanceQrModal(true));
closeBinanceQr?.addEventListener('click', () => setBinanceQrModal(false));
binanceQrModal?.addEventListener('click', e => { if(e.target === binanceQrModal) setBinanceQrModal(false); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') setBinanceQrModal(false); });

const gamesMenu = document.getElementById('games');
const catalogBackWrap = document.getElementById('catalogBackWrap');

function showCatalog(target){
  document.querySelectorAll('.catalog-section').forEach(section => section.classList.remove('catalog-visible'));
  const section = document.getElementById(target);
  if(section){
    section.classList.add('catalog-visible');
    catalogBackWrap.classList.add('visible');
    section.scrollIntoView({behavior:'smooth', block:'start'});
  }
}

document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const target = card.dataset.gameTarget;
    if (target === 'freefire' || target === 'pubg') showCatalog(target);
    else toast('Ce jeu sera disponible bientôt.');
  });
});

document.getElementById('backToGames').addEventListener('click', () => {
  document.querySelectorAll('.catalog-section').forEach(section => section.classList.remove('catalog-visible'));
  catalogBackWrap.classList.remove('visible');
  gamesMenu.scrollIntoView({behavior:'smooth', block:'start'});
});

document.querySelectorAll('nav a[href="#freefire"], nav a[href="#pubg"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showCatalog(link.getAttribute('href').slice(1));
  });
});

function renderHistory(){
  const list=document.getElementById('historyList');
  const history=JSON.parse(localStorage.getItem('zonegame-orders') || '[]');
  if(!history.length){
    list.innerHTML='<div class="empty-history">Aucune commande enregistrée pour le moment.</div>';
    return;
  }
  list.innerHTML=history.map(o=>`
    <div class="history-item">
      <strong>${o.game} — ${o.pack}</strong>
      <small>${new Intl.NumberFormat('fr-FR').format(o.price)} Ar • ${o.payment}<br>UID : ${o.uid}<br>${o.date}</small>
      <span class="history-status">Commande enregistrée</span>
    </div>
  `).join('');
}

document.getElementById('historyBtn').addEventListener('click',()=>{
  if(window.GZXCart) return;
  renderHistory();
  document.getElementById('historyModal').classList.add('open');
  document.getElementById('historyModal').setAttribute('aria-hidden','false');
});
document.getElementById('closeHistory').addEventListener('click',()=>{
  document.getElementById('historyModal').classList.remove('open');
});
document.getElementById('historyModal').addEventListener('click',e=>{
  if(e.target.id==='historyModal') e.currentTarget.classList.remove('open');
});
document.getElementById('clearHistory').addEventListener('click',()=>{
  localStorage.removeItem('zonegame-orders');
  localStorage.removeItem('zonegame-new-notification');
  renderHistory();
  (document.getElementById('notifyBtn') || document.getElementById('historyBtn')).classList.remove('has-new');
  toast('Historique effacé.');
});

const notifyBtn=document.getElementById('notifyBtn') || document.getElementById('historyBtn');
if(localStorage.getItem('zonegame-new-notification')==='1') notifyBtn.classList.add('has-new');
notifyBtn.addEventListener('click',()=>{
  notifyBtn.classList.remove('has-new');
  localStorage.removeItem('zonegame-new-notification');
  const history=JSON.parse(localStorage.getItem('zonegame-orders') || '[]');
  if(history.length) toast(`Dernière commande : ${history[0].game} • ${history[0].pack}`);
  else toast('Aucune nouvelle notification.');
});


// Header V4 — compact mobile menu
(function(){
  const menuBtn=document.getElementById('menuBtn');
  const nav=document.getElementById('mainNav');
  if(!menuBtn||!nav) return;
  menuBtn.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded',open?'true':'false');
    menuBtn.textContent=open?'✕':'☰';
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded','false');
    menuBtn.textContent='☰';
  }));
})();
