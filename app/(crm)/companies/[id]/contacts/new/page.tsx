import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { createContact } from '@/app/actions/contacts'
import { ContactForm } from '@/components/contact-form'

export default async function NewContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: company }, { data: companies }] = await Promise.all([
    supabase.from('companies').select('id, name').eq('id', id).single(),
    supabase.from('companies').select('id, name').order('name'),
  ])

  if (!company) notFound()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/companies" className="hover:text-foreground">Companies</Link>
          <span>/</span>
          <Link href={`/companies/${id}`} className="hover:text-foreground">{company.name}</Link>
          <span>/</span>
          <span className="text-foreground">Nouveau lead</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Nouveau lead</h1>
        </div>
      </div>
      <ContactForm
        action={createContact}
        companies={companies ?? []}
        defaultCompanyId={id}
        cancelHref={`/companies/${id}`}
      />
    </div>
  )
}
