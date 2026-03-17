import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  LayoutDashboard, Users, Building2, Mail, TrendingUp, DollarSign,
  ArrowUpRight, ArrowDownRight, Plus,
} from 'lucide-react'
import { PipelineFunnelChart } from '@/components/charts/pipeline-funnel'
import { SourceDonutChart } from '@/components/charts/source-donut'
import { CompaniesBarChart } from '@/components/charts/companies-bar'
import { ActivityLineChart } from '@/components/charts/activity-line'

const STAGES = [
  { key: 'new', label: 'Nouveaux' },
  { key: 'contacted', label: 'Contactés' },
  { key: 'qualified', label: 'Qualifiés' },
  { key: 'proposal', label: 'Proposition' },
  { key: 'negotiation', label: 'Négociation' },
  { key: 'won', label: 'Gagnés' },
  { key: 'lost', label: 'Perdus' },
]

const STAGE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  new: 'secondary', contacted: 'outline', qualified: 'outline',
  proposal: 'outline', negotiation: 'default', won: 'default', lost: 'destructive',
}
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline', active: 'default', paused: 'secondary', completed: 'secondary',
}

function trend(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { pct: 100, up: true } : null
  const pct = Math.round(((current - previous) / previous) * 100)
  return { pct: Math.abs(pct), up: pct >= 0 }
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const now30 = daysAgo(30)
  const prev30 = daysAgo(60)

  const [
    { data: contacts },
    { data: companies },
    { data: campaigns },
    { count: leadsThisMonth },
    { count: leadsPrevMonth },
    { count: companiesThisMonth },
    { count: companiesPrevMonth },
  ] = await Promise.all([
    supabase.from('contacts').select('id, first_name, last_name, stage, value, source, created_at, companies:company_id(name)').order('created_at', { ascending: false }),
    supabase.from('companies').select('id, name'),
    supabase.from('campaigns').select('id, name, status, sent_count, open_count, click_count, reply_count').order('created_at', { ascending: false }).limit(5),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).gte('created_at', now30),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).gte('created_at', prev30).lt('created_at', now30),
    supabase.from('companies').select('*', { count: 'exact', head: true }).gte('created_at', now30),
    supabase.from('companies').select('*', { count: 'exact', head: true }).gte('created_at', prev30).lt('created_at', now30),
  ])

  // Pipeline stats
  const stageStats = (contacts ?? []).reduce<Record<string, { count: number; value: number }>>((acc, c) => {
    if (!acc[c.stage]) acc[c.stage] = { count: 0, value: 0 }
    acc[c.stage].count++
    acc[c.stage].value += c.value ?? 0
    return acc
  }, {})

  const pipelineFunnelData = STAGES.map(s => ({
    stage: s.key,
    label: s.label,
    count: stageStats[s.key]?.count ?? 0,
    value: stageStats[s.key]?.value ?? 0,
  }))

  const totalValue = (contacts ?? []).reduce((s, c) => s + (c.value ?? 0), 0)
  const wonValue = stageStats['won']?.value ?? 0
  const wonCount = stageStats['won']?.count ?? 0
  const totalContacts = contacts?.length ?? 0
  const conversionRate = totalContacts > 0 ? Math.round((wonCount / totalContacts) * 100) : 0
  const activeCampaigns = (campaigns ?? []).filter(c => c.status === 'active').length

  // Source breakdown
  const sourceStats = (contacts ?? []).reduce<Record<string, number>>((acc, c) => {
    const s = c.source ?? 'Autre'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})
  const sourceData = Object.entries(sourceStats)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // Top companies by pipeline value
  const companyValue = (contacts ?? []).reduce<Record<string, { name: string; value: number; leads: number }>>((acc, c) => {
    const companyName = c.companies ? (c.companies as unknown as { name: string }).name : 'Inconnu'
    if (!acc[companyName]) acc[companyName] = { name: companyName, value: 0, leads: 0 }
    acc[companyName].value += c.value ?? 0
    acc[companyName].leads++
    return acc
  }, {})
  const topCompanies = Object.values(companyValue)
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Activity last 30 days (leads per day grouped by week)
  const now = new Date()
  const activityMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i -= 3) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    activityMap[d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })] = 0
  }
  ;(contacts ?? [])
    .filter(c => c.created_at >= daysAgo(30))
    .forEach(c => {
      const day = new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      if (activityMap[day] !== undefined) activityMap[day]++
    })
  const activityData = Object.entries(activityMap).map(([date, leads]) => ({ date, leads }))

  // Recent leads
  const recentLeads = (contacts ?? []).slice(0, 6)

  const leadsTrend = trend(leadsThisMonth ?? 0, leadsPrevMonth ?? 0)
  const companiesTrend = trend(companiesThisMonth ?? 0, companiesPrevMonth ?? 0)

  const kpis = [
    {
      label: 'Leads total', value: totalContacts, icon: Users,
      sub: `+${leadsThisMonth ?? 0} ce mois`, trend: leadsTrend,
      href: '/contacts',
    },
    {
      label: 'Pipeline (€)', value: `${totalValue.toLocaleString('fr-FR')} €`, icon: DollarSign,
      sub: `${wonValue.toLocaleString('fr-FR')} € gagnés`, trend: null,
      href: '/contacts',
    },
    {
      label: 'Companies', value: companies?.length ?? 0, icon: Building2,
      sub: `+${companiesThisMonth ?? 0} ce mois`, trend: companiesTrend,
      href: '/companies',
    },
    {
      label: 'Conversion', value: `${conversionRate}%`, icon: TrendingUp,
      sub: `${wonCount} lead${wonCount > 1 ? 's' : ''} gagnés`, trend: null,
      href: '/contacts?stage=won',
    },
    {
      label: 'Campagnes actives', value: activeCampaigns, icon: Mail,
      sub: `${campaigns?.length ?? 0} au total`, trend: null,
      href: '/campaigns',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/contacts/new" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
            <Plus className="size-4" />
            Lead
          </Link>
          <Link href="/campaigns/new" className={buttonVariants({ size: 'sm' })}>
            <Plus className="size-4" />
            Campagne
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map(({ label, value, icon: Icon, sub, trend: t, href }) => (
          <Link key={label} href={href} className="block">
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="size-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">{sub}</span>
                  {t && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${t.up ? 'text-emerald-500' : 'text-red-500'}`}>
                      {t.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      {t.pct}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pipeline par stage</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineFunnelChart data={pipelineFunnelData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <SourceDonutChart data={sourceData} />
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Activité — 30 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityLineChart data={activityData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top companies par pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <CompaniesBarChart data={topCompanies} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Leads récents</CardTitle>
            <Link href="/contacts" className="text-xs text-muted-foreground hover:text-foreground">
              Voir tout →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
                        {c.first_name} {c.last_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.companies ? (c.companies as unknown as { name: string }).name : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STAGE_VARIANTS[c.stage]} className="text-xs">
                        {STAGES.find(s => s.key === c.stage)?.label ?? c.stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {c.value ? `${Number(c.value).toLocaleString('fr-FR')} €` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {recentLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                      Aucun lead encore.{' '}
                      <Link href="/contacts/new" className="underline underline-offset-2">Créer le premier →</Link>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Campaign perf */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Performances campagnes</CardTitle>
            <Link href="/campaigns" className="text-xs text-muted-foreground hover:text-foreground">
              Voir tout →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campagne</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Envoyés</TableHead>
                  <TableHead className="text-right">Taux ouv.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(campaigns ?? []).map((c) => {
                  const rate = c.sent_count > 0 ? Math.round((c.open_count / c.sent_count) * 100) : 0
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[c.status]} className="text-xs">
                          {c.status === 'draft' ? 'Brouillon'
                            : c.status === 'active' ? 'Active'
                            : c.status === 'paused' ? 'En pause'
                            : 'Terminée'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{c.sent_count}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {c.sent_count > 0 ? `${rate}%` : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {(!campaigns || campaigns.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                      Aucune campagne.{' '}
                      <Link href="/campaigns/new" className="underline underline-offset-2">Créer →</Link>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
