# Plan d'action detaille - Espace Admin "Comptes clients" (Venio)

## 1) Objectif produit

Construire un systeme robuste dans l'espace admin pour gerer le cycle de vie complet d'un compte client:

- creation et qualification du client
- onboarding et cadrage
- suivi des projets, jalons, avancees et livrables
- gestion operationnelle (contacts, notes, actions, statuts)
- suivi financier (devis, factures, paiements)
- traçabilite (historique des actions et audit)

Le resultat attendu est un back-office fiable, lisible, securise et extensible.

---

## 2) Portee fonctionnelle (MVP -> V2)

## MVP (priorite haute)

- CRUD comptes clients (create/read/update/archive/reactivate)
- liste admin avec recherche, filtres, tri, pagination
- fiche client complete:
  - informations generales
  - contacts
  - projets associes
  - progression globale
  - livrables visibles
  - notes internes
  - historique des actions
- actions rapides:
  - creer un projet depuis la fiche client
  - changer statut client
  - assigner un owner interne
- permissions strictes par role admin

## V2 (apres stabilisation)

- taches de suivi client (todo / relance / echeances)
- alertes proactives (retards, documents non vus, factures impayees)
- score de sante client (health score)
- exports CSV/PDF
- automation (rappels hebdo, resume exec, alertes SLA)

---

## 3) Architecture cible (backend + frontend)

## Backend

- API REST admin dediee pour comptes clients
- couche services metier (agregation progression, livrables, KPI)
- validations d'entree centralisees
- RBAC systematique
- journalisation/audit des operations sensibles

## Frontend admin

- pages modularisees par domaines:
  - list
  - detail (onglets)
  - form create/edit
- etat local clair + appels API typifies
- composants reutilisables (cards KPI, timeline, table, drawer actions)
- gestion d'erreur et chargement coherente

---

## 4) Modele de donnees (proposition)

## Entites existantes a consolider

- `User` (role `CLIENT`)
- `Project`
- `ProjectSection`
- `ProjectItem`
- `ProjectUpdate`
- `BillingDocument`
- `Document`

## Extensions recommandees

### `User` (client)

Ajouter/normaliser:

- `companyName` (string)
- `phone` (string)
- `website` (string)
- `address` (objet)
- `tags` (string[])
- `source` (enum: referral, inbound, outbound, partner, autre)
- `ownerAdminId` (ObjectId User admin)
- `status` (enum: PROSPECT, ACTIF, EN_PAUSE, CLOS, ARCHIVE)
- `onboardingStatus` (enum: A_FAIRE, EN_COURS, TERMINE)
- `healthStatus` (enum: BON, ATTENTION, CRITIQUE)
- `lastContactAt` (date)
- `archivedAt` (date|null)

Index:

- email unique
- `(role, status)`
- `(ownerAdminId, updatedAt)`
- text index sur `name`, `companyName`, `email`

### `ClientContact` (nouveau)

- `clientId`, `firstName`, `lastName`, `email`, `phone`, `role`, `isMain`, `notes`

### `ClientNote` (nouveau)

- `clientId`, `content`, `createdBy`, `visibility` (interne), `pinned`

### `ClientActivity` (nouveau - audit/timeline)

- `clientId`, `type`, `label`, `payload`, `actorId`, `createdAt`
- alimente automatiquement via hooks/services

### `ClientTask` (option V2)

- `clientId`, `title`, `status`, `dueAt`, `assignedTo`, `priority`

---

## 5) API Admin a implementer

Base proposee: `/api/admin/clients`

## CRUD compte client

- `GET /api/admin/clients`
  - query: `q`, `status`, `owner`, `health`, `page`, `limit`, `sort`
- `POST /api/admin/clients`
- `GET /api/admin/clients/:id`
- `PATCH /api/admin/clients/:id`
- `POST /api/admin/clients/:id/archive`
- `POST /api/admin/clients/:id/reactivate`

## Sous-ressources

- `GET /api/admin/clients/:id/contacts`
- `POST /api/admin/clients/:id/contacts`
- `PATCH /api/admin/clients/:id/contacts/:contactId`
- `DELETE /api/admin/clients/:id/contacts/:contactId`

