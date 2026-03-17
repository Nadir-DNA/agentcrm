import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentCRM',
  description: 'CRM centralisé - Leads, Campaigns, Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  )
}
