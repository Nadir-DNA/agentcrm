import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from "@/components/ui/button"
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Mail, Plus } from 'lucide-react'

export default async function CompaniesPage() {
  const supabase = await createClient()

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  // Count contacts + campaigns per company
  const ids = companies?.map(c => c.id) ?? []
  const [{ data: contactCounts }, { data: campaignCounts }] = await Promise.all([
    supabase.from('contacts').select('company_id').in('company_id', ids),
    supabase.from('campaigns').select('company_id').in('company_id', ids),
  ])

  const contactByCompany = (contactCounts ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.company_id] = (acc[r.company_id] || 0) + 1
    return acc
  }, {})
  const campaignByCompany = (campaignCounts ?? []).reduce<Record<string, number>>((acc, r) => {
    if (r.company_id) acc[r.company_id] = (acc[r.company_id] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Companies</h1>
          <Badge variant="secondary">{companies?.length ?? 0}</Badge>
        </div>
        <Link href="/companies/new" className={buttonVariants({ size: 'sm' })}>
          <Plus className="size-4" />
          Nouvelle company
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {companies?.map((company) => (
          <Link key={company.id} href={`/companies/${company.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{company.name}</CardTitle>
                    {company.domain && (
                      <p className="text-sm text-muted-foreground">{company.domain}</p>
                    )}
                  </div>
                  {company.industry && (
                    <Badge variant="outline" className="text-xs shrink-0">{company.industry}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {contactByCompany[company.id] ?? 0} leads
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="size-3" />
                    {campaignByCompany[company.id] ?? 0} campagnes
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {(!companies || companies.length === 0) && (
          <div className="col-span-3">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <Building2 className="size-10 opacity-30" />
                <p>Aucune company. Créez-en une pour commencer.</p>
                <Link href="/companies/new" className={buttonVariants({ size: 'sm' })}>
                  <Plus className="size-4" />Créer une company
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
