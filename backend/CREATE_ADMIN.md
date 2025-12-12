# Création du Compte Administrateur Unique

## ⚠️ IMPORTANT : Un Seul Compte Admin

Le système a **UN SEUL compte administrateur** avec des identifiants **hardcodés dans le code** :

- **Email** : `admin@formini.com`
- **Mot de passe** : `formini.lab2025`

Ces identifiants sont définis dans : `backend/src/utils/adminConfig.js`

## Instructions pour créer le compte admin

### Méthode 1 : Via le script (Recommandé)

1. Ouvrez un terminal dans le dossier `backend`
2. Exécutez la commande :
   ```bash
   npm run create-admin
   ```

3. Le script va :
   - ✅ Supprimer automatiquement tous les autres comptes admin
   - ✅ Créer ou mettre à jour le compte admin unique
   - ✅ Garantir qu'il n'y a qu'un seul admin dans le système

### Méthode 2 : Création manuelle via MongoDB

Si vous préférez créer l'admin directement dans MongoDB :

```javascript
// Dans MongoDB Compass ou mongo shell
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash('formini.lab2025', 12);

db.users.insertOne({
  nom: "Admin",
  prenom: "Formini",
  email: "admin@formini.com",
  mdp: hashedPassword,
  role: "admin",
  statut: "active",
  isVerified: true,
  dateinscri: new Date()
})
```

## Connexion

Connectez-vous avec :
- **Email** : `admin@formini.com`
- **Mot de passe** : `formini.lab2025`

## Sécurité

⚠️ **IMPORTANT** :
- Il ne peut y avoir qu'**UN SEUL compte admin** dans le système
- Les identifiants sont **hardcodés** dans `backend/src/utils/adminConfig.js`
- La création de comptes admin via l'inscription publique est **BLOQUÉE**
- L'email `admin@formini.com` ne peut pas être utilisé pour d'autres comptes
- Seul le script `create-admin` peut créer/mettre à jour le compte admin
- Le compte admin principal ne peut pas être suspendu ou modifié

## Fonctionnalités Admin

Le compte admin peut :
- ✅ Voir toutes les statistiques de la plateforme
- ✅ Gérer tous les utilisateurs (activer/suspendre)
- ✅ Approuver/rejeter les formateurs en attente
- ✅ Télécharger et consulter les CV des formateurs
- ✅ Voir tous les cours, leçons, quiz, etc.
- ✅ Gérer tous les aspects de la plateforme

## Fichier de Configuration

Les identifiants admin sont centralisés dans :
```
backend/src/utils/adminConfig.js
```

Ce fichier contient :
- `ADMIN_EMAIL` : L'email du compte admin unique
- `ADMIN_PASSWORD` : Le mot de passe du compte admin unique
- `isMainAdminUser(user)` : Fonction pour vérifier si un utilisateur est l'admin principal
- `isAdminEmail(email)` : Fonction pour vérifier si un email est celui de l'admin
