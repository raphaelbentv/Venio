# 🤖 Déploiement automatique sur Ionos

Guide pour configurer le déploiement automatique via GitHub Actions. Une fois configuré, chaque `git push` déploiera automatiquement votre site sur Ionos !

## 🎯 Avantages

- ✅ **Automatique** : Plus besoin de passer par FTP manuellement
- ✅ **Rapide** : Déploiement en quelques minutes après un `git push`
- ✅ **Sécurisé** : Les identifiants FTP sont stockés de manière sécurisée dans GitHub
- ✅ **Traçable** : Historique de tous les déploiements dans GitHub
- ✅ **Contrôle** : Vous gardez le contrôle total, vous pouvez désactiver à tout moment

## 📋 Configuration (une seule fois)

### Étape 1 : Récupérer vos identifiants FTP Ionos

1. Connectez-vous à votre [espace client Ionos](https://www.ionos.fr/)
2. Allez dans **"Hébergement"** → **"FTP"**
3. Notez ces informations :
   - **Serveur FTP** : `ftp.venio.paris` ou l'adresse IP fournie
   - **Identifiant FTP** : (votre identifiant)
   - **Mot de passe FTP** : (votre mot de passe)
   - **Répertoire web** : généralement `/httpdocs/` ou `/www/`

### Étape 2 : Configurer les secrets GitHub

1. Allez sur votre dépôt GitHub : `https://github.com/raphaelbentv/sitePersoReact`
2. Cliquez sur **"Settings"** (Paramètres)
3. Dans le menu de gauche, cliquez sur **"Secrets and variables"** → **"Actions"**
4. Cliquez sur **"New repository secret"** pour créer chaque secret :

   **Secret 1 : `FTP_SERVER`**
   - Name: `FTP_SERVER`
   - Secret: Votre serveur FTP (ex: `ftp.venio.paris` ou l'IP)

   **Secret 2 : `FTP_USERNAME`**
   - Name: `FTP_USERNAME`
   - Secret: Votre identifiant FTP

   **Secret 3 : `FTP_PASSWORD`**
   - Name: `FTP_PASSWORD`
   - Secret: Votre mot de passe FTP

   **Secret 4 : `FTP_SERVER_DIR`**
   - Name: `FTP_SERVER_DIR`
   - Secret: Votre répertoire web (ex: `/httpdocs/` ou `/www/`)

5. Cliquez sur **"Add secret"** pour chaque secret

### Étape 3 : Vérifier le workflow

Le fichier `.github/workflows/deploy-ionos.yml` est déjà créé dans votre projet. Il se déclenchera automatiquement quand vous pousserez sur la branche `master`.

## 🚀 Utilisation

### Déploiement automatique

Une fois configuré, c'est tout ! Chaque fois que vous faites :

```bash
git add .
git commit -m "Description des modifications"
git push origin master
```

Le workflow GitHub Actions va :
1. ✅ Build automatiquement votre projet
2. ✅ Générer le fichier `.htaccess`
3. ✅ Déployer sur Ionos via FTP
4. ✅ Nettoyer l'ancien contenu et uploader le nouveau

**Temps estimé** : 2-5 minutes après le push

### Déploiement manuel (optionnel)

Vous pouvez aussi déclencher le déploiement manuellement depuis GitHub :

1. Allez sur votre dépôt GitHub
2. Cliquez sur l'onglet **"Actions"**
3. Sélectionnez **"🚀 Déploiement automatique sur Ionos"**
4. Cliquez sur **"Run workflow"** → **"Run workflow"**

## 📊 Suivre les déploiements

1. Allez sur l'onglet **"Actions"** de votre dépôt GitHub
2. Vous verrez l'historique de tous les déploiements
3. Cliquez sur un déploiement pour voir les logs détaillés

## ⚙️ Configuration avancée

### Changer la branche de déploiement

Par défaut, le déploiement se fait sur `master`. Pour changer, modifiez `.github/workflows/deploy-ionos.yml` :

```yaml
on:
  push:
    branches:
      - main  # Changez ici
```

### Ignorer certains fichiers lors du push

Le workflow ignore déjà automatiquement les modifications de `README.md` et `DEPLOY_IONOS.md` pour éviter les déploiements inutiles.

Pour ajouter d'autres fichiers à ignorer :

```yaml
on:
  push:
    paths-ignore:
      - 'README.md'
      - 'DEPLOY_IONOS.md'
      - 'votre-fichier.md'  # Ajoutez ici
```

### Désactiver temporairement le déploiement automatique

1. Allez sur **"Actions"** → **"🚀 Déploiement automatique sur Ionos"**
2. Cliquez sur **"..."** (menu) → **"Disable workflow"**

Pour réactiver, faites la même chose et cliquez sur **"Enable workflow"**.

## 🐛 Dépannage

### ❌ Le déploiement échoue avec une erreur FTP

**Vérifications** :
1. ✅ Les secrets GitHub sont bien configurés (vérifiez l'orthographe : `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_SERVER_DIR`)
2. ✅ Les identifiants FTP sont corrects
3. ✅ Le serveur FTP est accessible depuis l'extérieur
4. ✅ Le répertoire web (`/httpdocs/` ou `/www/`) existe bien

**Solution** : Vérifiez les logs dans l'onglet "Actions" de GitHub pour voir l'erreur exacte.

### ❌ Le déploiement fonctionne mais le site ne se met pas à jour

**Solutions** :
1. Attendez quelques minutes (cache du serveur)
2. Videz le cache de votre navigateur : `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)
3. Vérifiez que le fichier `.htaccess` est bien uploadé (regardez les logs du déploiement)

### ❌ Je veux revenir au déploiement manuel

1. Désactivez le workflow (voir "Désactiver temporairement" ci-dessus)
2. Utilisez le guide `DEPLOY_IONOS.md` pour déployer manuellement

## 🔒 Sécurité

- ✅ Les identifiants FTP sont stockés de manière **sécurisée** dans GitHub Secrets
- ✅ Ils ne sont **jamais** visibles dans le code ou les logs
- ✅ Seuls les personnes avec accès au dépôt peuvent voir/modifier les secrets
- ✅ Vous pouvez révoquer les secrets à tout moment depuis GitHub

## 💡 Astuces

- **Testez en local d'abord** : Utilisez `npm run dev` et `npm run preview` avant de pousser
- **Commits atomiques** : Faites des commits réguliers pour faciliter le rollback si besoin
- **Vérifiez les logs** : En cas de problème, les logs GitHub Actions sont très détaillés
- **Déploiement sélectif** : Vous pouvez toujours déployer manuellement si besoin (voir `DEPLOY_IONOS.md`)

## 📞 Support

- **Documentation GitHub Actions** : https://docs.github.com/en/actions
- **Support Ionos** : Disponible dans votre espace client
- **Logs de déploiement** : Voir l'onglet "Actions" de votre dépôt GitHub

