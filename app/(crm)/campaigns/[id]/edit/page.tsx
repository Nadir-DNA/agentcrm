import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Mail } from 'lucide-react'
import { updateCampaign } from '@/app/actions/campaigns'
import { CampaignForm } from '@/components/campaign-form'

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: campaign }, { data: companies }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', id).single(),
    supabase.from('companies').select('id, name').order('name'),
  ])

  if (!campaign) notFound()

  const action = updateCampaign.bind(null, id)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/campaigns" className="hover:text-foreground">Campaigns</Link>
          <span>/</span>
          <Link href={`/campaigns/${id}`} className="hover:text-foreground">{campaign.name}</Link>
          <span>/</span>
          <span className="text-foreground">Modifier</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Modifier la campagne</h1>
        </div>
      </div>
      <CampaignForm
        action={action}
        campaign={campaign}
        companies={companies ?? []}
        cancelHref={`/campaigns/${id}`}
      />
    </div>
  )
}
