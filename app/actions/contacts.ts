'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Enums } from '@/types/database'

export async function createContact(prevState: { error?: string } | null | void, formData: FormData) {
  const supabase = await createClient()

  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const companyId = formData.get('company_id') as string

  if (!firstName?.trim()) return { error: 'Le prénom est requis' }
  if (!lastName?.trim()) return { error: 'Le nom est requis' }
  if (!companyId) return { error: 'La company est requise' }

  const valueRaw = formData.get('value') as string
  const value = valueRaw ? parseFloat(valueRaw) : null

  const { data, error } = await supabase.from('contacts').insert({
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    company_id: companyId,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    title: (formData.get('title') as string) || null,
    stage: ((formData.get('stage') as string) || 'new') as Enums<'contact_stage'>,
    source: (formData.get('source') as string) || null,
    value: isNaN(value!) ? null : value,
    notes: (formData.get('notes') as string) || null,
  }).select('id').single()

  if (error) return { error: error.message }

  revalidatePath(`/companies/${companyId}`)
  revalidatePath('/contacts')
  redirect(`/contacts/${data.id}`)
}

export async function updateContact(id: string, companyId: string, prevState: { error?: string } | null | void, formData: FormData) {
  const supabase = await createClient()

  const valueRaw = formData.get('value') as string
  const value = valueRaw ? parseFloat(valueRaw) : null

  const { error } = await supabase.from('contacts').update({
    first_name: (formData.get('first_name') as string).trim(),
    last_name: (formData.get('last_name') as string).trim(),
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    title: (formData.get('title') as string) || null,
    stage: ((formData.get('stage') as string) || 'new') as Enums<'contact_stage'>,
    source: (formData.get('source') as string) || null,
    value: isNaN(value!) ? null : value,
    notes: (formData.get('notes') as string) || null,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/contacts/${id}`)
  revalidatePath(`/companies/${companyId}`)
  revalidatePath('/contacts')
  redirect(`/contacts/${id}`)
}

export async function updateContactStage(id: string, companyId: string, stage: Enums<'contact_stage'>) {
  const supabase = await createClient()
  await supabase.from('contacts').update({ stage, last_contacted_at: new Date().toISOString() }).eq('id', id)
  revalidatePath(`/contacts/${id}`)
  revalidatePath(`/companies/${companyId}`)
  revalidatePath('/contacts')
}

export async function deleteContact(id: string, companyId: string) {
  const supabase = await createClient()
  await supabase.from('contacts').delete().eq('id', id)
  revalidatePath(`/companies/${companyId}`)
  revalidatePath('/contacts')
  redirect(`/companies/${companyId}`)
}
