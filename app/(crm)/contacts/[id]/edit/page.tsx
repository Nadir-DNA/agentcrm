import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { updateContact } from '@/app/actions/contacts'
import { ContactForm } from '@/components/contact-form'

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: contact }, { data: companies }] = await Promise.all([
    supabase.from('contacts').select('*').eq('id', id).single(),
    supabase.from('companies').select('id, name').order('name'),
  ])

  if (!contact) notFound()

  const action = updateContact.bind(null, id, contact.company_id)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/contacts" className="hover:text-foreground">Leads</Link>
          <span>/</span>
          <Link href={`/contacts/${id}`} className="hover:text-foreground">{contact.first_name} {contact.last_name}</Link>
          <span>/</span>
          <span className="text-foreground">Modifier</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Modifier {contact.first_name} {contact.last_name}</h1>
        </div>
      </div>
      <ContactForm
        action={action}
        contact={contact}
        companies={companies ?? []}
        cancelHref={`/contacts/${id}`}
      />
    </div>
  )
}
