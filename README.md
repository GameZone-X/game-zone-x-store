# ZoneGame — version améliorée

Cette version améliore directement ton site existant, sans repartir sur un autre projet.

### Ajouts
- Mode sombre / clair avec mémorisation.
- Paiement MVola : **038 10 932 12**.
- Paiement Binance Pay avec ton QR.
- Sélection MVola / Binance Pay dans le formulaire.
- Calcul indicatif du montant USDT.
- Bouton pour copier le code USSD.
- Tarifs Free Fire MENA :
  - 110 = 4 500 Ar
  - 231 = 8 900 Ar
  - 583 = 22 400 Ar
  - 1 188 = 44 500 Ar
  - 2 420 = 88 500 Ar
- Design mobile plus propre.

### Important
Le site reste un frontend statique : il ne vérifie pas automatiquement les paiements et ne recharge pas automatiquement les comptes.

Le code USSD affiché dans la page est celui configuré pour ton projet. Vérifie-le avec MVola avant publication définitive.

Pour WhatsApp, ouvre `app.js` et remplace :
`261XXXXXXXXX`
par ton numéro WhatsApp professionnel au format international, sans `+` ni espaces.

Pour une automatisation complète plus tard : backend + paiement MVola/API + vérification Binance Pay + API fournisseur.

### Menu accueil
Ordre des jeux : Free Fire, PUBG Mobile, Blood Strike, Mobile Legends, Delta Force. Aucun tarif Free Fire n'est affiché dans le menu accueil; les tarifs restent dans la section de recharge après sélection.

### Menu accueil actuel
3 jeux uniquement : Free Fire, PUBG Mobile, Blood Strike. Blood Strike est marqué « Bientôt disponible ». Les anciennes images du menu ont été supprimées.

### Affichage des tarifs
Au chargement de l'accueil, aucun tarif Free Fire ou PUBG n'est affiché. Le client doit d'abord choisir Free Fire ou PUBG Mobile dans le menu « Choisis le jeu à commander » pour afficher le catalogue et les tarifs correspondants.

## Connexion Google
Le site contient une porte d'accès Google avec Firebase Authentication. Pour l'activer, renseigne les valeurs de ton projet Firebase dans `firebase-config.js`, puis active Google dans Firebase Authentication > Sign-in method. Ajoute également le domaine de ton site dans Authorized domains.


## Connexion Google + téléphone
La page d'accès propose maintenant deux méthodes : Google et numéro de téléphone par SMS (OTP).
Dans Firebase Authentication, active **Google** et **Phone / Téléphone**. Pour le téléphone, utilise le format international, par exemple `+261341234567`. Firebase utilise reCAPTCHA pour protéger l'envoi des SMS.
