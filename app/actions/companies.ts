'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCompany(prevState: { error?: string } | null | void, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Le nom est requis' }

  const { data, error } = await supabase.from('companies').insert({
    name: name.trim(),
    domain: (formData.get('domain') as string) || null,
    industry: (formData.get('industry') as string) || null,
    size: (formData.get('size') as string) || null,
    website: (formData.get('website') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }).select('id').single()

  if (error) return { error: error.message }

  revalidatePath('/companies')
  redirect(`/companies/${data.id}`)
}

export async function updateCompany(id: string, prevState: { error?: string } | null | void, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Le nom est requis' }

  const { error } = await supabase.from('companies').update({
    name: name.trim(),
    domain: (formData.get('domain') as string) || null,
    industry: (formData.get('industry') as string) || null,
    size: (formData.get('size') as string) || null,
    website: (formData.get('website') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/companies/${id}`)
  revalidatePath('/companies')
  redirect(`/companies/${id}`)
}

export async function deleteCompany(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/companies')
  redirect('/companies')
}
