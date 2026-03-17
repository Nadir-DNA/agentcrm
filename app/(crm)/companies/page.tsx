import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CompaniesPage() {
  const supabase = await createClient()

  const { data: companies } = await supabase
    .from('companies')
    .select(`
      *,
      contacts(count),
      campaigns(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-zinc-400 mt-1">{companies?.length ?? 0} companies</p>
        </div>
        <Link
          href="/companies/new"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nouvelle company
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {companies?.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.id}`}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {company.name}
                </h2>
                {company.domain && (
                  <p className="text-sm text-zinc-500">{company.domain}</p>
                )}
              </div>
              {company.industry && (
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                  {company.industry}
                </span>
              )}
            </div>
            <div className="flex gap-4 text-sm text-zinc-400">
              <span>👥 {(company.contacts as unknown as { count: number }[])?.[0]?.count ?? 0} leads</span>
              <span>📧 {(company.campaigns as unknown as { count: number }[])?.[0]?.count ?? 0} campagnes</span>
            </div>
          </Link>
        ))}

        {(!companies || companies.length === 0) && (
          <div className="col-span-3 text-center py-16 text-zinc-500">
            Aucune company. Créez-en une pour commencer.
          </div>
        )}
      </div>
    </div>
  )
}
