# Venio - Plateforme de Gestion de Projets Clients

## 📋 Description

Venio est une plateforme complète de gestion de projets permettant aux agences et freelances de gérer leurs projets clients avec un espace dédié pour chaque client.

## ✨ Fonctionnalités principales

### 🔐 Authentification
- Système de connexion sécurisé
- Rôles : ADMIN et CLIENT
- Protection des routes par authentification

### 👥 Gestion des comptes clients
- Création de comptes clients par l'admin
- Liste et détails des clients
- Association de projets aux clients

### 📁 Gestion des projets
- Création et modification de projets
- Statuts : En cours, En attente, Terminé
- Organisation par sections et éléments

### 📦 Système de contenu enrichi
- **Sections** : Organisez le contenu en parties logiques
- **Éléments** : 10 types différents (Livrable, Devis, Facture, etc.)
- **Contrôle de visibilité** : L'admin décide ce que le client voit
- **Upload de fichiers** : Joignez des fichiers à chaque élément
- **Téléchargement contrôlé** : Autorisez ou non le téléchargement

### 📢 Communication
- Mises à jour de projet
- Historique chronologique
- Notifications visuelles

### 📄 Documents
- Upload de documents
- Téléchargement sécurisé
- Types : Devis, Facture, Fichier projet

## 🛠️ Technologies

### Backend
- **Node.js** + **Express**
- **MongoDB** avec Mongoose
- **JWT** pour l'authentification
- **Multer** pour l'upload de fichiers
- **bcrypt** pour le hashage des mots de passe

### Frontend
- **React** + **Vite**
- **React Router** pour la navigation
- **CSS** moderne avec animations

## 📂 Structure du projet

```
Venio/
├── backend/
│   ├── src/
│   │   ├── models/          # Modèles MongoDB
│   │   ├── routes/          # Routes API
│   │   │   ├── admin/       # Routes admin
│   │   │   └── client/      # Routes client
│   │   ├── middleware/      # Middlewares (auth, roles)
│   │   └── index.js         # Point d'entrée
│   ├── uploads/             # Fichiers uploadés
│   └── package.json
├── src/
│   ├── components/          # Composants React
│   ├── context/             # Contextes (Auth)
│   ├── lib/                 # Utilitaires (API)
│   ├── pages/
│   │   ├── admin/           # Pages admin
│   │   └── espace-client/   # Pages client
│   └── main.jsx
└── package.json
```

## 🚀 Installation

### Prérequis
- Node.js 18+
- MongoDB
- npm ou yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurer les variables d'environnement
npm run dev
```

### Frontend

```bash
npm install
npm run dev
```

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# Backend
PORT=3000
MONGODB_URI=mongodb://localhost:27017/venio
JWT_SECRET=votre_secret_jwt
CORS_ORIGIN=http://localhost:5501
```

## 👤 Utilisation

### Première connexion

1. Démarrer le backend et le frontend
2. Créer un compte admin via bootstrap :
   ```bash
   POST /api/auth/bootstrap-admin
   {
     "email": "admin@example.com",
     "password": "votre_mot_de_passe",
     "name": "Admin"
   }
   ```
3. Se connecter sur `/admin/login`

### Créer un client

1. Aller dans "Comptes clients"
2. Cliquer sur "Nouveau compte"
3. Remplir le formulaire
4. Le client peut se connecter sur `/espace-client/login`

### Créer un projet

1. Sélectionner un client
2. Cliquer sur "Ajouter un projet"
3. Remplir les informations
4. Organiser le contenu avec sections et éléments

## 📚 Documentation

- **[DESIGN_IMPROVEMENTS.md](../design/DESIGN_IMPROVEMENTS.md)** - Améliorations du design
- **[PROJET_CONTENT_SYSTEM.md](./PROJET_CONTENT_SYSTEM.md)** - Système de contenu
- **[GUIDE_ADMIN_CONTENU.md](../admin/GUIDE_ADMIN_CONTENU.md)** - Guide d'utilisation admin
- **[TEST_CONTENT_SYSTEM.md](./TEST_CONTENT_SYSTEM.md)** - Plan de tests
- **[RESUME_AMELIORATIONS.md](../optimisation/RESUME_AMELIORATIONS.md)** - Résumé des améliorations

## 🎨 Design

### Palette de couleurs
- Background : `#0f0f0f`, `#1a1a1a`
- Texte : `#ffffff`, `rgba(255, 255, 255, 0.6)`
- Statut En cours : `#60a5fa` (Bleu)
- Statut En attente : `#fbbf24` (Jaune)
- Statut Terminé : `#4ade80` (Vert)

### Composants
- Cartes avec gradients
- Badges colorés
- Animations fluides
- Design responsive

## 🔒 Sécurité

- Authentification JWT
- Hashage des mots de passe avec bcrypt
- Protection des routes par rôle
- Validation des données
- Isolation des clients

## 🧪 Tests

Voir [TEST_CONTENT_SYSTEM.md](./TEST_CONTENT_SYSTEM.md) pour le plan de tests complet.

## 📈 Évolutions futures

- [ ] Notifications en temps réel
- [ ] Prévisualisation des fichiers
- [ ] Système de commentaires
- [ ] Gestion de versions
- [ ] Statistiques et analytics
- [ ] Export de rapports
- [ ] API publique

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence privée.

## 👨‍💻 Auteur

Venio Team

## 🙏 Remerciements

- React et Vite pour le frontend
- Express et MongoDB pour le backend
- La communauté open source

---

**Version** : 2.0.0  
**Dernière mise à jour** : 2 février 2026
