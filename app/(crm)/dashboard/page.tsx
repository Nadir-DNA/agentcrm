import { createClient } from '@/lib/supabase/server'

async function getStats() {
  const supabase = await createClient()

  const [
    { count: totalContacts },
    { count: totalCompanies },
    { count: activeCampaigns },
    { data: stageStats },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('contacts').select('stage').then(({ data }) => ({
      data: data?.reduce((acc: Record<string, number>, { stage }) => {
        acc[stage] = (acc[stage] || 0) + 1
        return acc
      }, {}),
    })),
  ])

  const wonCount = (stageStats as Record<string, number> | null | undefined)?.[('won' as string)] ?? 0
  const conversionRate = totalContacts
    ? Math.round((wonCount / totalContacts) * 100)
    : 0

  return { totalContacts, totalCompanies, activeCampaigns, stageStats, conversionRate, wonCount }
}

const STAGE_LABELS: Record<string, string> = {
  new: 'Nouveaux',
  contacted: 'Contactés',
  qualified: 'Qualifiés',
  proposal: 'Proposition',
  negotiation: 'Négociation',
  won: 'Gagnés',
  lost: 'Perdus',
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-zinc-700',
  contacted: 'bg-blue-700',
  qualified: 'bg-indigo-700',
  proposal: 'bg-violet-700',
  negotiation: 'bg-amber-700',
  won: 'bg-emerald-700',
  lost: 'bg-red-800',
}

export default async function DashboardPage() {
  const { totalContacts, totalCompanies, activeCampaigns, stageStats, conversionRate, wonCount } =
    await getStats()

  const stats = [
    { label: 'Leads total', value: totalContacts ?? 0, icon: '👥' },
    { label: 'Companies', value: totalCompanies ?? 0, icon: '🏢' },
    { label: 'Campagnes actives', value: activeCampaigns ?? 0, icon: '📧' },
    { label: 'Taux de conversion', value: `${conversionRate}%`, icon: '🎯' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard Général</h1>
        <p className="text-zinc-400 mt-1">Vue d'ensemble de tous vos projets</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-sm text-zinc-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Pipeline global</h2>
        <div className="space-y-3">
          {Object.entries(STAGE_LABELS).map(([stage, label]) => {
            const count = (stageStats as Record<string, number> | null | undefined)?.[stage] ?? 0
            const pct = (totalContacts ?? 0) > 0 ? Math.round((count / (totalContacts ?? 1)) * 100) : 0
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-sm text-zinc-400 w-24 shrink-0">{label}</span>
                <div className="flex-1 bg-zinc-800 rounded-full h-2">
                  <div
                    className={`${STAGE_COLORS[stage]} h-2 rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm text-zinc-300 w-16 text-right">{count} ({pct}%)</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
