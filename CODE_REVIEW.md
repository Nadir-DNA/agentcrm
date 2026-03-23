# Code Review Complet — AgentCRM (niveau Lemlist)

## Contexte

Revue complète du code après merge sur main. L'objectif est d'identifier TOUS les problèmes restants pour atteindre un niveau de qualité production (comme Lemlist). 3 agents ont audité en parallèle : server actions/sécurité, pages/UI/components, et infra/types/config.

---

## CRITIQUE — Sécurité & Auth

### C1. AUCUNE vérification d'authentification dans les server actions
- **Fichiers :** `app/actions/companies.ts`, `app/actions/campaigns.ts`, `app/actions/contacts.ts`
- **Problème :** Les 13 fonctions exportées (createCompany, updateCompany, deleteCompany, createCampaign, updateCampaign, updateCampaignStatus, deleteCampaign, enrollContacts, unenrollContact, createContact, updateContact, updateContactStage, deleteContact) ne vérifient JAMAIS l'identité de l'utilisateur.
- **Impact :** N'importe qui peut créer/modifier/supprimer n'importe quelle donnée.
- **Fix :** Ajouter en haut de chaque fonction :
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: 'Non autorisé' }
```

### C2. Policies RLS trop permissives
- **Fichier :** `supabase/migrations/20260317120000_initial.sql:126-135`
- **Problème :** Toutes les policies utilisent `for all using (true)` — aucune isolation par utilisateur.
- **Fix :** Implémenter des policies basées sur `auth.uid()` ou une table d'appartenance organisation.

### C3. Pas de middleware d'authentification
- **Problème :** Aucun fichier `middleware.ts` — les routes protégées sont accessibles sans session.
- **Fix :** Créer `middleware.ts` avec vérification de session Supabase et redirection vers `/login`.

### C4. Validation d'input manquante partout
- **Fichiers :** Toutes les server actions
- **Problème :**
  - IDs jamais validés (format UUID, appartenance à l'utilisateur)
  - Enum values castées sans validation (`as Enums<'campaign_channel'>` sans vérifier la valeur)
  - `enrollContacts` accepte un array `contactIds` sans limite de taille → risque DoS
  - `FormData.get()` castées `as string` sans null-check
- **Fix :** Créer un utilitaire de validation (`lib/validation.ts`) avec : `validateUUID()`, `validateEnum()`, `validateRequired()`

---

## HAUTE — Bugs & Robustesse

### H1. Error handling inconsistant dans les server actions
- **Fichiers :** Les 3 fichiers d'actions
- **Problème :**
  - `createCompany` retourne `{ error }` mais `deleteCompany` throw
  - `updateCampaignStatus` throw mais `enrollContacts` retourne `{ error }`
  - `unenrollContact` ne check PAS l'erreur du `.delete()` (campaigns.ts:97-100)
  - `updateContactStage` n'a pas de return value
- **Fix :** Standardiser : toutes les fonctions retournent `{ error?: string }` et ne throw jamais.

### H2. Constantes encore dupliquées dans `companies/[id]/page.tsx`
- **Fichier :** `app/(crm)/companies/[id]/page.tsx:17-36`
- **Problème :** STAGES, STAGE_VARIANTS, STATUS_VARIANTS, STATUS_LABELS sont redéfinis localement au lieu d'importer de `@/lib/constants`
- **Fix :** Remplacer par `import { STAGES, STAGE_VARIANTS, STATUS_VARIANTS, STATUS_LABELS } from '@/lib/constants'`

### H3. Variables d'environnement sans validation runtime
- **Fichiers :** `lib/supabase/server.ts:9-10`, `lib/supabase/client.ts:6-7`
- **Problème :** Non-null assertions `!` sur `process.env.NEXT_PUBLIC_SUPABASE_URL!` — crash cryptique si manquant.
- **Fix :** Créer `lib/env.ts` avec validation au démarrage.

### H4. Transaction manquante dans `enrollContacts`
- **Fichier :** `app/actions/campaigns.ts:68-93`
- **Problème :** L'upsert des contacts et la mise à jour du `sent_count` sont 2 requêtes séparées. Si la 2e échoue, le count est désynchronisé.
- **Fix :** Vérifier l'erreur de la 2e requête, ou utiliser une fonction Postgres.

---

## MOYENNE — UI/UX & Qualité

### M1. Aucun `loading.tsx` dans tout le projet
- **Problème :** Pas de skeleton/loading UI pendant le chargement des pages.
- **Fix :** Ajouter `loading.tsx` pour `/dashboard`, `/contacts`, `/companies`, `/campaigns`.

### M2. Error boundaries manquants (13 routes sans)
- **Routes sans `error.tsx` :** companies/, companies/new, companies/[id], companies/[id]/edit, companies/[id]/contacts/new, contacts/, contacts/new, contacts/[id], contacts/[id]/edit, campaigns/, campaigns/new, campaigns/[id], campaigns/[id]/edit
- **Fix :** Le `error.tsx` racine à `app/(crm)/error.tsx` couvre les routes enfants, mais les routes profondes comme companies/[id]/edit pourraient bénéficier d'un error boundary plus spécifique.

### M3. Accessibilité — problèmes multiples
- `delete-contact-button.tsx:12` et `delete-campaign-button.tsx:20` : utilisent `confirm()` natif au lieu d'un dialog accessible
- `enroll-contacts-dialog.tsx:78` : input de recherche sans `aria-label`
- `stage-selector.tsx:43-59` : boutons sans `aria-label`
- `contacts/[id]/page.tsx:46-47` : avatar sans `aria-label`

### M4. Pas de Suspense boundaries pour le data fetching
- `dashboard/page.tsx` : 7 requêtes Promise.all sans Suspense
- `companies/page.tsx` : 2 requêtes sans Suspense
- `contacts/page.tsx` : requêtes sans Suspense
- **Fix :** Wrapper les sections data-heavy dans `<Suspense fallback={<Loading/>}>` avec des composants async.

### M5. Formulaires — manques
- `contact-form.tsx:15-25` : STAGES et SOURCES définis localement au lieu d'importés de constants
- `company-form.tsx:16-20` : INDUSTRIES et SIZES hardcodés
- Aucune validation client-side avant soumission
- Pas d'erreurs par champ (seulement une erreur globale `state?.error`)

### M6. Responsive design
- `contacts/[id]/page.tsx:65` : `grid-cols-3` non responsive sur mobile

---

## BASSE — Config & Maintenance

### B1. Vulnérabilité Next.js (moderate)
- Next.js 15.5.13 a une vulnérabilité moderate (GHSA-3x4c-7xq6-9pq8) : croissance illimitée du cache disque pour next/image
- **Fix :** `npm audit fix` ou upgrade Next.js

### B2. Scripts manquants dans package.json
- Pas de script `test`, `type-check`, `format`
- **Fix :** Ajouter `"type-check": "tsc --noEmit"`, `"format": "prettier --write ."`

### B3. next.config.ts quasi vide
- Aucune config d'optimisation d'images, headers de sécurité, rewrites
- **Fix :** Ajouter les headers de sécurité basiques (CSP, X-Frame-Options, etc.)

### B4. Variables d'environnement inutilisées
- `.env.example` contient REDIS_URL, VERCEL_TOKEN, TWILIO_SID qui ne sont pas utilisés dans le code
- **Fix :** Nettoyer `.env.example`

### B5. Mot de passe minimum trop court
- `supabase/config.toml:175` : `minimum_password_length = 6` — devrait être 8+ en production

### B6. Sidebar dupliquée
- `components/sidebar.tsx` semble inutilisé (remplacé par `components/app-sidebar.tsx`)
- **Fix :** Supprimer `components/sidebar.tsx`

---

## Ordre de priorité recommandé

1. **Auth middleware** (`middleware.ts`) + vérification auth dans les server actions
2. **Validation d'inputs** (UUID, enum, required fields, array size limits)
3. **Standardiser error handling** dans toutes les server actions
4. **RLS policies** — implémenter l'isolation par utilisateur
5. **Constantes dupliquées** — cleanup companies/[id] + forms
6. **Loading states** + Suspense boundaries
7. **Accessibilité** — aria-labels, dialogs accessibles
8. **Config** — next.config headers, env validation, npm audit fix

## Vérification

```bash
npm run build    # Types + imports OK
npm run lint     # Style OK
npx tsc --noEmit # Double-check types
```
