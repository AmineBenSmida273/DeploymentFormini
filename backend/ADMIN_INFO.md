# Compte Administrateur Unique

## Identifiants (Hardcodés dans le code)

Les identifiants du compte admin sont directement dans le code source :

**Fichier** : `backend/src/utils/adminConfig.js`

```javascript
const ADMIN_EMAIL = 'admin@formini.com';
const ADMIN_PASSWORD = 'formini.lab2025';
```

## Caractéristiques

- ✅ **UN SEUL compte admin** possible dans tout le système
- ✅ Les identifiants sont **hardcodés** dans le code (pas de .env nécessaire)
- ✅ Le compte est **créé automatiquement** au démarrage du serveur s'il n'existe pas
- ✅ Tous les autres comptes admin sont **automatiquement supprimés**
- ✅ **Impossible** de créer d'autres comptes admin via l'inscription
- ✅ **Impossible** de modifier ou suspendre le compte admin principal

## Connexion

- **Email** : `admin@formini.com`
- **Mot de passe** : `formini.lab2025`

## Création manuelle (optionnel)

Si vous voulez créer le compte manuellement avant le démarrage :

```bash
npm run create-admin
```

Le script garantit qu'il n'y a qu'un seul admin avec les identifiants hardcodés.

## Sécurité

- Le compte admin principal ne peut pas être suspendu
- Le compte admin principal ne peut pas être modifié
- Tous les autres comptes admin sont automatiquement supprimés
- L'email `admin@formini.com` est réservé et ne peut pas être utilisé pour d'autres comptes
