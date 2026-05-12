'use client'

import { useNexusStore } from '@/store/nexusStore'
import { SignalDotLarge } from '@/components/ui/SignalDot'
import { useTimeMode, type PreferredMode } from '@/hooks/useTimeMode'
import { useStats } from '@/hooks/useStats'
import { relativeTime } from '@/lib/utils'
import { PanelAmbientIntel } from '@/components/modules/AmbientIntel'
import { useDashboardAmbient } from '@/hooks/useAmbientAI'

interface IntelPanelProps {
  userId:        string
  preferredMode: PreferredMode
}

export function IntelPanel({ preferredMode }: IntelPanelProps): React.JSX.Element {
  const isIntelPanelOpen = useNexusStore(state => state.isIntelPanelOpen)
  const { mode, windowLabel, isHydrated } = useTimeMode(preferredMode)
  const { data: stats, isLoading } = useStats()
  const { insight } = useDashboardAmbient(stats)

  const activities = stats?.recent_activity ?? []

  return (
    <aside className={`intel-panel ${isIntelPanelOpen ? 'intel-panel--open' : ''}`}>
      {/* Panel Header */}
      <header className="intel-header">
        <span className="intel-title">INTEL</span>
        <SignalDotLarge />
      </header>

      {/* Mode Indicator Block */}
      <div className="intel-mode-block">
        <span
          className="intel-mode-label"
          style={{
            color: mode === 'apex'
              ? 'var(--color-apex)'
              : 'var(--color-haven)'
          }}
        >
          {isHydrated ? `${mode.toUpperCase()} MODE` : '——'}
        </span>
        <span className="intel-time-remaining">
          {isHydrated ? windowLabel : 'Detecting window...'}
        </span>
      </div>

      {/* Live Activity Feed */}
      <div className="intel-feed custom-scrollbar">
        {isLoading ? (
          <ActivitySkeleton />
        ) : activities.length > 0 ? (
          activities.map((item, idx) => (
            <div key={idx} className="intel-activity-item">
              <div className="intel-activity-type">
                {item.type.toUpperCase()}
              </div>
              <p className="intel-activity-preview">
                {item.preview}
              </p>
              <div className="intel-activity-time">
                {relativeTime(item.created_at)}
              </div>
            </div>
          ))
        ) : (
          <div className="intel-empty">
            <p className="intel-empty-label">NO ACTIVITY YET</p>
            <p className="intel-empty-hint">
              Begin. The system is watching.
            </p>
          </div>
        )}
      </div>

      {/* Ambient AI Whisper */}
      <div className="intel-whisper">
        <PanelAmbientIntel insight={insight} />
      </div>

      <style jsx>{`
        .intel-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: var(--intel-width);
          height: 100vh;
          background: var(--color-bg);
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          z-index: 40;
          transform: translateX(100%);
          transition: transform 0.4s var(--ease-out-expo);
        }

        .intel-panel--open {
          transform: translateX(0);
        }

        .intel-header {
          height: 56px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--color-border);
        }

        .intel-title {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          color: var(--color-text-secondary);
        }

        .intel-mode-block {
          padding: 16px;
          border-bottom: 1px solid var(--color-border-subtle);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .intel-mode-label {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
        }

        .intel-time-remaining {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text-secondary);
        }

        .intel-feed {
          flex: 1;
          overflow-y: auto;
          padding: 12px 0;
        }

        .intel-activity-item {
          padding: 10px 16px;
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .intel-activity-item:last-child {
          border-bottom: none;
        }

        .intel-activity-type {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.1em;
          color: var(--color-text-disabled);
          margin-bottom: 4px;
        }

        .intel-activity-preview {
          font-family: var(--font-sans);
          font-size: 12px;
          line-height: 1.5;
          color: var(--color-text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .intel-activity-time {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-text-disabled);
        }

        .intel-empty {
          padding: 24px 16px;
          text-align: center;
        }

        .intel-empty-label {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text-disabled);
          margin-bottom: 4px;
        }

        .intel-empty-hint {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 14px;
          color: var(--color-text-disabled);
        }

        .intel-whisper {
          padding: 16px;
          min-height: 64px;
          border-top: 1px solid var(--color-border);
        }

        .intel-whisper-content {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text-secondary);
          opacity: 0.7;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1E1E1E;
          border-radius: 2px;
        }
      `}</style>
    </aside>
  )
}

function ActivitySkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col">
      {[1, 2, 3].map((i) => (
        <div key={i} className="px-4 py-3 border-b border-border-subtle">
          <div className="w-16 h-2 skeleton-shimmer rounded mb-2" />
          <div className="w-full h-3 skeleton-shimmer rounded mb-1" />
          <div className="w-2/3 h-3 skeleton-shimmer rounded mb-2" />
          <div className="w-10 h-2 skeleton-shimmer rounded" />
        </div>
      ))}
    </div>
  )
}
