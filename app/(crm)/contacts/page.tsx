import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button, buttonVariants } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'

const STAGE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  new: 'secondary', contacted: 'outline', qualified: 'outline',
  proposal: 'outline', negotiation: 'default', won: 'default', lost: 'destructive',
}
const STAGE_LABELS: Record<string, string> = {
  new: 'Nouveau', contacted: 'Contacté', qualified: 'Qualifié',
  proposal: 'Proposition', negotiation: 'Négociation', won: 'Gagné', lost: 'Perdu',
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; company?: string; q?: string }>
}) {
  const { stage, company, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('contacts')
    .select('id, first_name, last_name, email, title, stage, value, source, company_id, companies:company_id(name)')
    .order('created_at', { ascending: false })

  if (stage && stage !== 'all') query = query.eq('stage', stage as 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost')
  if (company && company !== 'all') query = query.eq('company_id', company)
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)

  const { data: contacts } = await query
  const { data: companies } = await supabase.from('companies').select('id, name').order('name')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Leads</h1>
          <Badge variant="secondary">{contacts?.length ?? 0}</Badge>
        </div>
        <Link href="/contacts/new" className={buttonVariants({ size: 'sm' })}>
          <Plus className="size-4" />
          Nouveau lead
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Rechercher..." className="w-48" />
        <Select name="stage" defaultValue={stage || 'all'}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les stages</SelectItem>
            {Object.entries(STAGE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="company" defaultValue={company || 'all'}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les companies</SelectItem>
            {companies?.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary" size="sm">Filtrer</Button>
      </form>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Valeur</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts?.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                    {contact.first_name} {contact.last_name}
                  </Link>
                  {contact.title && <p className="text-xs text-muted-foreground">{contact.title}</p>}
                </TableCell>
                <TableCell className="text-muted-foreground">{contact.email ?? '—'}</TableCell>
                <TableCell>
                  {contact.companies ? (
                    <Link href={`/companies/${contact.company_id}`} className="text-sm hover:underline">
                      {(contact.companies as unknown as { name: string }).name}
                    </Link>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={STAGE_VARIANTS[contact.stage]}>
                    {STAGE_LABELS[contact.stage]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {contact.value ? `${Number(contact.value).toLocaleString('fr-FR')} €` : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{contact.source ?? '—'}</TableCell>
              </TableRow>
            ))}
            {(!contacts || contacts.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Aucun lead trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
