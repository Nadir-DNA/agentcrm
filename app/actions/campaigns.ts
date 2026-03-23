'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateUUID, validateRequired, validateOptional, validateChannel, validateStatus, validateArraySize, ValidationError } from '@/lib/validation'
import type { Enums } from '@/types/database'

async function getAuthClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function createCampaign(prevState: { error?: string } | null | void, formData: FormData) {
  try {
    const { supabase, user } = await getAuthClient()
    if (!user) return { error: 'Non autorisé' }

    const name = validateRequired(formData, 'name', 'Le nom')
    const channel = validateChannel(formData.get('channel'))

    const { data, error } = await supabase.from('campaigns').insert({
      name,
      channel,
      status: 'draft',
      company_id: validateOptional(formData, 'company_id'),
      subject: validateOptional(formData, 'subject'),
      body: validateOptional(formData, 'body'),
      scheduled_at: validateOptional(formData, 'scheduled_at'),
    }).select('id').single()

    if (error) return { error: error.message }

    revalidatePath('/campaigns')
    redirect(`/campaigns/${data.id}`)
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message }
    throw err
  }
}

export async function updateCampaign(id: string, prevState: { error?: string } | null | void, formData: FormData) {
  try {
    const { supabase, user } = await getAuthClient()
    if (!user) return { error: 'Non autorisé' }

    validateUUID(id, 'Campaign ID')
    const name = validateRequired(formData, 'name', 'Le nom')
    const channel = validateChannel(formData.get('channel'))

    const { error } = await supabase.from('campaigns').update({
      name,
      channel,
      company_id: validateOptional(formData, 'company_id'),
      subject: validateOptional(formData, 'subject'),
      body: validateOptional(formData, 'body'),
      scheduled_at: validateOptional(formData, 'scheduled_at'),
    }).eq('id', id)

    if (error) return { error: error.message }

    revalidatePath(`/campaigns/${id}`)
    revalidatePath('/campaigns')
    redirect(`/campaigns/${id}`)
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message }
    throw err
  }
}

export async function updateCampaignStatus(id: string, status: Enums<'campaign_status'>): Promise<{ error?: string }> {
  try {
    validateUUID(id, 'Campaign ID')
    validateStatus(status)
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message }
    return { error: 'Paramètres invalides' }
  }

  const { supabase, user } = await getAuthClient()
  if (!user) return { error: 'Non autorisé' }

  const { error } = await supabase.from('campaigns').update({ status }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/campaigns/${id}`)
  revalidatePath('/campaigns')
  return {}
}

export async function deleteCampaign(id: string): Promise<{ error?: string }> {
  try {
    validateUUID(id, 'Campaign ID')
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message }
    return { error: 'ID invalide' }
  }

  const { supabase, user } = await getAuthClient()
  if (!user) return { error: 'Non autorisé' }

  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/campaigns')
  redirect('/campaigns')
}

export async function enrollContacts(campaignId: string, contactIds: string[]): Promise<{ error?: string; success?: boolean }> {
  try {
    validateUUID(campaignId, 'Campaign ID')
    validateArraySize(contactIds, 500, 'contacts')
    contactIds.forEach((id, i) => validateUUID(id, `Contact ID[${i}]`))
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message }
    return { error: 'Paramètres invalides' }
  }

  const { supabase, user } = await getAuthClient()
  if (!user) return { error: 'Non autorisé' }

  const rows = contactIds.map(contact_id => ({
    campaign_id: campaignId,
    contact_id,
    status: 'enrolled' as Enums<'enrollment_status'>,
  }))

  const { error: upsertError } = await supabase
    .from('campaign_contacts')
    .upsert(rows, { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true })

  if (upsertError) return { error: upsertError.message }

  const { count, error: countError } = await supabase
    .from('campaign_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (countError) return { error: countError.message }

  const { error: updateError } = await supabase
    .from('campaigns')
    .update({ sent_count: count ?? 0 })
    .eq('id', campaignId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true }
}

export async function unenrollContact(campaignId: string, contactId: string): Promise<{ error?: string }> {
  try {
    validateUUID(campaignId, 'Campaign ID')
    validateUUID(contactId, 'Contact ID')
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message }
    return { error: 'Paramètres invalides' }
  }

  const { supabase, user } = await getAuthClient()
  if (!user) return { error: 'Non autorisé' }

  const { error: deleteError } = await supabase
    .from('campaign_contacts')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('contact_id', contactId)

  if (deleteError) return { error: deleteError.message }

  const { count, error: countError } = await supabase
    .from('campaign_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (countError) return { error: countError.message }

  const { error: updateError } = await supabase
    .from('campaigns')
    .update({ sent_count: count ?? 0 })
    .eq('id', campaignId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/campaigns/${campaignId}`)
  return {}
}
