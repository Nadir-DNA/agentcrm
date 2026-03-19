# AgentCRM - Code Review & Strategic Improvement Plan

## Context

AgentCRM est un CRM "Agent-First" pour automatiser la prospection (SMS/Email) via des agents IA (Hunter, Seller, Madmen). Le projet est en Phase 4 (Dashboard + Analytics). L'objectif est d'atteindre la parité fonctionnelle avec **Lemlist** tout en conservant l'avantage différenciant "Agent-First".

**Etat actuel** : Next.js 15 + Supabase + shadcn/ui + Express (legacy). CRUD contacts/companies/campaigns fonctionnel, dashboard avec charts, mais de nombreuses features critiques manquantes.

---

## 1. ANALYSE STRATEGIQUE & CULTURELLE

### 1.1 Positionnement vs Lemlist

| Aspect | Lemlist | AgentCRM (actuel) | AgentCRM (cible) |
|--------|---------|-------------------|-------------------|
| **Cible** | Sales teams humains | Agents IA | Agents IA + humains |
| **Outreach** | Email-first, multi-canal | SMS-first (Brevo) | Multi-canal complet |
| **Sequences** | Visual builder avancé | Aucun UI | Workflow YAML + UI preview |
| **Personalisation** | IA + variables dynamiques | {{variables}} basiques | IA generative + variables |
| **Warmup** | Email warmup intégré | Absent | Rate limiting intelligent |
| **Analytics** | Heatmaps, A/B, funnel | 4 charts basiques | Analytics avancés |
| **Prix** | 59-99$/mois | Self-hosted gratuit | Self-hosted gratuit |

### 1.2 Recommandations Stratégiques

- **Garder l'identité "Agent-First"** : C'est le vrai différenciateur. Lemlist est human-first, AgentCRM est automation-first
- **Double interface** : CLI pour agents + Web UI pour supervision humaine (le dashboard actuel)
- **Marché cible** : Solopreneurs/agences FR qui veulent automatiser la prospection sans payer 99$/mois
- **Nom "AgentCRM"** : Bon, clair, descriptif. Pas besoin de changer
- **Langue** : Garder le FR comme langue primaire (marché cible FR), mais préparer l'i18n

### 1.3 Features Lemlist Essentielles a Reproduire

1. **Sequences multi-steps** (email → wait → email → LinkedIn → call)
2. **Email warmup / deliverability**
3. **Personalisation IA** (body rewrite per contact)
4. **A/B testing** sur subject lines et body
5. **Analytics detaillés** (open/click heatmaps, best send time)
6. **Integrations CRM** (import/export, webhook bidirectionnel)
7. **Team collaboration** (multi-user, roles)

---

## 2. P0 - CRITIQUE (Securite, Stabilite, Data Integrity)

### 2.1 Authentication & Authorization
**Probleme** : Aucune auth. Toutes les routes sont publiques. RLS permissif.
**Impact** : Blocker pour toute mise en production.

**Actions** :
- Creer `middleware.ts` (racine) : protection des routes `/dashboard`, `/companies`, `/contacts`, `/campaigns`
- Implementer Supabase Auth (email/password + magic link)
- Creer page `/login` et `/register`
- Durcir les policies RLS dans une nouvelle migration (filtrer par `auth.uid()`)
- Ajouter `user_id` a toutes les tables (migration)

**Fichiers** :
- `middleware.ts` (nouveau)
- `app/(auth)/login/page.tsx` (nouveau)
- `app/(auth)/register/page.tsx` (nouveau)
- `supabase/migrations/20260320_auth_rls.sql` (nouveau)
- `lib/supabase/server.ts` (modifier pour checker auth)

### 2.2 Validation des Donnees (Zod)
**Probleme** : Aucune validation cote client ni serveur structuree. Casting `as unknown as` partout.
**Impact** : Injection de donnees malformees, crashes silencieux.

**Actions** :
- Installer `zod`
- Creer schemas de validation dans `lib/validations/` :
  - `contact.ts`, `company.ts`, `campaign.ts`
- Utiliser les schemas dans les server actions (`app/actions/*.ts`)
- Ajouter validation client-side dans les forms
- Supprimer les `as unknown as` casts en typant correctement les queries Supabase

