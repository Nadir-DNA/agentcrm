'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteCampaign } from '@/app/actions/campaigns'
import { Trash2 } from 'lucide-react'

type Props = { id: string }

export function DeleteCampaignButton({ id }: Props) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      disabled={pending}
      onClick={() => {
        if (confirm('Supprimer cette campagne ? Cette action est irréversible.')) {
          startTransition(() => deleteCampaign(id))
        }
      }}
    >
      <Trash2 className="size-4" />
      {pending ? '...' : 'Supprimer'}
    </Button>
  )
}
