# Game Zone X Store — Commandes + Firestore

Cette version connecte le formulaire de commande à la collection Firestore `orders` du projet `game-zone-x-store`.

## Ce qui est ajouté
- Enregistrement réel des commandes dans Firestore pour les utilisateurs connectés.
- Mapping exact vers les champs : `orderId`, `userId`, `customerName`, `phone`, `game`, `playerId`, `playerName`, `pack`, `price`, `paymentMethod`, `transactionRef`, `status`.
- `createdAt` est ajouté automatiquement avec un timestamp Firestore.
- Statut initial : `pending_payment`.
- L'historique local reste disponible pour le client.
- En aperçu local (`file://`), une commande est enregistrée uniquement dans le navigateur afin de tester l'interface sans contourner Firestore.
- Firebase Authentication Google + téléphone reste actif.

## Règles Firestore
Le fichier `firestore.rules` contient une règle de départ :
- un utilisateur connecté peut créer sa propre commande ;
- il peut lire uniquement ses propres commandes ;
- aucune modification/suppression côté client.

Dans Firebase Console → Firestore → Règles, colle le contenu de `firestore.rules`, puis publie les règles.

## Important
La version locale ne peut pas effectuer un vrai enregistrement Firestore sans authentification valide et sans règles autorisant l'écriture. Pour tester l'écriture réelle, le site doit être servi en HTTPS/HTTP (par exemple Firebase Hosting) et le client doit être connecté.

Ne mets jamais une clé secrète de fournisseur de recharge dans le JavaScript du navigateur. Une future automatisation de recharge fournisseur devra passer par un backend sécurisé.

Le code USSD MVola affiché dans l'interface doit être vérifié auprès de MVola avant publication définitive.