**Fichiers** :
- `lib/validations/contact.ts` (nouveau)
- `lib/validations/company.ts` (nouveau)
- `lib/validations/campaign.ts` (nouveau)
- `app/actions/contacts.ts` (modifier)
- `app/actions/companies.ts` (modifier)
- `app/actions/campaigns.ts` (modifier)
- `components/contact-form.tsx` (modifier)
- `components/company-form.tsx` (modifier)
- `components/campaign-form.tsx` (modifier)

### 2.3 Error Handling & Loading States
**Probleme** : Aucun `error.tsx`, `loading.tsx`, ou `not-found.tsx`.
**Impact** : L'app crash silencieusement, mauvaise UX.

**Actions** :
- Creer `app/(crm)/error.tsx` (error boundary global)
- Creer `app/(crm)/loading.tsx` (skeleton loader)
- Creer `app/not-found.tsx` (page 404)
- Ajouter loading states specifiques pour les pages listes (contacts, companies, campaigns)

**Fichiers** :
- `app/(crm)/error.tsx` (nouveau)
- `app/(crm)/loading.tsx` (nouveau)
- `app/not-found.tsx` (nouveau)
- `app/(crm)/contacts/loading.tsx` (nouveau)
- `app/(crm)/campaigns/loading.tsx` (nouveau)

### 2.4 Constantes Centralisees
**Probleme** : STAGES, SOURCES, INDUSTRIES dupliques dans 5+ fichiers.
**Impact** : Inconsistance, bugs lors des changements.

**Actions** :
- Creer `lib/constants.ts` avec toutes les constantes partagees
- Remplacer tous les hardcoded values par des imports de ce fichier

**Fichiers** :
- `lib/constants.ts` (nouveau)
- `app/(crm)/dashboard/page.tsx` (modifier)
- `components/contact-form.tsx` (modifier)
- `components/stage-selector.tsx` (modifier)
- `src/lib/pipeline.js` (modifier)

---

## 3. P1 - HIGH (Features Core pour Parite Lemlist)

### 3.1 Envoi Reel d'Emails & SMS
**Probleme** : Le UI campaign existe mais aucune logique d'envoi reelle.
**Impact** : Le coeur du produit ne fonctionne pas.

**Actions** :
- Creer `lib/channels/email.ts` (Resend provider)
- Creer `lib/channels/sms.ts` (Brevo provider)
- Creer `lib/channels/index.ts` (Channel Manager abstrait)
- Implementer `sendCampaign` server action qui :
  1. Recupere les contacts enrolles
  2. Substitue les variables template
  3. Envoie via le provider choisi
  4. Met a jour `sent_count` et le status de chaque `campaign_contact`
- Ajouter bouton "Envoyer" sur la page detail campaign
- Creer API routes webhook pour tracking (`/api/webhooks/resend`, `/api/webhooks/brevo`)

**Fichiers** :
- `lib/channels/email.ts` (nouveau)
- `lib/channels/sms.ts` (nouveau)
- `lib/channels/index.ts` (nouveau)
- `app/actions/campaigns.ts` (modifier - ajouter `sendCampaign`)
- `app/api/webhooks/resend/route.ts` (nouveau)
- `app/api/webhooks/brevo/route.ts` (nouveau)
- `app/(crm)/campaigns/[id]/page.tsx` (modifier - bouton envoi)

### 3.2 Sequences Multi-Steps
**Probleme** : Lemlist permet des sequences (email 1 → wait 2j → email 2 → if no reply → email 3).
**Impact** : Feature #1 de Lemlist, essentielle pour la prospection.

**Actions** :
- Ajouter table `sequence_steps` dans Supabase :
  ```sql
  id, campaign_id, step_order, channel, delay_hours, subject, body, condition
  ```
- Creer UI pour ajouter/ordonner les steps d'une campagne type "sequence"
- Creer un worker/cron qui execute les steps en respectant les delais
- Tracker le progres de chaque contact dans la sequence

**Fichiers** :
- `supabase/migrations/20260320_sequences.sql` (nouveau)
- `components/sequence-builder.tsx` (nouveau)
- `app/actions/sequences.ts` (nouveau)
- `app/(crm)/campaigns/[id]/page.tsx` (modifier)

