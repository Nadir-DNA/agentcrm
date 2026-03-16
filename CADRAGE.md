# AgentCRM - Cadrage Projet

**Version:** 2.0  
**Date:** 2026-03-16

---

## 1. 🎯 OBJECTIFS

### Mission
CRM centralisé pour gérer les prospects de TOUS les projets

### Objectifs
- Centraliser 1000+ contacts
- Gérer campagnes SMS/Email
- Tracker conversions par projet
- Dashboard unifié

---

## 2. 🏗️ ARCHITECTURE

### Stack
- Frontend: Next.js 15
- Backend: Next.js API Routes
- Database: Supabase
- Deploy: Vercel
- SMS: Brevo
- Email: Resend

### Database Schema
companies → contacts → interactions → campaigns

### API Endpoints
GET/POST /api/companies
GET/POST /api/companies/:id/contacts
PUT/DELETE /api/contacts/:id
POST /api/campaigns
POST /api/campaigns/:id/send

---

## 3. ⚠️ SÉCURITÉ

**Règles:**
- ❌ JAMAIS de clés API dans Git
- ✅ Utiliser .env.local (gitignored)
- ✅ Variables dans Vercel Dashboard
- ✅ RLS activé sur Supabase

---

## 4. ✅ CHECKLIST

### Database
- [ ] Créer tables Supabase
- [ ] Activer RLS
- [ ] Importer contacts

### API
- [ ] Companies CRUD
- [ ] Contacts CRUD
- [ ] Campaigns

### UI
- [ ] Dashboard
- [ ] Contacts page
- [ ] Campaigns page

### Deploy
- [ ] Env vars Vercel
- [ ] Build OK
- [ ] Deploy OK

---

**PRÊT À CODER**
