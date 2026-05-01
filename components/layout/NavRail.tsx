'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutGrid, 
  Sparkles, 
  BookOpen, 
  PenLine, 
  Dumbbell, 
  Settings,
  User
} from 'lucide-react'
import { SignalDot } from '@/components/ui/SignalDot'
import { useNexusStore } from '@/store/nexusStore'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutGrid, tooltip: 'ARTIFACT' },
  { href: '/oracle',    icon: Sparkles,   tooltip: 'ORACLE'   },
  { href: '/lexicon',   icon: BookOpen,   tooltip: 'LEXICON'  },
  { href: '/journal',   icon: PenLine,    tooltip: 'JOURNAL'  },
  { href: '/gym',       icon: Dumbbell,   tooltip: 'GYM'      },
  { href: '/settings',  icon: Settings,   tooltip: 'SETTINGS' },
] as const

interface NavRailProps {
  user: SupabaseUser
  profile: Profile | null
}

export function NavRail({ user, profile }: NavRailProps): React.JSX.Element {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const physics = useNexusStore(state => state.physics)

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className="nav-rail">
        <div className="nav-rail__top">
          {/* User Avatar */}
          <div className="mb-6 flex flex-col items-center">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.display_name || user.email || ''} 
                className="w-8 h-8 rounded-full border border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-[11px] font-mono text-secondary border border-border">
                {(profile?.display_name || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Nav Items */}
          <div className="flex flex-col gap-2 w-full items-center relative">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)
              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Sliding Active Indicator */}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="nav-indicator"
                      transition={{
                        type: 'spring',
                        stiffness: physics.stiffness,
                        damping: physics.damping,
                        mass: physics.mass
                      }}
                      style={{ top: '50%', transform: 'translateY(-50%)', left: '-8px' }}
                    />
                  )}

                  <Link
                    href={item.href}
                    className={`nav-item ${active ? 'nav-item--active' : ''}`}
                  >
                    <item.icon size={20} strokeWidth={1.5} />
                  </Link>

                  <NavTooltip 
                    label={item.tooltip} 
                    visible={hoveredItem === item.href} 
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="nav-rail__bottom">
          <SignalDot />
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="nav-bottom-bar">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive(item.href) ? 'nav-item--active' : ''}`}
          >
            <item.icon size={22} strokeWidth={1.5} />
          </Link>
        ))}
        <Link 
          href="/settings"
          className={`nav-item ${isActive('/settings') ? 'nav-item--active' : ''}`}
        >
          <User size={22} strokeWidth={1.5} />
        </Link>
      </nav>
    </>
  )
}

function NavTooltip({ label, visible }: { label: string; visible: boolean }): React.JSX.Element {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="nav-tooltip"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
