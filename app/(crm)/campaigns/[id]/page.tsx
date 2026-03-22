import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import {
  Mail, Pencil, Send, Eye, MousePointerClick, MessageSquare, CalendarClock, Building2,
} from 'lucide-react'
import { CampaignStatusButton } from '@/components/campaign-status-button'
import { EnrollContactsDialog } from '@/components/enroll-contacts-dialog'
import { UnenrollContactButton } from '@/components/unenroll-contact-button'
import { DeleteCampaignButton } from '@/components/delete-campaign-button'
import { STATUS_VARIANTS, STATUS_LABELS, ENROLLMENT_VARIANTS, ENROLLMENT_LABELS, CHANNEL_LABELS } from '@/lib/constants'
import type { CampaignWithCompany, EnrolledContact, ContactForEnroll } from '@/lib/supabase/types'

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: rawCampaign },
    { data: rawEnrolled },
    { data: rawAllContacts },
  ] = await Promise.all([
    supabase.from('campaigns')
      .select('*, companies:company_id(name)')
      .eq('id', id)
      .single(),
    supabase.from('campaign_contacts')
      .select('*, contacts(id, first_name, last_name, email, company_id, companies:company_id(name))')
      .eq('campaign_id', id)
      .order('enrolled_at', { ascending: false }),
    supabase.from('contacts')
      .select('id, first_name, last_name, email, companies:company_id(name)')
      .order('first_name'),
  ])

  if (!rawCampaign) notFound()

  const campaign = rawCampaign as unknown as CampaignWithCompany
  const enrolled = rawEnrolled as unknown as EnrolledContact[]
  const allContacts = rawAllContacts as unknown as ContactForEnroll[]

  const enrolledIds = new Set(enrolled?.map(e => e.contact_id) ?? [])

  const availableContacts = (allContacts ?? [])
    .filter(c => !enrolledIds.has(c.id))
    .map(c => ({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      company_name: c.companies ? c.companies.name : null,
    }))

  const openRate = campaign.sent_count > 0
    ? Math.round((campaign.open_count / campaign.sent_count) * 100)
    : 0
  const clickRate = campaign.sent_count > 0
    ? Math.round((campaign.click_count / campaign.sent_count) * 100)
    : 0
  const replyRate = campaign.sent_count > 0
    ? Math.round((campaign.reply_count / campaign.sent_count) * 100)
    : 0

  const companyName = campaign.companies ? campaign.companies.name : null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/campaigns" className="hover:text-foreground">Campaigns</Link>
          <span>/</span>
          <span className="text-foreground">{campaign.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="size-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">{campaign.name}</h1>
            <Badge variant={STATUS_VARIANTS[campaign.status]}>
              {STATUS_LABELS[campaign.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <CampaignStatusButton id={id} currentStatus={campaign.status} />
            <Link href={`/campaigns/${id}/edit`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
              <Pencil className="size-4" />
              Modifier
            </Link>
            <DeleteCampaignButton id={id} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Envoyés', value: campaign.sent_count, icon: Send },
              { label: `Ouverts (${openRate}%)`, value: campaign.open_count, icon: Eye },
              { label: `Clics (${clickRate}%)`, value: campaign.click_count, icon: MousePointerClick },
              { label: `Réponses (${replyRate}%)`, value: campaign.reply_count, icon: MessageSquare },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                  <Icon className="size-3.5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="text-xl font-bold tabular-nums">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enrolled contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Contacts enrôlés</CardTitle>
              <EnrollContactsDialog campaignId={id} availableContacts={availableContacts} />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Enrôlé le</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolled?.map((e) => {
                    const contact = e.contacts
                    if (!contact) return null
                    return (
                      <TableRow key={e.id}>
                        <TableCell>
                          <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                            {contact.first_name} {contact.last_name}
                          </Link>
                          {contact.companies && (
                            <div className="text-xs text-muted-foreground">{contact.companies.name}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contact.email ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ENROLLMENT_VARIANTS[e.status]}>
                            {ENROLLMENT_LABELS[e.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(e.enrolled_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <UnenrollContactButton campaignId={id} contactId={contact.id} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {(!enrolled || enrolled.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucun contact enrôlé. Ajoutez-en avec le bouton ci-dessus.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {companyName && (
                <div className="flex items-start gap-2">
                  <Building2 className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-xs">Company</div>
                    <div>{companyName}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Mail className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-muted-foreground text-xs">Canal</div>
                  <div>{CHANNEL_LABELS[campaign.channel]}</div>
                </div>
              </div>
              {campaign.scheduled_at && (
                <div className="flex items-start gap-2">
                  <CalendarClock className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-xs">Planifiée</div>
                    <div>{new Date(campaign.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  </div>
                </div>
              )}
              <Separator />
              <div>
                <div className="text-muted-foreground text-xs mb-1">Créée</div>
                <div>{new Date(campaign.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
            </CardContent>
          </Card>

          {campaign.subject && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Objet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{campaign.subject}</p>
              </CardContent>
            </Card>
          )}

          {campaign.body && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contenu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground line-clamp-10">{campaign.body}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
