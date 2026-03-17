import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-zinc-700 text-zinc-300',
  contacted: 'bg-blue-900 text-blue-300',
  qualified: 'bg-indigo-900 text-indigo-300',
  proposal: 'bg-violet-900 text-violet-300',
  negotiation: 'bg-amber-900 text-amber-300',
  won: 'bg-emerald-900 text-emerald-300',
  lost: 'bg-red-900 text-red-300',
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
    .select('*, companies(name)')
    .order('created_at', { ascending: false })

  if (stage) query = query.eq('stage', stage)
  if (company) query = query.eq('company_id', company)
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)

  const { data: contacts } = await query
  const { data: companies } = await supabase.from('companies').select('id, name').order('name')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-zinc-400 mt-1">{contacts?.length ?? 0} leads</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex gap-3 mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher..."
          className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 w-48 focus:outline-none focus:border-blue-500"
        />
        <select
          name="stage"
          defaultValue={stage}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">Tous les stages</option>
          {Object.entries(STAGE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          name="company"
          defaultValue={company}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="">Toutes les companies</option>
          {companies?.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Filtrer
        </button>
      </form>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-left">
              <th className="px-6 py-3 font-medium">Nom</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Company</th>
              <th className="px-6 py-3 font-medium">Stage</th>
              <th className="px-6 py-3 font-medium">Valeur</th>
              <th className="px-6 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {contacts?.map((contact) => (
              <tr key={contact.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-3">
                  <Link href={`/contacts/${contact.id}`} className="text-white hover:text-blue-400 font-medium">
                    {contact.first_name} {contact.last_name}
                  </Link>
                  {contact.title && <p className="text-xs text-zinc-500">{contact.title}</p>}
                </td>
                <td className="px-6 py-3 text-zinc-400">{contact.email ?? '—'}</td>
                <td className="px-6 py-3">
                  {contact.companies ? (
                    <Link
                      href={`/companies/${contact.company_id}`}
                      className="text-zinc-300 hover:text-blue-400 text-sm"
                    >
                      {(contact.companies as unknown as { name: string }).name}
                    </Link>
                  ) : '—'}
                </td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STAGE_COLORS[contact.stage]}`}>
                    {STAGE_LABELS[contact.stage]}
                  </span>
                </td>
                <td className="px-6 py-3 text-zinc-400">
                  {contact.value ? `${Number(contact.value).toLocaleString('fr-FR')} €` : '—'}
                </td>
                <td className="px-6 py-3 text-zinc-400 text-xs">{contact.source ?? '—'}</td>
              </tr>
            ))}
            {(!contacts || contacts.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                  Aucun lead trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
