'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteContact } from '@/app/actions/contacts'
import { Trash2 } from 'lucide-react'

export function DeleteContactButton({ id, companyId }: { id: string; companyId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Supprimer ce lead ? Cette action est irréversible.')) return
    startTransition(() => {
      deleteContact(id, companyId)
    })
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
      <Trash2 className="size-3" />
      {isPending ? 'Suppression...' : 'Supprimer'}
    </Button>
  )
}
