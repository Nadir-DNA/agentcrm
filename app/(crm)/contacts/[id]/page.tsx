import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StageSelector } from '@/components/stage-selector'
import { DeleteContactButton } from '@/components/delete-contact-button'
import { Users, Pencil, Mail, Phone, Building2, Calendar, Tag } from 'lucide-react'

const STAGE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  new: 'secondary', contacted: 'outline', qualified: 'outline',
  proposal: 'outline', negotiation: 'default', won: 'default', lost: 'destructive',
}
const STAGE_LABELS: Record<string, string> = {
  new: 'Nouveau', contacted: 'Contacté', qualified: 'Qualifié',
  proposal: 'Proposition', negotiation: 'Négociation', won: 'Gagné', lost: 'Perdu',
}

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contact } = await supabase
    .from('contacts')
    .select('*, companies:company_id(id, name)')
    .eq('id', id)
    .single()

  if (!contact) notFound()

  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const company = contact.companies as unknown as { id: string; name: string } | null

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <Link href="/contacts" className="hover:text-foreground">Leads</Link>
            <span>/</span>
            <span className="text-foreground">{contact.first_name} {contact.last_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {contact.first_name[0]}{contact.last_name[0]}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{contact.first_name} {contact.last_name}</h1>
              {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
            </div>
            <Badge variant={STAGE_VARIANTS[contact.stage]}>{STAGE_LABELS[contact.stage]}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/contacts/${id}/edit`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <Pencil className="size-3" />
            Modifier
          </Link>
          <DeleteContactButton id={id} companyId={contact.company_id} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Infos */}
        <div className="col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {contact.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-foreground">{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4 shrink-0" />
                  <a href={`tel:${contact.phone}`} className="hover:text-foreground">{contact.phone}</a>
                </div>
              )}
              {company && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-4 shrink-0" />
                  <Link href={`/companies/${company.id}`} className="hover:text-foreground">{company.name}</Link>
                </div>
              )}
              {contact.source && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="size-4 shrink-0" />
                  <span>Source : {contact.source}</span>
                </div>
              )}
              {contact.value && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-4 shrink-0 text-center">€</span>
                  <span>{Number(contact.value).toLocaleString('fr-FR')} €</span>
                </div>
              )}
              {contact.last_contacted_at && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-4 shrink-0" />
                  <span>Dernier contact : {new Date(contact.last_contacted_at).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {contact.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Historique interactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Historique</CardTitle>
            </CardHeader>
            <CardContent>
              {interactions && interactions.length > 0 ? (
                <div className="space-y-3">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="flex gap-3 text-sm">
                      <div className="mt-0.5 size-2 rounded-full bg-primary shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{interaction.type}</span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(interaction.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {interaction.subject && <p className="text-muted-foreground">{interaction.subject}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune interaction enregistrée.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline stage */}
        <div>
          <StageSelector contactId={id} companyId={contact.company_id} currentStage={contact.stage} />
        </div>
      </div>
    </div>
  )
}
