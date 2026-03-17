export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type ContactStage =
  | 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'
export type CampaignChannel = 'email' | 'sms' | 'sequence'
export type EnrollmentStatus = 'active' | 'completed' | 'unsubscribed' | 'bounced'

interface CompanyRow {
  id: string
  name: string
  domain: string | null
  industry: string | null
  size: string | null
  website: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
interface CompanyInsert {
  id?: string
  name: string
  domain?: string | null
  industry?: string | null
  size?: string | null
  website?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

interface ContactRow {
  id: string
  company_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  title: string | null
  stage: ContactStage
  tags: string[]
  source: string | null
  value: number | null
  notes: string | null
  last_contacted_at: string | null
  created_at: string
  updated_at: string
}
interface ContactInsert {
  id?: string
  company_id: string
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  title?: string | null
  stage?: ContactStage
  tags?: string[]
  source?: string | null
  value?: number | null
  notes?: string | null
  last_contacted_at?: string | null
  created_at?: string
  updated_at?: string
}

interface InteractionRow {
  id: string
  contact_id: string
  company_id: string
  type: string
  subject: string | null
  body: string | null
  direction: 'inbound' | 'outbound'
  created_at: string
}
interface InteractionInsert {
  id?: string
  contact_id: string
  company_id: string
  type: string
  subject?: string | null
  body?: string | null
  direction?: 'inbound' | 'outbound'
  created_at?: string
}

interface CampaignRow {
  id: string
  company_id: string | null
  name: string
  channel: CampaignChannel
  status: CampaignStatus
  subject: string | null
  body: string | null
  scheduled_at: string | null
  sent_count: number
  open_count: number
  click_count: number
  reply_count: number
  created_at: string
  updated_at: string
}
interface CampaignInsert {
  id?: string
  company_id?: string | null
  name: string
  channel?: CampaignChannel
  status?: CampaignStatus
  subject?: string | null
  body?: string | null
  scheduled_at?: string | null
  sent_count?: number
  open_count?: number
  click_count?: number
  reply_count?: number
  created_at?: string
  updated_at?: string
}

interface CampaignContactRow {
  id: string
  campaign_id: string
  contact_id: string
  status: EnrollmentStatus
  opened_at: string | null
  clicked_at: string | null
  replied_at: string | null
  enrolled_at: string
}
interface CampaignContactInsert {
  id?: string
  campaign_id: string
  contact_id: string
  status?: EnrollmentStatus
  opened_at?: string | null
  clicked_at?: string | null
  replied_at?: string | null
  enrolled_at?: string
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: CompanyRow
        Insert: CompanyInsert
        Update: Partial<CompanyInsert>
        Relationships: []
      }
      contacts: {
        Row: ContactRow
        Insert: ContactInsert
        Update: Partial<ContactInsert>
        Relationships: [{ foreignKeyName: 'contacts_company_id_fkey'; columns: ['company_id']; referencedRelation: 'companies'; referencedColumns: ['id'] }]
      }
      interactions: {
        Row: InteractionRow
        Insert: InteractionInsert
        Update: Partial<InteractionInsert>
        Relationships: []
      }
      campaigns: {
        Row: CampaignRow
        Insert: CampaignInsert
        Update: Partial<CampaignInsert>
        Relationships: [{ foreignKeyName: 'campaigns_company_id_fkey'; columns: ['company_id']; referencedRelation: 'companies'; referencedColumns: ['id'] }]
      }
      campaign_contacts: {
        Row: CampaignContactRow
        Insert: CampaignContactInsert
        Update: Partial<CampaignContactInsert>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
