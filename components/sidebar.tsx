'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/companies', label: 'Companies', icon: '🏢' },
  { href: '/contacts', label: 'Leads', icon: '👥' },
  { href: '/campaigns', label: 'Campaigns', icon: '📧' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 bg-zinc-900 border-r border-zinc-800 min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-zinc-800">
        <span className="text-lg font-bold text-white">AgentCRM</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
