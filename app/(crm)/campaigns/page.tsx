import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from "@/components/ui/button"
import { Mail, Plus, Send, Eye, MousePointerClick, MessageSquare } from 'lucide-react'
import { STATUS_VARIANTS, STATUS_LABELS, CHANNEL_LABELS } from '@/lib/constants'
import type { CampaignWithCompany } from '@/lib/supabase/types'

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: rawCampaigns } = await supabase
    .from('campaigns')
    .select('*, companies:company_id(name)')
    .order('created_at', { ascending: false })

  const campaigns = rawCampaigns as unknown as CampaignWithCompany[]

  const active = campaigns?.filter(c => c.status === 'active').length ?? 0
  const totalSent = campaigns?.reduce((s, c) => s + (c.sent_count ?? 0), 0) ?? 0
  const totalOpens = campaigns?.reduce((s, c) => s + (c.open_count ?? 0), 0) ?? 0
  const openRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Campaigns</h1>
          <Badge variant="secondary">{campaigns?.length ?? 0}</Badge>
        </div>
        <Link href="/campaigns/new" className={buttonVariants({ size: 'sm' })}>
          <Plus className="size-4" />
          Nouvelle campagne
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Actives', value: active, icon: Mail },
          { label: 'Envois total', value: totalSent.toLocaleString('fr-FR'), icon: Send },
          { label: 'Ouvertures', value: totalOpens.toLocaleString('fr-FR'), icon: Eye },
          { label: "Taux d'ouverture", value: `${openRate}%`, icon: MousePointerClick },
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

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campagne</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">
                <Send className="size-3 inline mr-1" />Envoyés
              </TableHead>
              <TableHead className="text-right">
                <Eye className="size-3 inline mr-1" />Ouverts
              </TableHead>
              <TableHead className="text-right">
                <MousePointerClick className="size-3 inline mr-1" />Clics
              </TableHead>
              <TableHead className="text-right">
                <MessageSquare className="size-3 inline mr-1" />Rép.
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns?.map((campaign) => {
              const openPct = campaign.sent_count > 0
                ? Math.round((campaign.open_count / campaign.sent_count) * 100)
                : 0
              return (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Link href={`/campaigns/${campaign.id}`} className="font-medium hover:underline">
                      {campaign.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {campaign.companies
                      ? campaign.companies.name
                      : <span className="text-muted-foreground/50 italic">Global</span>}
                  </TableCell>
                  <TableCell className="text-sm">{CHANNEL_LABELS[campaign.channel]}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[campaign.status]}>
                      {STATUS_LABELS[campaign.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{campaign.sent_count}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {campaign.open_count}
                    {openPct > 0 && <span className="text-muted-foreground text-xs ml-1">({openPct}%)</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{campaign.click_count}</TableCell>
                  <TableCell className="text-right tabular-nums">{campaign.reply_count}</TableCell>
                </TableRow>
              )
            })}
            {(!campaigns || campaigns.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Aucune campagne. Créez-en une.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
