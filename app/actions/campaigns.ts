'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Enums } from '@/types/database'

export async function createCampaign(prevState: { error?: string } | null | void, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Le nom est requis' }

  const { data, error } = await supabase.from('campaigns').insert({
    name: name.trim(),
    channel: ((formData.get('channel') as string) || 'email') as Enums<'campaign_channel'>,
    status: 'draft',
    company_id: (formData.get('company_id') as string) || null,
    subject: (formData.get('subject') as string) || null,
    body: (formData.get('body') as string) || null,
    scheduled_at: (formData.get('scheduled_at') as string) || null,
  }).select('id').single()

  if (error) return { error: error.message }

  revalidatePath('/campaigns')
  redirect(`/campaigns/${data.id}`)
}

export async function updateCampaign(id: string, prevState: { error?: string } | null | void, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Le nom est requis' }

  const { error } = await supabase.from('campaigns').update({
    name: name.trim(),
    channel: ((formData.get('channel') as string) || 'email') as Enums<'campaign_channel'>,
    company_id: (formData.get('company_id') as string) || null,
    subject: (formData.get('subject') as string) || null,
    body: (formData.get('body') as string) || null,
    scheduled_at: (formData.get('scheduled_at') as string) || null,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/campaigns/${id}`)
  revalidatePath('/campaigns')
  redirect(`/campaigns/${id}`)
}

export async function updateCampaignStatus(id: string, status: Enums<'campaign_status'>) {
  const supabase = await createClient()
  await supabase.from('campaigns').update({ status }).eq('id', id)
  revalidatePath(`/campaigns/${id}`)
  revalidatePath('/campaigns')
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient()
  await supabase.from('campaigns').delete().eq('id', id)
  revalidatePath('/campaigns')
  redirect('/campaigns')
}

export async function enrollContacts(campaignId: string, contactIds: string[]) {
  const supabase = await createClient()

  const rows = contactIds.map(contact_id => ({
    campaign_id: campaignId,
    contact_id,
    status: 'enrolled' as Enums<'enrollment_status'>,
  }))

  const { error } = await supabase
    .from('campaign_contacts')
    .upsert(rows, { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true })

  if (error) return { error: error.message }

  // Update sent_count
  const { count } = await supabase
    .from('campaign_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  await supabase.from('campaigns').update({ sent_count: count ?? 0 }).eq('id', campaignId)

  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true }
}

export async function unenrollContact(campaignId: string, contactId: string) {
  const supabase = await createClient()
  await supabase.from('campaign_contacts')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('contact_id', contactId)

  const { count } = await supabase
    .from('campaign_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  await supabase.from('campaigns').update({ sent_count: count ?? 0 }).eq('id', campaignId)

  revalidatePath(`/campaigns/${campaignId}`)
}