### 3.3 Pagination & Recherche Avancee
**Probleme** : Toutes les listes chargent tout. Pas de pagination.
**Impact** : Performance catastrophique avec 1000+ contacts.

**Actions** :
- Ajouter pagination server-side aux pages contacts, companies, campaigns
- Implementer recherche full-text avec Supabase `.textSearch()`
- Ajouter filtres avances (par stage, source, tags, date)
- Composant `<Pagination />` reutilisable

**Fichiers** :
- `components/pagination.tsx` (nouveau)
- `app/(crm)/contacts/page.tsx` (modifier)
- `app/(crm)/companies/page.tsx` (modifier)
- `app/(crm)/campaigns/page.tsx` (modifier)

### 3.4 Import/Export CSV
**Probleme** : Pas d'UI pour import/export. Le guide existe mais c'est CLI-only.
**Impact** : Blocker pour migration depuis d'autres CRM.

**Actions** :
- Creer page `/contacts/import` avec drag & drop CSV
- Mapping de colonnes CSV → champs contact
- Preview avant import
- Export CSV des contacts (filtres inclus)
- Gestion des doublons (skip/update/merge)

**Fichiers** :
- `app/(crm)/contacts/import/page.tsx` (nouveau)
- `components/csv-import-wizard.tsx` (nouveau)
- `app/actions/import.ts` (nouveau)
- `app/actions/export.ts` (nouveau)

### 3.5 Template Email Riche
**Probleme** : Textarea basique. Lemlist a un visual editor.
**Impact** : Emails non-professionnels = mauvais taux d'ouverture.

**Actions** :
- Ajouter table `templates` dans Supabase
- Creer editeur de templates avec preview live
- Variables dynamiques avec auto-complete (`{{first_name}}`, `{{company}}`, etc.)
- Gallerie de templates pre-faits
- Preview "desktop/mobile" du rendu

**Fichiers** :
- `supabase/migrations/20260320_templates.sql` (nouveau)
- `app/(crm)/templates/page.tsx` (nouveau)
- `app/(crm)/templates/[id]/page.tsx` (nouveau)
- `components/template-editor.tsx` (nouveau)
- `app/actions/templates.ts` (nouveau)

---

## 4. P2 - MEDIUM (Features Avancees pour Competitivite)

### 4.1 A/B Testing
- Creer variants A/B sur subject et body
- Splitter les contacts en groupes
- Comparer metriques (open rate, click rate, reply rate)
- Selectionner le winner automatiquement

### 4.2 Analytics Avances
- Heatmap des heures d'ouverture
- Best send time par contact
- Conversion funnel detaille par campagne
- Revenue attribution (quel email a genere quelle vente)
- Export PDF des rapports

### 4.3 Interactions Timeline
- Vue timeline complete par contact (tous les touchpoints)
- Filtrable par type (email, sms, call, note)
- Ajouter des notes manuelles
- Attacher des fichiers

### 4.4 Multi-User & Roles
- Ajouter table `team_members` avec roles (admin, sales, viewer)
- Invitations par email
- Permissions granulaires par section
- Activity log / audit trail

### 4.5 Custom Fields
- Builder de champs personnalises par company
- Types : text, number, date, select, multi-select, url
- Affichage dans les fiches contacts
- Filtrable dans les listes

### 4.6 Webhooks Bidirectionnels
- UI pour configurer des webhooks sortants
- Events : contact.created, stage.changed, campaign.sent, deal.won
- Logs des webhooks (success/failure)
- Retry automatique

---

## 5. P3 - NICE-TO-HAVE (Polish & Differenciation)

### 5.1 IA Generative
- Rewrite automatique du body par contact (ton, longueur)
- Suggestion de subject lines basee sur le secteur
- Score de probabilite de reponse

### 5.2 LinkedIn Integration
- Enrichissement automatique via profil LinkedIn
- Actions LinkedIn dans les sequences (visit, connect, message)

### 5.3 Email Warmup
- Domaine warmup progressif
- Reputation monitoring
- Deliverability score

