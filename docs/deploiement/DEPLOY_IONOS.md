# 🚀 Guide de déploiement Ionos - Venio.paris

Guide simple pour publier et mettre à jour votre site sur votre domaine Ionos.

## 📋 Prérequis

- ✅ Compte Ionos avec hébergement web activé
- ✅ Domaine `venio.paris` configuré
- ✅ Identifiants FTP/SFTP (disponibles dans l'espace client Ionos)
- ✅ Client FTP installé (FileZilla recommandé)

## 🔧 Configuration initiale (une seule fois)

### 1. Récupérer vos identifiants FTP Ionos

1. Connectez-vous à votre [espace client Ionos](https://www.ionos.fr/)
2. Allez dans **"Hébergement"** → **"FTP"**
3. Notez ces informations :
   - **Serveur FTP** : `ftp.venio.paris` ou l'adresse IP fournie
   - **Identifiant FTP** : (votre identifiant)
   - **Mot de passe FTP** : (votre mot de passe)
   - **Répertoire web** : généralement `/httpdocs/` ou `/www/`

### 2. Configurer FileZilla (ou votre client FTP)

1. Téléchargez [FileZilla](https://filezilla-project.org/) (gratuit)
2. Ouvrez FileZilla → **Fichier** → **Gestionnaire de sites**
3. Créez un nouveau site avec :
   - **Hôte** : votre serveur FTP Ionos
   - **Protocole** : FTP - Transfert de fichiers
   - **Type d'authentification** : Normal
   - **Identifiant** : votre identifiant FTP
   - **Mot de passe** : votre mot de passe FTP
4. Cliquez sur **"Connexion"** pour tester

### 3. Activer SSL/HTTPS (recommandé)

1. Dans l'espace client Ionos, allez dans **"Domaines"** → **"SSL"**
2. Activez **Let's Encrypt** (gratuit)
3. Attendez la validation (quelques heures à 24h)

## 🎯 Déploiement initial

### Étape 1 : Build du projet

```bash
npm run build:ionos
```

Cette commande :
- ✅ Crée la version optimisée dans `dist/`
- ✅ Génère automatiquement le fichier `.htaccess` pour React Router

### Étape 2 : Uploader les fichiers

1. **Connectez-vous en FTP** avec FileZilla
2. **Naviguez vers le répertoire web** (`/httpdocs/` ou `/www/`)
3. **Supprimez tout le contenu existant** (si nécessaire)
4. **Activez l'affichage des fichiers cachés** :
   - FileZilla : **Affichage** → **Afficher les fichiers cachés**
5. **Sélectionnez TOUS les fichiers et dossiers** de `dist/` :
   - `index.html`
   - `.htaccess` ⚠️ **CRUCIAL** (fichier caché)
   - Dossier `assets/` (et son contenu)
   - Dossier `fonts/` (et son contenu)
   - Dossier `realisations/` (et son contenu)
6. **Glissez-déposez** ou **clic droit** → **Uploader**

### Étape 3 : Vérifier

1. Attendez quelques minutes (propagation DNS)
2. Visitez `https://venio.paris`
3. Testez toutes les routes : `/realisations`, `/contact`, `/a-propos`, etc.

## 🔄 Mettre à jour le site (workflow simple)

Quand vous voulez publier des modifications :

### 1. Modifier et tester localement

```bash
# Faites vos modifications dans votre éditeur
npm run dev  # Testez sur localhost:5501
```

### 2. Build pour production

```bash
npm run build:ionos
```

### 3. Uploader les nouveaux fichiers

**Option A : Remplacement complet (recommandé pour les débuts)**
1. Connectez-vous en FTP
2. Supprimez tout le contenu de `/httpdocs/`
3. Re-uploader tout le contenu de `dist/`

**Option B : Remplacement sélectif (plus rapide)**
1. Connectez-vous en FTP
2. Remplacez uniquement les fichiers modifiés :
   - `index.html` (toujours à remplacer)
   - Fichiers dans `assets/` (les noms changent à chaque build)
   - `.htaccess` (si modifié)

### 4. Vider le cache

- Appuyez sur `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac) dans votre navigateur
- Ou attendez quelques minutes

## 📁 Structure attendue sur le serveur

```
/httpdocs/
├── index.html          ← Point d'entrée
├── .htaccess          ← Configuration React Router (CRUCIAL)
├── assets/
│   ├── index-xxxxx.js ← JavaScript optimisé
│   └── index-xxxxx.css ← CSS optimisé
├── fonts/
│   └── [tous les fichiers .woff et .woff2]
└── realisations/
    └── [toutes les images .jpg]
```

## ⚠️ Points importants

### Le fichier `.htaccess` est essentiel

Sans ce fichier, les routes React Router ne fonctionneront pas (erreur 404 sur `/realisations`, `/contact`, etc.).

**Vérifications** :
- ✅ Le fichier `.htaccess` est bien uploadé dans `/httpdocs/`
- ✅ Vous avez activé l'affichage des fichiers cachés dans FileZilla
- ✅ Le fichier n'est pas vide

### Permissions des fichiers

Si vous avez des problèmes d'affichage :
- **Dossiers** : 755 (rwxr-xr-x)
- **Fichiers** : 644 (rw-r--r--)

Dans FileZilla : Clic droit sur le fichier → **Permissions des fichiers**

## 🐛 Dépannage

### ❌ Les routes ne fonctionnent pas (404)

**Solutions** :
1. Vérifiez que `.htaccess` est bien uploadé
2. Vérifiez que `mod_rewrite` est activé (contactez le support Ionos si nécessaire)
3. Vérifiez que le fichier `.htaccess` n'est pas vide

### ❌ Les fichiers ne se chargent pas (polices, images)

**Solutions** :
1. Vérifiez que tous les dossiers sont uploadés : `assets/`, `fonts/`, `realisations/`
2. Vérifiez que les dossiers contiennent bien leurs fichiers
3. Vérifiez les permissions (voir ci-dessus)
4. Ouvrez la console du navigateur (F12) pour voir les erreurs 404

### ❌ HTTPS ne fonctionne pas

**Solutions** :
1. Activez le certificat SSL dans l'espace client Ionos
2. Attendez la validation (quelques heures)
3. Vérifiez que votre domaine pointe vers Ionos dans les DNS

### ❌ Le site affiche une page blanche

**Solutions** :
1. Ouvrez la console du navigateur (F12) pour voir les erreurs JavaScript
2. Vérifiez que `index.html` est bien à la racine de `/httpdocs/`
3. Vérifiez que les fichiers dans `assets/` sont accessibles

### ❌ Les modifications ne s'affichent pas

**Solutions** :
1. Videz le cache : `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)
2. Vérifiez que vous avez bien uploadé les nouveaux fichiers
3. Attendez quelques minutes (cache du serveur)

## 📞 Support

- **Support Ionos** : Disponible dans votre espace client ou par téléphone
- **Documentation** : Voir le `README.md` pour plus de détails techniques

## 💡 Astuces

- **Sauvegardez avant de modifier** : Gardez une copie de l'ancien contenu de `/httpdocs/` avant de faire des modifications importantes
- **Testez en local d'abord** : Utilisez `npm run preview` pour tester la version de production localement
- **Versionning** : N'oubliez pas de commiter vos changements dans Git avant de déployer :
  ```bash
  git add .
  git commit -m "Description des modifications"
  git push origin master
  ```

