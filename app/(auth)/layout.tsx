'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="auth-shell">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex justify-center"
      >
        {children}
      </motion.div>
    </div>
  )
}
