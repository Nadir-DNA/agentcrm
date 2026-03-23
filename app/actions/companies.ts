'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateUUID, validateRequired, validateOptional, ValidationError } from '@/lib/validation'

async function getAuthClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function createCompany(prevState: { error?: string } | null | void, formData: FormData) {
  try {
    const { supabase, user } = await getAuthClient()
    if (!user) return { error: 'Non autorisé' }

    const name = validateRequired(formData, 'name', 'Le nom')

    const { data, error } = await supabase.from('companies').insert({
      name,
      domain: validateOptional(formData, 'domain'),
      industry: validateOptional(formData, 'industry'),
      size: validateOptional(formData, 'size'),
      website: validateOptional(formData, 'website'),
      notes: validateOptional(formData, 'notes'),
    }).select('id').single()

    if (error) return { error: error.message }

    revalidatePath('/companies')
    redirect(`/companies/${data.id}`)
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message }
    throw err
  }
}

export async function updateCompany(id: string, prevState: { error?: string } | null | void, formData: FormData) {
  try {
    const { supabase, user } = await getAuthClient()
    if (!user) return { error: 'Non autorisé' }

    validateUUID(id, 'Company ID')
    const name = validateRequired(formData, 'name', 'Le nom')

    const { error } = await supabase.from('companies').update({
      name,
      domain: validateOptional(formData, 'domain'),
      industry: validateOptional(formData, 'industry'),
      size: validateOptional(formData, 'size'),
      website: validateOptional(formData, 'website'),
      notes: validateOptional(formData, 'notes'),
    }).eq('id', id)

    if (error) return { error: error.message }

    revalidatePath(`/companies/${id}`)
    revalidatePath('/companies')
    redirect(`/companies/${id}`)
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message }
    throw err
  }
}

export async function deleteCompany(id: string): Promise<{ error?: string }> {
  try {
    validateUUID(id, 'Company ID')
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message }
    return { error: 'ID invalide' }
  }

  const { supabase, user } = await getAuthClient()
  if (!user) return { error: 'Non autorisé' }

  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/companies')
  redirect('/companies')
}
