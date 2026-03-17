import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from "@/components/ui/button"
import { Building2, Plus, Users, TrendingUp, Mail, DollarSign } from 'lucide-react'

const STAGE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  new: 'secondary', contacted: 'outline', qualified: 'outline',
  proposal: 'outline', negotiation: 'default', won: 'default', lost: 'destructive',
}
const STAGE_LABELS: Record<string, string> = {
  new: 'Nouveau', contacted: 'Contacté', qualified: 'Qualifié',
  proposal: 'Proposition', negotiation: 'Négociation', won: 'Gagné', lost: 'Perdu',
}
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline', active: 'default', paused: 'secondary', completed: 'secondary',
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: company }, { data: contacts }, { data: campaigns }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', id).single(),
    supabase.from('contacts').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('campaigns').select('*').eq('company_id', id).order('created_at', { ascending: false }),
  ])

  if (!company) notFound()

  const wonCount = contacts?.filter(c => c.stage === 'won').length ?? 0
  const conversionRate = contacts?.length ? Math.round((wonCount / contacts.length) * 100) : 0
  const totalValue = contacts?.reduce((s, c) => s + (c.value ?? 0), 0) ?? 0

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb + header */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/companies" className="hover:text-foreground transition-colors">Companies</Link>
          <span>/</span>
          <span className="text-foreground">{company.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">{company.name}</h1>
            {company.industry && <Badge variant="outline">{company.industry}</Badge>}
          </div>
          <Link href={`/companies/${id}/contacts/new`} className={buttonVariants({ size: 'sm' })}>
            <Plus className="size-4" />
            Ajouter lead
          </Link>
        </div>
        {company.domain && <p className="text-sm text-muted-foreground">{company.domain}</p>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Leads', value: contacts?.length ?? 0, icon: Users },
          { label: 'Gagnés', value: wonCount, icon: TrendingUp },
          { label: 'Conversion', value: `${conversionRate}%`, icon: TrendingUp },
          { label: 'Pipeline', value: `${totalValue.toLocaleString('fr-FR')} €`, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leads table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="size-4" />
            Leads <Badge variant="secondary">{contacts?.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts?.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                      {contact.first_name} {contact.last_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contact.email ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.title ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STAGE_VARIANTS[contact.stage]}>
                      {STAGE_LABELS[contact.stage]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {contact.value ? `${Number(contact.value).toLocaleString('fr-FR')} €` : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {(!contacts || contacts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun lead. Ajoutez-en un.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Campaigns */}
      {campaigns && campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="size-4" />
              Campagnes <Badge variant="secondary">{campaigns.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Envoyés</TableHead>
                  <TableHead className="text-right">Ouverts</TableHead>
                  <TableHead className="text-right">Clics</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Link href={`/campaigns/${campaign.id}`} className="font-medium hover:underline">
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[campaign.status]}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{campaign.sent_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{campaign.open_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{campaign.click_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
