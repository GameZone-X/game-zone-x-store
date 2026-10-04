(function(){
  const CART_KEY='gzx-cart-v1';
  // V5.3: checkout stays hidden until the user opens the cart and continues.
  const cart=[];
  const money=n=>new Intl.NumberFormat('fr-FR').format(n)+' Ar';
  const load=()=>{try{const x=JSON.parse(localStorage.getItem(CART_KEY)||'[]'); if(Array.isArray(x)) cart.push(...x)}catch{}};
  const save=()=>localStorage.setItem(CART_KEY,JSON.stringify(cart));
  const $=id=>document.getElementById(id);
  const drawer=$('cartDrawer'), checkout=$('checkoutDrawer');
  const badge=$('cartCount');
  const empty=$('cartEmpty'), itemsEl=$('cartItems'), totalEl=$('cartTotal');
  const openCart=()=>{render();drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');document.body.classList.add('drawer-open')};
  const closeCart=()=>{drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');document.body.classList.remove('drawer-open')};
  const openCheckout=()=>{if(!cart.length){toast('Ton panier est vide.');return} closeCart(); checkout.classList.add('open');checkout.setAttribute('aria-hidden','false');document.body.classList.add('drawer-open'); renderCheckoutSummary()};
  const closeCheckout=()=>{checkout.classList.remove('open');checkout.setAttribute('aria-hidden','true');document.body.classList.remove('drawer-open')};
  function toast(msg){ if(window.toast) window.toast(msg); else alert(msg); }
  function count(){return cart.reduce((s,x)=>s+x.qty,0)}
  function total(){return cart.reduce((s,x)=>s+x.price*x.qty,0)}
  function render(){
    const c=count(); badge.textContent=c; badge.hidden=!c; totalEl.textContent=money(total());
    if(!cart.length){empty.hidden=false;itemsEl.innerHTML='';return}
    empty.hidden=true;
    itemsEl.innerHTML=cart.map((x,i)=>`<div class="cart-item">
      <div class="cart-item-icon">${x.game.toLowerCase().includes('pubg')?'🎯':'💎'}</div>
      <div class="cart-item-main"><b>${x.pack}</b><small>${x.game}</small><strong>${money(x.price*x.qty)}</strong></div>
      <div class="qty"><button type="button" data-q="-" data-i="${i}">−</button><span>${x.qty}</span><button type="button" data-q="+" data-i="${i}">+</button></div>
      <button class="remove-item" type="button" data-remove="${i}" aria-label="Supprimer">×</button>
    </div>`).join('');
    itemsEl.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;cart[i].qty+=b.dataset.q==='+'?1:-1;if(cart[i].qty<=0)cart.splice(i,1);save();render()});
    itemsEl.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.remove,1);save();render()});
  }
  function add(btn){
    const item={game:btn.dataset.game,pack:btn.dataset.pack,price:Number(btn.dataset.price),qty:1};
    const found=cart.find(x=>x.game===item.game&&x.pack===item.pack);
    if(found) found.qty++; else cart.push(item); save(); render(); openCart();
  }
  function renderCheckoutSummary(){
    $('checkoutUssdAmount').textContent=total();
    $('checkoutSummary').innerHTML=cart.map(x=>`<div><span>${x.qty}× ${x.pack}</span><b>${money(x.price*x.qty)}</b></div>`).join('');
    $('checkoutTotal').textContent=money(total());
  }
  document.querySelectorAll('.product').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();add(btn)}));
  $('historyBtn')?.addEventListener('click',e=>{e.preventDefault();openCart()});
  $('closeCart')?.addEventListener('click',closeCart);
  $('continueCart')?.addEventListener('click',openCheckout);
  $('closeCheckout')?.addEventListener('click',closeCheckout);
  $('backToCart')?.addEventListener('click',()=>{closeCheckout();openCart()});
  $('clearCart')?.addEventListener('click',()=>{cart.length=0;save();render();toast('Panier vidé.')});
  [drawer,checkout].forEach(el=>el?.addEventListener('click',e=>{if(e.target===el){el.classList.remove('open');el.setAttribute('aria-hidden','true');document.body.classList.remove('drawer-open')}}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeCheckout()}});
  $('checkoutForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    if(!cart.length){toast('Panier vide.');return}
    const uid=$('checkoutUid').value.trim(), nick=$('checkoutNick').value.trim(), customer=$('checkoutCustomer').value.trim(), phone=$('checkoutPhone').value.trim(), payment=$('checkoutPayment').value, proof=$('checkoutProof').value.trim()||'Non renseignée';
    if(!uid||!customer||!phone){toast('Remplis les informations obligatoires.');return}
    const orders=JSON.parse(localStorage.getItem('zonegame-orders')||'[]');
    cart.forEach(x=>orders.unshift({id:Date.now()+Math.random(),game:x.game,pack:x.pack,price:x.price*x.qty,payment,uid,proof,date:new Date().toLocaleString('fr-FR')}));
    localStorage.setItem('zonegame-orders',JSON.stringify(orders.slice(0,30)));localStorage.setItem('zonegame-new-notification','1');
    const lines=cart.map(x=>`• ${x.qty}× ${x.pack} — ${money(x.price*x.qty)}`).join('\n');
    const text=`Bonjour Game Zone X Store 👋\n\n🎮 Commande\n${lines}\n\n💰 Total : ${money(total())}\n🆔 UID : ${uid}\n👤 Pseudo : ${nick||'Non renseigné'}\n🙋 Client : ${customer}\n📱 Téléphone : ${phone}\n💳 Paiement : ${payment}\n🧾 Référence : ${proof}\n\nMerci de vérifier mon paiement et de traiter la commande.`;
    const whatsappNumber='261XXXXXXXXX';
    if(whatsappNumber.includes('X')){navigator.clipboard?.writeText(text);toast('Commande copiée. Le numéro WhatsApp doit être configuré dans cart-ui.js.')} else window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`,'_blank');
  });
  document.querySelectorAll('.checkout-pay').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.checkout-pay').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('checkoutPayment').value=b.dataset.payment;document.querySelectorAll('.checkout-payment-panel').forEach(x=>x.classList.remove('active'));$(b.dataset.payment==='MVola'?'checkoutMvola':'checkoutBinance').classList.add('active')}));
  $('checkoutCopyUssd')?.addEventListener('click',async()=>{const amount=total();const text=`*111*1*2*0381093212*${amount}*2*0*#`;try{await navigator.clipboard.writeText(text);toast('Code MVola copié.')}catch{toast(text)}});
  load();render();
  window.GZXCart={open:openCart,add};
})();
