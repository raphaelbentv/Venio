# 🐛 Dépannage du déploiement automatique

Si le déploiement échoue, voici comment identifier et résoudre le problème.

## 📋 Vérifier les logs GitHub Actions

1. Allez sur votre dépôt GitHub : `https://github.com/raphaelbentv/sitePersoReact`
2. Cliquez sur l'onglet **"Actions"**
3. Cliquez sur le workflow qui a échoué (icône rouge ❌)
4. Cliquez sur le job **"Build et déploiement sur Ionos"**
5. Déroulez l'étape **"🚀 Déployer sur Ionos via SFTP"**
6. Regardez les messages d'erreur

## 🔍 Erreurs courantes et solutions

### Erreur : "Connection refused" ou "Connection timeout"

**Cause** : Le serveur SFTP n'est pas accessible ou le port est bloqué.

**Solutions** :
- ✅ Vérifiez que le secret `FTP_SERVER` est correct : `home353429004.1and1-data.host`
- ✅ Vérifiez que le port 22 (SFTP) est ouvert sur votre serveur Ionos
- ✅ Contactez le support Ionos pour vérifier que SFTP est activé

### Erreur : "Authentication failed" ou "Permission denied"

**Cause** : Les identifiants sont incorrects.

**Solutions** :
- ✅ Vérifiez que les secrets `FTP_USERNAME` et `FTP_PASSWORD` sont corrects
- ✅ Testez la connexion avec Transmit pour confirmer que les identifiants fonctionnent
- ✅ Assurez-vous qu'il n'y a pas d'espaces avant/après dans les secrets GitHub

### Erreur : "No such file or directory" ou "Path not found"

**Cause** : Le répertoire cible n'existe pas ou le chemin est incorrect.

**Solutions** :
- ✅ Vérifiez que le secret `FTP_SERVER_DIR` est correct : `/VenioReact/`
- ✅ Connectez-vous avec Transmit et vérifiez que le dossier `/VenioReact/` existe bien
- ✅ Le chemin doit commencer par `/` et se terminer par `/`
- ✅ Si le dossier n'existe pas, créez-le via Transmit

### Erreur : "Permission denied" lors de l'upload

**Cause** : Les permissions du répertoire sont insuffisantes.

**Solutions** :
- ✅ Vérifiez les permissions du dossier `/VenioReact/` avec Transmit
- ✅ Les permissions doivent être au moins `755` pour le dossier
- ✅ Contactez le support Ionos si nécessaire

### Erreur : "Protocol mismatch" ou "SFTP not supported"

**Cause** : Le serveur ne supporte pas SFTP ou nécessite une configuration spéciale.

**Solutions** :
- ✅ Vérifiez dans l'espace client Ionos que SFTP est activé
- ✅ Essayez avec FTP au lieu de SFTP (port 21) si SFTP n'est pas disponible
- ✅ Contactez le support Ionos

## 🔧 Vérifications à faire

### 1. Vérifier les secrets GitHub

Allez sur **Settings** → **Secrets and variables** → **Actions** et vérifiez :

- ✅ `FTP_SERVER` = `home353429004.1and1-data.host` (sans `sftp://` ni `//`)
- ✅ `FTP_USERNAME` = Votre identifiant exact (sans espaces)
- ✅ `FTP_PASSWORD` = Votre mot de passe exact (sans espaces)
- ✅ `FTP_SERVER_DIR` = `/VenioReact/` (avec `/` au début et à la fin)

### 2. Tester la connexion manuellement

1. Ouvrez **Transmit**
2. Connectez-vous avec les mêmes identifiants que dans les secrets GitHub
3. Vérifiez que vous pouvez :
   - Vous connecter au serveur
   - Naviguer vers `/VenioReact/`
   - Uploader un fichier test

Si ça ne fonctionne pas dans Transmit, ça ne fonctionnera pas dans GitHub Actions.

### 3. Vérifier le chemin du répertoire

Dans Transmit, quand vous êtes dans le dossier `VenioReact`, regardez le chemin exact :
- Si c'est `/VenioReact/` → Utilisez `/VenioReact/` dans le secret
- Si c'est `/httpdocs/VenioReact/` → Utilisez `/httpdocs/VenioReact/` dans le secret
- Si c'est `/www/VenioReact/` → Utilisez `/www/VenioReact/` dans le secret

## 📞 Obtenir de l'aide

Si le problème persiste :

1. **Copiez le message d'erreur exact** depuis les logs GitHub Actions
2. **Vérifiez les points ci-dessus**
3. **Contactez le support Ionos** si c'est un problème de configuration serveur

## 🔄 Alternative : Utiliser FTP au lieu de SFTP

Si SFTP ne fonctionne pas, vous pouvez essayer avec FTP (port 21) :

1. Modifiez le workflow pour utiliser FTP
2. Changez le port de 22 à 21
3. Utilisez l'action `SamKirkland/FTP-Deploy-Action` avec `protocol: ftp`

Mais SFTP est généralement plus sécurisé et recommandé.

