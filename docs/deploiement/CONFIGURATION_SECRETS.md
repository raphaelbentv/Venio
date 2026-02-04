# 🔐 Configuration des secrets GitHub - Guide rapide

Basé sur votre configuration Ionos, voici exactement ce que vous devez mettre dans chaque secret GitHub.

## 📋 Vos informations (depuis l'URL Transmit)

D'après votre URL : `sftp://home353429004.1and1-data.host//VenioReact`

- **Serveur** : `home353429004.1and1-data.host`
- **Protocole** : `SFTP` (pas FTP)
- **Chemin** : `/VenioReact/`
- **Port** : `22` (pour SFTP)

## 🔑 Secrets à créer dans GitHub

Allez sur : `https://github.com/raphaelbentv/sitePersoReact` → **Settings** → **Secrets and variables** → **Actions**

### Secret 1 : FTP_SERVER

- **Name** : `FTP_SERVER`
- **Secret** : `home353429004.1and1-data.host`

### Secret 2 : FTP_USERNAME

- **Name** : `FTP_USERNAME`
- **Secret** : Votre identifiant SFTP Ionos (celui que vous utilisez pour vous connecter avec Transmit)

### Secret 3 : FTP_PASSWORD

- **Name** : `FTP_PASSWORD`
- **Secret** : Votre mot de passe SFTP Ionos (celui que vous utilisez pour vous connecter avec Transmit)

### Secret 4 : FTP_SERVER_DIR

- **Name** : `FTP_SERVER_DIR`
- **Secret** : `/VenioReact/`
  - ⚠️ **Important** : Commencez par `/` et terminez par `/`
  - Exactement comme ça : `/VenioReact/`

## ✅ Vérification

Vous devriez avoir 4 secrets dans GitHub :
- ✅ `FTP_SERVER` → `home353429004.1and1-data.host`
- ✅ `FTP_USERNAME` → Votre identifiant
- ✅ `FTP_PASSWORD` → Votre mot de passe
- ✅ `FTP_SERVER_DIR` → `/VenioReact/`

## 🚀 Après la configuration

Une fois les 4 secrets créés, vous pouvez tester le déploiement :

```bash
git add .github/
git commit -m "Configuration SFTP pour déploiement automatique"
git push origin master
```

Le workflow utilisera automatiquement SFTP (port 22) pour se connecter à votre serveur Ionos.

