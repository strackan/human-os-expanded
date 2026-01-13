'use client'

import { useEffect, useState } from 'react'
import { getDemoModeConfig } from '@/lib/demo-mode-config'

/**
 * Visual indicator showing when demo mode is active
 * Displays a small badge centered at the top of the screen
 */
export default function DemoModeBadge() {
  const [demoConfig, setDemoConfig] = useState<ReturnType<typeof getDemoModeConfig> | null>(null)

  useEffect(() => {
    setDemoConfig(getDemoModeConfig())
  }, [])

  // Don't render if demo mode is disabled
  if (!demoConfig?.enabled) {
    return null
  }

  return (
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2 z-[9999] px-3 py-1 bg-amber-100 text-amber-900 text-xs font-semibold border-b border-amber-300 flex items-center gap-1.5 shadow-sm"
      title={demoConfig.reason}
    >
      <span className="animate-pulse">🎮</span>
      <span>DEMO MODE</span>
    </div>
  )
}
