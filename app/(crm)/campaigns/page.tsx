import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-700 text-zinc-300',
  active: 'bg-emerald-900 text-emerald-300',
  paused: 'bg-amber-900 text-amber-300',
  completed: 'bg-blue-900 text-blue-300',
}
const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', active: 'Active', paused: 'En pause', completed: 'Terminée',
}
const CHANNEL_ICONS: Record<string, string> = {
  email: '📧', sms: '💬', sequence: '🔄',
}

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })

  const active = campaigns?.filter(c => c.status === 'active').length ?? 0
  const totalSent = campaigns?.reduce((s, c) => s + c.sent_count, 0) ?? 0
  const totalOpens = campaigns?.reduce((s, c) => s + c.open_count, 0) ?? 0
  const openRate = totalSent ? Math.round((totalOpens / totalSent) * 100) : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-zinc-400 mt-1">{campaigns?.length ?? 0} campagnes</p>
        </div>
        <Link
          href="/campaigns/new"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nouvelle campagne
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Actives', value: active, icon: '🟢' },
          { label: 'Envois total', value: totalSent.toLocaleString('fr-FR'), icon: '📤' },
          { label: 'Ouvertures', value: totalOpens.toLocaleString('fr-FR'), icon: '👁' },
          { label: "Taux d'ouverture", value: `${openRate}%`, icon: '📊' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-sm text-zinc-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Campaigns list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-left">
              <th className="px-6 py-3 font-medium">Campagne</th>
              <th className="px-6 py-3 font-medium">Company</th>
              <th className="px-6 py-3 font-medium">Canal</th>
              <th className="px-6 py-3 font-medium">Statut</th>
              <th className="px-6 py-3 font-medium">Envoyés</th>
              <th className="px-6 py-3 font-medium">Ouverts</th>
              <th className="px-6 py-3 font-medium">Clics</th>
              <th className="px-6 py-3 font-medium">Réponses</th>
            </tr>
          </thead>
          <tbody>
            {campaigns?.map((campaign) => (
              <tr key={campaign.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-3">
                  <Link href={`/campaigns/${campaign.id}`} className="text-white hover:text-blue-400 font-medium">
                    {campaign.name}
                  </Link>
                </td>
                <td className="px-6 py-3 text-zinc-400 text-xs">
                  {campaign.companies
                    ? (campaign.companies as unknown as { name: string }).name
                    : <span className="text-zinc-600">Global</span>}
                </td>
                <td className="px-6 py-3">
                  <span className="text-lg">{CHANNEL_ICONS[campaign.channel]}</span>
                </td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[campaign.status]}`}>
                    {STATUS_LABELS[campaign.status]}
                  </span>
                </td>
                <td className="px-6 py-3 text-zinc-300">{campaign.sent_count}</td>
                <td className="px-6 py-3 text-zinc-300">
                  {campaign.open_count}
                  {campaign.sent_count > 0 && (
                    <span className="text-xs text-zinc-500 ml-1">
                      ({Math.round((campaign.open_count / campaign.sent_count) * 100)}%)
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-zinc-300">{campaign.click_count}</td>
                <td className="px-6 py-3 text-zinc-300">{campaign.reply_count}</td>
              </tr>
            ))}
            {(!campaigns || campaigns.length === 0) && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-zinc-500">
                  Aucune campagne. Créez-en une.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
