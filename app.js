let selected = null;
let lastOrderText = '';
const USD_TO_MGA = 4451.14;
// Remplace par ton numéro WhatsApp professionnel au format international, sans + ni espaces.
const WHATSAPP_NUMBER = '261XXXXXXXXX';

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

function updateProofLabel(){
  const payment = document.getElementById('payment').value;
  const label = document.getElementById('proofLabel');
  const input = document.getElementById('proof');
  if(payment === 'Binance Pay'){
    label.firstChild.textContent = 'TxID / preuve de paiement';
    input.placeholder = 'Ex : 8f3a... (TxID Binance Pay)';
  } else {
    label.firstChild.textContent = 'Référence / preuve de paiement';
    input.placeholder = 'Ex : référence de transaction MVola';
  }
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
    updateProofLabel();
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

function openOrderSuccess(){
  const modal = document.getElementById('orderSuccessModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}
function closeOrderSuccess(){
  const modal = document.getElementById('orderSuccessModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
}

function buildOrderText(order){
  return `Bonjour Game Zone X Store 👋\n\n📦 Commande : ${order.id}\n🎮 Jeu : ${order.game}\n💎 Pack : ${order.pack}\n💰 Montant : ${money(order.price)}\n🆔 UID : ${order.uid}\n👤 Pseudo : ${order.nickname || 'Non renseigné'}\n🙋 Client : ${order.customer}\n📱 Téléphone : ${order.phone}\n💳 Paiement : ${order.payment}\n🧾 Référence / TxID : ${order.proof}\n\nMerci de vérifier mon paiement et de traiter ma commande.`;
}

function renderSuccessDetails(order){
  document.getElementById('successOrderId').textContent = order.id;
  document.getElementById('successOrderDetails').innerHTML = `
    <div><span>Jeu</span><b>${escapeHtml(order.game)}</b></div>
    <div><span>Pack</span><b>${escapeHtml(order.pack)}</b></div>
    <div><span>UID</span><b>${escapeHtml(order.uid)}</b></div>
    <div><span>Montant</span><b>${money(order.price)}</b></div>
    <div><span>Paiement</span><b>${escapeHtml(order.payment)}</b></div>
  `;
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]);
}

async function saveOrderToFirestore(order){
  if(typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length || !firebase.firestore){
    throw new Error('Firebase Firestore n’est pas disponible.');
  }

  const auth = firebase.auth();
  const user = auth.currentUser;
  if(!user) throw new Error('Tu dois être connecté pour envoyer une commande.');

  const payload = {
    orderId: order.id,
    userId: user.uid,
    customerName: order.customer,
    phone: order.phone,
    game: order.game,
    playerId: order.uid,
    playerName: order.nickname || '',
    pack: order.pack,
    price: Number(order.price),
    paymentMethod: order.payment,
    transactionRef: order.proof,
    status: 'pending_payment',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  await firebase.firestore().collection('orders').add(payload);
}

function saveOrderLocally(order){
  const history = JSON.parse(localStorage.getItem('zonegame-orders') || '[]');
  history.unshift(order);
  localStorage.setItem('zonegame-orders', JSON.stringify(history.slice(0, 30)));
  localStorage.setItem('zonegame-new-notification', '1');
}

document.getElementById('orderForm').addEventListener('submit', async e => {
  e.preventDefault();
  if(!selected){
    toast('Choisis d’abord un pack de recharge.');
    return;
  }

  const uid = document.getElementById('uid').value.trim();
  const nickname = document.getElementById('nickname').value.trim();
  const customer = document.getElementById('customer').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const payment = document.getElementById('payment').value;
  const proof = document.getElementById('proof').value.trim();

  if(!uid || !customer || !phone || !proof){
    toast('Complète tous les champs obligatoires avant de confirmer.');
    return;
  }

  const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Enregistrement…';

  const order = {
    id: 'GZX-' + Date.now().toString().slice(-8),
    game: selected.game,
    pack: selected.pack,
    price: selected.price,
    payment,
    uid,
    nickname,
    customer,
    phone,
    proof,
    date: new Date().toLocaleString('fr-FR')
  };

  try {
    const isLocalPreview = (location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    const currentUser = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;

    if(isLocalPreview && !currentUser){
      // L’aperçu local permet de tester le parcours sans écrire dans Firestore.
      saveOrderLocally(order);
      toast('Aperçu local : commande enregistrée uniquement dans ce navigateur.');
    } else {
      await saveOrderToFirestore(order);
      saveOrderLocally(order);
      toast('Commande enregistrée dans Firestore.');
    }

    lastOrderText = buildOrderText(order);
    renderSuccessDetails(order);
    openOrderSuccess();
  } catch(err) {
    console.error(err);
    const message = err && err.message ? err.message : 'Impossible d’enregistrer la commande.';
    if(message.includes('permission-denied') || message.includes('Missing or insufficient permissions')){
      toast('Firestore refuse la commande : vérifie les règles de sécurité.');
    } else {
      toast(message);
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

document.getElementById('copyOrderBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(lastOrderText);
    toast('Détails de la commande copiés.');
  } catch {
    toast('Impossible de copier automatiquement.');
  }
});

document.getElementById('whatsappOrderBtn').addEventListener('click', () => {
  if(WHATSAPP_NUMBER.includes('X')){
    try { navigator.clipboard.writeText(lastOrderText); } catch(e){}
    toast('Commande copiée. Configure ton numéro WhatsApp dans app.js.');
    return;
  }
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lastOrderText)}`, '_blank');
});

document.getElementById('closeOrderSuccess').addEventListener('click', closeOrderSuccess);
document.getElementById('orderSuccessModal').addEventListener('click', e => {
  if(e.target.id === 'orderSuccessModal') closeOrderSuccess();
});

document.addEventListener('keydown', e => {
  if(e.key === 'Escape') closeOrderSuccess();
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
updateProofLabel();

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
      <strong>${escapeHtml(o.game)} — ${escapeHtml(o.pack)}</strong>
      <small>${new Intl.NumberFormat('fr-FR').format(o.price)} Ar • ${escapeHtml(o.payment)}<br>UID : ${escapeHtml(o.uid)}<br>N° : ${escapeHtml(o.id)}<br>${escapeHtml(o.date)}</small>
      <span class="history-status">Commande enregistrée</span>
    </div>
  `).join('');
}

document.getElementById('historyBtn').addEventListener('click',()=>{
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
