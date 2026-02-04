# 📋 Guide de configuration étape par étape

Guide pratique pour configurer le déploiement automatique sur Ionos.

## ✅ Étape 1 : Récupérer vos identifiants FTP Ionos

### 1.1 Se connecter à Ionos

1. Allez sur [https://www.ionos.fr/](https://www.ionos.fr/)
2. Connectez-vous à votre compte
3. Accédez à votre espace client

### 1.2 Trouver les informations FTP

1. Dans le menu, cliquez sur **"Hébergement"** ou **"Web Hosting"**
2. Cliquez sur **"FTP"** ou **"Accès FTP"**
3. Vous devriez voir vos informations FTP. Notez-les dans un document temporaire :

   ```
   Serveur FTP : _________________________
   (ex: ftp.venio.paris ou une adresse IP)
   
   Identifiant FTP : _____________________
   (votre nom d'utilisateur FTP)
   
   Mot de passe FTP : ____________________
   (votre mot de passe FTP)
   
   Répertoire web : ______________________
   (généralement /httpdocs/ ou /www/)
   ```

### 1.3 Si vous ne trouvez pas les informations

- Cherchez dans **"Paramètres"** → **"FTP"**
- Ou dans **"Gestion des fichiers"**
- Ou contactez le support Ionos si nécessaire

---

## ✅ Étape 2 : Tester la connexion FTP avec Transmit (recommandé)

Cette étape permet de vérifier que vos identifiants fonctionnent avant de les configurer dans GitHub.

### 2.1 Configurer Transmit

1. Ouvrez **Transmit**
2. Cliquez sur le bouton **"+"** en bas à gauche pour créer une nouvelle connexion
3. Remplissez les champs :

   - **Nom** : `Ionos - Venio` (ou un nom de votre choix)
   - **Serveur** : Votre serveur FTP (ex: `ftp.venio.paris`)
   - **Protocole** : `FTP` (ou `SFTP` si disponible)
   - **Port** : `21` (pour FTP) ou `22` (pour SFTP)
   - **Nom d'utilisateur** : Votre identifiant FTP
   - **Mot de passe** : Votre mot de passe FTP

4. Cliquez sur **"Connexion"** ou **"Connect"**

### 2.2 Vérifier la connexion

1. Si la connexion réussit, vous devriez voir les fichiers sur le serveur
2. Naviguez vers le répertoire web (`/httpdocs/` ou `/www/`)
3. Notez le chemin exact que vous voyez (il vous servira pour GitHub)

### 2.3 Si la connexion échoue

- Vérifiez que vous avez bien copié les identifiants
- Essayez avec `SFTP` au lieu de `FTP` (si disponible)
- Vérifiez que votre hébergement Ionos est bien actif
- Contactez le support Ionos si nécessaire

---

## ✅ Étape 3 : Configurer les secrets GitHub

### 3.1 Accéder aux secrets GitHub

1. Allez sur votre dépôt GitHub : `https://github.com/raphaelbentv/sitePersoReact`
2. Cliquez sur l'onglet **"Settings"** (Paramètres) en haut du dépôt
3. Dans le menu de gauche, cliquez sur **"Secrets and variables"**
4. Cliquez sur **"Actions"**

### 3.2 Créer le premier secret : FTP_SERVER

1. Cliquez sur **"New repository secret"** (Nouveau secret du dépôt)
2. Remplissez :
   - **Name** : `FTP_SERVER` (en majuscules, exactement comme ça)
   - **Secret** : Votre serveur FTP (ex: `ftp.venio.paris` ou l'adresse IP)
3. Cliquez sur **"Add secret"**

### 3.3 Créer le deuxième secret : FTP_USERNAME

1. Cliquez à nouveau sur **"New repository secret"**
2. Remplissez :
   - **Name** : `FTP_USERNAME` (en majuscules)
   - **Secret** : Votre identifiant FTP
3. Cliquez sur **"Add secret"**

### 3.4 Créer le troisième secret : FTP_PASSWORD

1. Cliquez à nouveau sur **"New repository secret"**
2. Remplissez :
   - **Name** : `FTP_PASSWORD` (en majuscules)
   - **Secret** : Votre mot de passe FTP
3. Cliquez sur **"Add secret"**

### 3.5 Créer le quatrième secret : FTP_SERVER_DIR

1. Cliquez à nouveau sur **"New repository secret"**
2. Remplissez :
   - **Name** : `FTP_SERVER_DIR` (en majuscules)
   - **Secret** : Votre répertoire web (ex: `/httpdocs/` ou `/www/`)
   - ⚠️ **Important** : Commencez par `/` et terminez par `/`
   - Exemples valides : `/httpdocs/`, `/www/`, `/public_html/`
3. Cliquez sur **"Add secret"**

### 3.6 Vérifier que les 4 secrets sont créés

Vous devriez voir dans la liste :
- ✅ `FTP_SERVER`
- ✅ `FTP_USERNAME`
- ✅ `FTP_PASSWORD`
- ✅ `FTP_SERVER_DIR`

⚠️ **Important** : Les noms doivent être EXACTEMENT comme indiqué (en majuscules, avec des underscores).

---

## ✅ Étape 4 : Tester le déploiement automatique

### 4.1 Commiter et pousser le workflow

Le workflow GitHub Actions est déjà dans votre projet. Il faut juste le commiter :

```bash
# Dans votre terminal, depuis le dossier du projet
cd /Users/raphaelbentvelzen/Dev/Venio

# Ajouter les nouveaux fichiers
git add .github/
git add DEPLOY_AUTOMATIQUE.md
git add DEPLOY_IONOS.md
git add scripts/prepare-deploy.js
git add package.json
git add README.md

# Commiter
git commit -m "Configuration du déploiement automatique sur Ionos"

# Pousser sur GitHub
git push origin master
```

### 4.2 Vérifier le déploiement

1. Allez sur votre dépôt GitHub : `https://github.com/raphaelbentv/sitePersoReact`
2. Cliquez sur l'onglet **"Actions"** en haut
3. Vous devriez voir un workflow en cours : **"🚀 Déploiement automatique sur Ionos"**
4. Cliquez dessus pour voir les détails
5. Attendez 2-5 minutes que le déploiement se termine

### 4.3 Vérifier le résultat

- ✅ **Si le déploiement réussit** : Vous verrez une coche verte ✅
- ❌ **Si le déploiement échoue** : Cliquez sur le workflow pour voir les logs d'erreur

### 4.4 Tester le site

1. Attendez quelques minutes après le déploiement
2. Visitez `https://venio.paris`
3. Testez les différentes pages : `/realisations`, `/contact`, `/a-propos`, etc.

---

## ✅ Étape 5 : Utilisation quotidienne

Maintenant que tout est configuré, pour mettre à jour votre site :

```bash
# 1. Modifier votre code localement
# (faites vos modifications dans votre éditeur)

# 2. Tester en local (optionnel mais recommandé)
npm run dev

# 3. Commiter et pousser
git add .
git commit -m "Description de vos modifications"
git push origin master

# 4. Attendre 2-5 minutes
# Le site se déploie automatiquement !
```

---

## 🐛 Dépannage

### ❌ Le déploiement échoue avec "FTP connection failed"

**Vérifications** :
1. ✅ Les secrets GitHub sont bien créés avec les bons noms (en majuscules)
2. ✅ Les identifiants FTP sont corrects (testez avec Transmit)
3. ✅ Le serveur FTP est accessible (pas de firewall bloquant)
4. ✅ Le répertoire web existe bien (vérifiez avec Transmit)

**Solution** : Regardez les logs dans l'onglet "Actions" de GitHub pour voir l'erreur exacte.

### ❌ Le déploiement réussit mais le site ne se met pas à jour

**Solutions** :
1. Attendez quelques minutes (cache du serveur)
2. Videz le cache de votre navigateur : `Cmd+Shift+R` (Mac) ou `Ctrl+F5` (Windows)
3. Vérifiez que le fichier `.htaccess` est bien uploadé (regardez les logs du déploiement)

### ❌ Je veux désactiver temporairement le déploiement automatique

1. Allez sur GitHub → Onglet **"Actions"**
2. Cliquez sur **"🚀 Déploiement automatique sur Ionos"**
3. Cliquez sur **"..."** (menu) → **"Disable workflow"**

Pour réactiver, faites la même chose et cliquez sur **"Enable workflow"**.

---

## 📞 Besoin d'aide ?

- **Documentation GitHub Actions** : https://docs.github.com/en/actions
- **Support Ionos** : Disponible dans votre espace client
- **Logs de déploiement** : Voir l'onglet "Actions" de votre dépôt GitHub

---

## ✅ Checklist finale

Avant de considérer que tout est configuré, vérifiez :

- [ ] J'ai récupéré mes identifiants FTP depuis Ionos
- [ ] J'ai testé la connexion FTP avec Transmit (ça fonctionne)
- [ ] J'ai créé les 4 secrets GitHub (FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, FTP_SERVER_DIR)
- [ ] J'ai poussé le workflow sur GitHub
- [ ] Le déploiement automatique a réussi (coche verte dans Actions)
- [ ] Le site est accessible sur https://venio.paris
- [ ] Les routes fonctionnent (pas d'erreur 404 sur /realisations, /contact, etc.)

Une fois toutes ces cases cochées, vous êtes prêt ! 🎉

