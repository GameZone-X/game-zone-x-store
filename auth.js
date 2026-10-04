(function(){
  const gate = document.getElementById('authGate');
  const shell = document.getElementById('appShell');
  const btn = document.getElementById('googleLoginBtn');
  const status = document.getElementById('authStatus');
  const userBox = document.getElementById('userBox');
  const userPhoto = document.getElementById('userPhoto');
  const userName = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');
  const supportBtn = document.querySelector('.support');
  const phoneInput = document.getElementById('phoneAuthInput');
  const sendCodeBtn = document.getElementById('sendCodeBtn');
  const codeBox = document.getElementById('codeBox');
  const smsCodeInput = document.getElementById('smsCodeInput');
  const verifyCodeBtn = document.getElementById('verifyCodeBtn');
  const cfg = window.ZONEGAME_FIREBASE_CONFIG || {};
  const previewBtn = document.getElementById('previewBtn');
  const isLocalPreview = (location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  if(isLocalPreview && previewBtn){
    previewBtn.hidden = false;
    previewBtn.addEventListener('click', () => {
      previewMode = true;
      gate.classList.add('hidden');
      shell.classList.add('ready');
      shell.setAttribute('aria-hidden','false');
      window.scrollTo(0,0);
      if(typeof window.initAppPreview === 'function') window.initAppPreview();
    });
  }
  const configured = cfg.apiKey && cfg.projectId && cfg.appId && !String(cfg.apiKey).includes('REMPLACE');
  let confirmationResult = null;
  let recaptchaVerifier = null;
  let previewMode = false;

  function setStatus(msg, error=false){
    status.textContent = msg;
    status.classList.toggle('error', error);
  }
  function showApp(user){
    gate.classList.add('hidden');
    shell.classList.add('ready');
    shell.setAttribute('aria-hidden','false');
    if(user){
      userBox.hidden = false;
      if(supportBtn) supportBtn.hidden = true;
      const label = user.displayName || user.email || user.phoneNumber || 'Compte connecté';
      userName.textContent = label;
      if(user.photoURL){ userPhoto.src = user.photoURL; userPhoto.hidden = false; }
      else userPhoto.hidden = true;
    }
  }
  function showGate(){
    gate.classList.remove('hidden');
    shell.classList.remove('ready');
    shell.setAttribute('aria-hidden','true');
    userBox.hidden = true;
    if(supportBtn) supportBtn.hidden = false;
  }

  if(!configured){
    btn.disabled = true;
    sendCodeBtn.disabled = true;
    setStatus('Firebase doit être configuré dans firebase-config.js.', true);
    return;
  }

  try {
    if(!firebase.apps.length) firebase.initializeApp(cfg);
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      setStatus('Ouverture de Google…');
      try {
        await auth.signInWithPopup(provider);
      } catch(err) {
        console.error(err);
        setStatus(err && err.message ? err.message : 'Connexion Google impossible.', true);
      } finally { btn.disabled = false; }
    });

    function setupRecaptcha(){
      if(recaptchaVerifier) return;
      recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: function(){},
        'expired-callback': function(){ setStatus('Le contrôle de sécurité a expiré. Réessaie.', true); }
      });
      recaptchaVerifier.render().catch(console.error);
    }

    sendCodeBtn.addEventListener('click', async () => {
      const phone = phoneInput.value.trim().replace(/\s+/g,'');
      if(!/^\+[1-9]\d{7,14}$/.test(phone)){
        setStatus('Entre le numéro au format international, par exemple +261341234567.', true);
        phoneInput.focus();
        return;
      }
      sendCodeBtn.disabled = true;
      setStatus('Envoi du code SMS…');
      try {
        setupRecaptcha();
        confirmationResult = await auth.signInWithPhoneNumber(phone, recaptchaVerifier);
        codeBox.hidden = false;
        smsCodeInput.focus();
        setStatus('Code SMS envoyé. Entre les 6 chiffres reçus.');
      } catch(err) {
        console.error(err);
        if(recaptchaVerifier){
          try { recaptchaVerifier.clear(); } catch(e){}
          recaptchaVerifier = null;
        }
        setStatus(err && err.message ? err.message : 'Impossible d’envoyer le SMS.', true);
      } finally { sendCodeBtn.disabled = false; }
    });

    verifyCodeBtn.addEventListener('click', async () => {
      const code = smsCodeInput.value.trim();
      if(!confirmationResult){ setStatus('Demande d’abord un code SMS.', true); return; }
      if(!/^\d{6}$/.test(code)){ setStatus('Entre le code SMS à 6 chiffres.', true); return; }
      verifyCodeBtn.disabled = true;
      setStatus('Vérification du code…');
      try {
        await confirmationResult.confirm(code);
      } catch(err) {
        console.error(err);
        setStatus(err && err.message ? err.message : 'Code incorrect ou expiré.', true);
      } finally { verifyCodeBtn.disabled = false; }
    });

    logoutBtn.addEventListener('click', () => auth.signOut());
    auth.onAuthStateChanged(user => { if(previewMode) return; user ? showApp(user) : showGate(); });
  } catch(err){
    console.error(err);
    btn.disabled = true;
    sendCodeBtn.disabled = true;
    setStatus('Configuration Firebase invalide.', true);
  }
})();
