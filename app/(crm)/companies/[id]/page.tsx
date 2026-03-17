import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const STAGE_LABELS: Record<string, string> = {
  new: 'Nouveau', contacted: 'Contacté', qualified: 'Qualifié',
  proposal: 'Proposition', negotiation: 'Négociation', won: 'Gagné', lost: 'Perdu',
}
const STAGE_COLORS: Record<string, string> = {
  new: 'bg-zinc-700 text-zinc-300',
  contacted: 'bg-blue-900 text-blue-300',
  qualified: 'bg-indigo-900 text-indigo-300',
  proposal: 'bg-violet-900 text-violet-300',
  negotiation: 'bg-amber-900 text-amber-300',
  won: 'bg-emerald-900 text-emerald-300',
  lost: 'bg-red-900 text-red-300',
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <Link href="/companies" className="hover:text-zinc-300">Companies</Link>
            <span>/</span>
            <span className="text-zinc-300">{company.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{company.name}</h1>
          {company.domain && <p className="text-zinc-400">{company.domain}</p>}
        </div>
        <Link
          href={`/companies/${id}/contacts/new`}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Ajouter lead
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Leads', value: contacts?.length ?? 0 },
          { label: 'Gagnés', value: wonCount },
          { label: 'Conversion', value: `${conversionRate}%` },
          { label: 'Campagnes', value: campaigns?.length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-zinc-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Leads table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">Leads ({contacts?.length ?? 0})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-left">
              <th className="px-6 py-3 font-medium">Nom</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Titre</th>
              <th className="px-6 py-3 font-medium">Stage</th>
              <th className="px-6 py-3 font-medium">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {contacts?.map((contact) => (
              <tr key={contact.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-3">
                  <Link href={`/contacts/${contact.id}`} className="text-white hover:text-blue-400">
                    {contact.first_name} {contact.last_name}
                  </Link>
                </td>
                <td className="px-6 py-3 text-zinc-400">{contact.email ?? '—'}</td>
                <td className="px-6 py-3 text-zinc-400">{contact.title ?? '—'}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STAGE_COLORS[contact.stage]}`}>
                    {STAGE_LABELS[contact.stage]}
                  </span>
                </td>
                <td className="px-6 py-3 text-zinc-400">
                  {contact.value ? `${contact.value.toLocaleString('fr-FR')} €` : '—'}
                </td>
              </tr>
            ))}
            {(!contacts || contacts.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  Aucun lead. Ajoutez-en un.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Campaigns */}
      {campaigns && campaigns.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="font-semibold text-white">Campagnes</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{campaign.name}</p>
                  <p className="text-sm text-zinc-400">{campaign.channel}</p>
                </div>
                <div className="flex gap-4 text-sm text-zinc-400">
                  <span>📤 {campaign.sent_count}</span>
                  <span>👁 {campaign.open_count}</span>
                  <span>🖱 {campaign.click_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