- `GET /api/admin/clients/:id/notes`
- `POST /api/admin/clients/:id/notes`
- `PATCH /api/admin/clients/:id/notes/:noteId`
- `DELETE /api/admin/clients/:id/notes/:noteId`

- `GET /api/admin/clients/:id/activities`

## Projets / avancees / livrables

- `GET /api/admin/clients/:id/projects`
- `GET /api/admin/clients/:id/progress`
  - retour: `%global`, jalons atteints, retards, prochaines deadlines
- `GET /api/admin/clients/:id/deliverables`
  - retour: liste agregee de `ProjectItem` + metadata (visible, telechargeable, telecharge le, date)

## Finance (lecture admin)

- `GET /api/admin/clients/:id/billing/summary`
- `GET /api/admin/clients/:id/billing/documents`

## Standards API

- schema de reponse homogène (`data`, `meta`, `error`)
- validation entree (zod/joi)
- erreurs explicites (400/401/403/404/409/422)
- pagination standard (`page`, `limit`, `total`)

---

## 6) Regles metier critiques

- un client archive ne peut pas etre assigne a un nouveau projet sans reactivation
- suppression hard interdite en admin UI (archivage par defaut)
- un email client doit etre unique
- un projet doit toujours pointer vers un client actif
- les livrables "non visibles client" restent visibles cote admin seulement
- toutes les operations sensibles ecrivent une `ClientActivity`

---

## 7) Permissions et securite

Roles identifies: `SUPER_ADMIN`, `ADMIN`, `VIEWER`

- `SUPER_ADMIN`: acces total + archivage/reactivation + owner reassignment
- `ADMIN`: gestion operationnelle standard
- `VIEWER`: lecture seule

Mesures:

- middleware RBAC sur chaque route admin
- verification ownership si necessaire (politique interne)
- sanitization des inputs
- rate limit sur endpoints sensibles
- logs securite pour operations critiques

---

## 8) Frontend admin - ecrans a produire

## A. Liste comptes clients (`/admin/comptes-clients`)

- tableau/cards avec:
  - nom, email, societe, owner, statut, sante, derniere activite
- recherche full-text
- filtres combinables
- tri par date MAJ / statut / sante
- pagination
- actions bulk (V2)

## B. Creation compte client (`/admin/comptes-clients/nouveau`)

- formulaire:
  - infos legale/contact
  - owner interne
  - tags/source
- validations temps reel
- prevention doublon email (check API)

## C. Detail compte client (`/admin/comptes-clients/:id`)

Onglets:

1. `Vue d'ensemble`
- KPI: nb projets, projets actifs, progression moyenne, impayes
- prochain jalon critique
- resume statut/sante

2. `Projets`
- liste projets + statut + progression + echeances
- CTA "creer projet"

3. `Livrables`
- liste agregee tous projets
- filtres: type / visible / telechargeable / date

4. `Contacts`
- CRUD des contacts

5. `Notes & Activites`
- fil chronologique
- notes epinglees

6. `Facturation`
- documents + etat reglement

## D. Edition compte client

- edition inline des champs critiques
- panneau side-drawer pour actions (archiver/reactiver/reassigner)

---

## 9) Calcul de progression et livrables (spec technique)

## Progression globale client

Formule simple MVP:

- progression projet = moyenne ponderee de:
  - jalons termines / jalons totaux
  - items livrables publies / attendus
  - statut projet (bonus/malus)
- progression client = moyenne des projets actifs (ou ponderation budget)

## Livrables

Sources:

- `ProjectItem` (type `FILE`, `LINK`, `NOTE`, `CHECKLIST`, `MILESTONE`)

Regles:

- admin voit tout
- client voit seulement `visibleToClient = true`
- telechargement conditionne par `isDownloadable`

Retour API recommande:

- `projectId`, `projectName`, `section`, `itemType`, `title`, `updatedAt`, `visibleToClient`, `isDownloadable`, `firstViewedAt`, `downloadedAt`

---

## 10) Observabilite & audit

