import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, Users, Building2, Mail, TrendingUp } from 'lucide-react'

async function getStats() {
  const supabase = await createClient()

  const [
    { count: totalContacts },
    { count: totalCompanies },
    { count: activeCampaigns },
    { data: contacts },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('contacts').select('stage'),
  ])

  const stageStats = (contacts ?? []).reduce<Record<string, number>>((acc, { stage }) => {
    acc[stage] = (acc[stage] || 0) + 1
    return acc
  }, {})

  const wonCount = stageStats['won'] ?? 0
  const conversionRate = totalContacts ? Math.round((wonCount / totalContacts) * 100) : 0

  return { totalContacts, totalCompanies, activeCampaigns, stageStats, conversionRate, wonCount }
}

const STAGES = [
  { key: 'new', label: 'Nouveaux', color: 'bg-muted' },
  { key: 'contacted', label: 'Contactés', color: 'bg-blue-500/20' },
  { key: 'qualified', label: 'Qualifiés', color: 'bg-indigo-500/20' },
  { key: 'proposal', label: 'Proposition', color: 'bg-violet-500/20' },
  { key: 'negotiation', label: 'Négociation', color: 'bg-amber-500/20' },
  { key: 'won', label: 'Gagnés', color: 'bg-emerald-500/20' },
  { key: 'lost', label: 'Perdus', color: 'bg-red-500/20' },
]

export default async function DashboardPage() {
  const { totalContacts, totalCompanies, activeCampaigns, stageStats, conversionRate } = await getStats()

  const kpis = [
    { label: 'Leads total', value: totalContacts ?? 0, icon: Users, trend: null },
    { label: 'Companies', value: totalCompanies ?? 0, icon: Building2, trend: null },
    { label: 'Campagnes actives', value: activeCampaigns ?? 0, icon: Mail, trend: null },
    { label: 'Taux de conversion', value: `${conversionRate}%`, icon: TrendingUp, trend: null },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="size-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Dashboard Général</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pipeline global</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {STAGES.map(({ key, label, color }) => {
            const count = stageStats[key] ?? 0
            const pct = (totalContacts ?? 0) > 0 ? Math.round((count / (totalContacts ?? 1)) * 100) : 0
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className={`${color} border border-border/50 h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm text-muted-foreground w-20 text-right tabular-nums">
                  {count} <span className="text-xs">({pct}%)</span>
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