### 5.4 Mobile App (PWA)
- Transformer le dashboard en PWA
- Notifications push
- Actions rapides (changer stage, ajouter note)

### 5.5 Marketplace d'Integrations
- Page Settings/Integrations
- Connect/disconnect providers (Brevo, Resend, Twilio, Slack, Stripe)
- Logs par integration

---

## 6. DETTE TECHNIQUE A RESORBER

| # | Probleme | Fichier(s) | Action |
|---|----------|------------|--------|
| 1 | Backend Express legacy en parallele de Next.js | `src/` entier | Migrer toute la logique vers Server Actions / API Routes Next.js, puis supprimer `src/` |
| 2 | Type casting `as unknown as` | `app/actions/*.ts`, pages | Typer correctement les queries Supabase avec les generics |
| 3 | Dashboard monolithique (365 lignes) | `app/(crm)/dashboard/page.tsx` | Extraire en sous-composants : `<KPIStrip>`, `<RecentLeads>`, `<CampaignPerformance>` |
| 4 | Pas de tests Next.js | - | Ajouter tests avec Vitest + Testing Library pour les server actions et composants |
| 5 | Pas de CI/CD | - | GitHub Actions : lint + type-check + test sur PR |
| 6 | Pas de Docker | - | `Dockerfile` + `docker-compose.yml` (app + Supabase local) |
| 7 | NDJSON storage en doublon avec Supabase | `src/lib/storage.js` | Garder uniquement comme fallback CLI, deprecier progressivement |

---

## 7. ARCHITECTURE CIBLE

```
agentcrm/
├── app/
│   ├── (auth)/           # Login, Register, Forgot Password
│   ├── (crm)/            # Routes protegees
│   │   ├── dashboard/
│   │   ├── contacts/
│   │   ├── companies/
│   │   ├── campaigns/
│   │   ├── templates/    # NOUVEAU - Template editor
│   │   ├── sequences/    # NOUVEAU - Sequence builder
│   │   ├── analytics/    # NOUVEAU - Analytics avances
│   │   └── settings/     # NOUVEAU - Integrations, team, webhooks
│   ├── api/
│   │   └── webhooks/     # Brevo, Resend, Stripe callbacks
│   └── actions/
├── components/
│   ├── ui/               # shadcn/ui (existant)
│   ├── charts/           # Recharts (existant)
│   ├── forms/            # Form components refactores
│   └── shared/           # Pagination, Timeline, CSVWizard
├── lib/
│   ├── supabase/         # Client Supabase (existant)
│   ├── channels/         # NOUVEAU - Email/SMS providers
│   ├── validations/      # NOUVEAU - Schemas Zod
│   └── constants.ts      # NOUVEAU - Constantes centralisees
├── middleware.ts          # NOUVEAU - Auth guard
└── supabase/
    └── migrations/       # Schema evolutif
```

---

## 8. PLAN D'EXECUTION (Ordre Recommande)

### Sprint 1 : Fondations (P0)
1. Auth (middleware + login + RLS)
2. Validation Zod (schemas + server actions)
3. Error/Loading states
4. Constantes centralisees

### Sprint 2 : Coeur Produit (P1)
5. Channel Manager (envoi reel email/SMS)
6. Webhooks reception (tracking opens/clicks)
7. Pagination + recherche avancee
8. Import/Export CSV

### Sprint 3 : Sequences & Templates (P1)
9. Table templates + editeur
10. Table sequence_steps + builder UI
11. Worker d'execution des sequences

### Sprint 4 : Avance (P2)
12. A/B Testing
13. Analytics avances
14. Timeline interactions
15. Multi-user + roles

### Sprint 5 : Polish (P2-P3)
16. Custom fields
17. Webhooks sortants
18. IA generative
19. Refactor dette technique

---

## 9. VERIFICATION

Pour tester les changements :
1. `npm run build` : verification TypeScript + build Next.js
2. `npm run lint` : ESLint
3. `npx jest` : tests existants Express
4. Test manuel : login → dashboard → creer contact → creer campagne → envoyer
5. Verifier les migrations Supabase : `npx supabase db reset`
6. Tester les webhooks avec un tunnel (ngrok/localtunnel)