- logs applicatifs structures (niveau info/warn/error)
- correlation id par requete
- evenements audit:
  - client cree/modifie/archive/reactive
  - changement owner/statut
  - ajout/suppression contact
  - publication/masquage livrable
- dashboard interne minimal:
  - erreurs API admin
  - latence endpoints critiques

---

## 11) Strategie de tests

## Backend

- unit tests services:
  - calcul progression
  - aggregation livrables
  - transitions de statuts
- integration tests routes:
  - permissions par role
  - filtres/pagination
  - archivage/reactivation

## Frontend

- tests composants:
  - liste filtres/tri
  - detail onglets
  - formulaires validation
- e2e parcours critiques:
  - creer client -> creer projet -> voir progression -> publier livrable
  - archiver/reactiver client

## Non-regression

- verifier isolation stricte des donnees client
- verifier qu'aucune route client n'expose des data admin

---

## 12) Migration et donnees

1. script migration schema `User` (ajout champs + valeurs par defaut)
2. backfill `status = ACTIF` pour clients existants
3. backfill `ownerAdminId` si necessaire
4. nettoyage donnees fictives (seed/demo)
5. validation post-migration:
   - unicite email
   - references projets -> client valides

---

## 13) Plan d'execution (sprints)

## Sprint 1 (foundation)

- finaliser schema + index
- implémenter API CRUD clients + listing filtre/pagination
- brancher pages liste + create
- tests backend de base

## Sprint 2 (pilotage client)

- detail client (overview + projets + contacts)
- services calcul progression
- endpoints progress + projects
- tests integration API

## Sprint 3 (livrables + traçabilite)

- endpoints deliverables agreges
- onglet livrables + notes + activites
- audit logging complet
- e2e parcours principal

## Sprint 4 (stabilisation + rollout)

- perf DB (index tuning)
- durcissement securite
- migration prod + verifs
- release progressive

---

## 14) Backlog technique par fichier (repo actuel)

Backend (a adapter selon implementation finale):

- `backend/src/models/User.js` (champs client + index)
- `backend/src/models/ClientContact.js` (nouveau)
- `backend/src/models/ClientNote.js` (nouveau)
- `backend/src/models/ClientActivity.js` (nouveau)
- `backend/src/routes/admin/users.js` (etendre vers logique client)
- `backend/src/routes/admin/projects.js` (agregations cote client)
- `backend/src/routes/admin/billing.js` (summary par client)
- `backend/src/routes/client/projectContent.js` (verif coherence visibilite)
- `backend/src/index.js` (brancher nouvelles routes admin clients)

Frontend:

- `src/pages/admin/ClientAccountList.jsx`
- `src/pages/admin/ClientAccountNew.jsx`
- `src/pages/admin/ClientAccountDetail.jsx`
- `src/pages/admin/ProjectDetail.jsx` (liaisons livrables/visibilite)
- `src/pages/espace-client/ProjectDetail.jsx` (coherence affichage client)
- `src/services/*` (creer couche API clients admin si absente)
- `src/lib/permissions.js` (etendre permissions fines)

---

## 15) Definition of Done

Le chantier est termine si:

- toutes les routes admin clients MVP sont disponibles et testees
- toutes les pages admin comptes clients fonctionnent sans erreur bloquante
- les donnees progression/livrables sont correctes et coherentes
- RBAC est applique et verifie par tests
- migration prod executee sans regression
- documentation d'usage admin mise a jour

---

## 16) Risques et parades

- risque: complexite agregations progression
  - parade: commencer formule simple, monitorer et iterer
- risque: dette historique de donnees
  - parade: scripts de backfill + validations automatiques
- risque: confusion UX entre "statut client" et "statut projets"
  - parade: nomenclature claire + aide contextuelle
- risque: performance liste/detail sur gros volume
  - parade: index + pagination + projections Mongo

---

## 17) Decision immediate recommandee

Pour demarrer vite et sans blocage:

1. valider ce plan MVP
2. figer les statuts metier (client, onboarding, sante)
3. lancer Sprint 1 sur schema + API listing/CRUD + pages liste/create

