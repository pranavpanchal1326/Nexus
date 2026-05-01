'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { SignalDot } from '@/components/ui/SignalDot'
import { OdometerNumber } from '@/components/ui/OdometerNumber'
import { useNexusStore } from '@/store/nexusStore'

export default function UIKitTest(): React.JSX.Element {
  const { mode, toggleMode, setIsAiProcessing, isAiProcessing } =
    useNexusStore()

  const [count, setCount] = useState(0)
  const [inputVal, setInputVal] = useState('')

  return (
    <main
      style={{
        padding: '48px',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        maxWidth: '640px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 className="text-display" style={{ fontSize: '48px' }}>
          UI Kit
        </h1>
        <SignalDot />
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span className="text-caption">Mode: {mode}</span>
        <Button variant="secondary" size="sm" mode={mode}
          onClick={toggleMode}>
          Toggle Mode
        </Button>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p className="text-caption">Buttons — Mode: {mode}</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="primary"   mode={mode} size="md">Primary</Button>
          <Button variant="secondary" mode={mode} size="md">Secondary</Button>
          <Button variant="ghost"     mode={mode} size="md">Ghost</Button>
          <Button variant="signal"    mode={mode} size="md">Signal</Button>
          <Button variant="danger"    mode={mode} size="md">Danger</Button>
          <Button variant="secondary" mode={mode} size="md" loading>
            Loading
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" mode={mode} size="sm">Small</Button>
          <Button variant="secondary" mode={mode} size="md">Medium</Button>
          <Button variant="secondary" mode={mode} size="lg">Large</Button>
        </div>
      </div>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p className="text-caption">Inputs</p>
        <Input
          label="Display Name"
          placeholder="Enter name..."
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          hint="Monospace. Signal caret."
        />
        <Input
          label="Error State"
          placeholder="Bad value..."
          error="This field is required"
        />
        <Textarea
          label="Journal Entry"
          placeholder="Begin writing..."
          minHeight={100}
          hint="Satoshi font. Signal border on focus."
        />
      </div>

      {/* SignalDot + AI toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p className="text-caption">Signal Dot</p>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <SignalDot />
          <span className="text-caption">
            {isAiProcessing ? 'AI Processing...' : 'AI Idle'}
          </span>
          <Button
            variant="signal"
            size="sm"
            mode={mode}
            onClick={() => {
              setIsAiProcessing(true)
              setTimeout(() => setIsAiProcessing(false), 3000)
            }}
          >
            Simulate AI Call
          </Button>
        </div>
      </div>

      {/* OdometerNumber */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p className="text-caption">Odometer Number</p>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <OdometerNumber value={count} fontSize={48} suffix="days" />
          <OdometerNumber value={count * 10} fontSize={32} suffix="xp"
            color="var(--color-signal)" />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" size="sm" mode={mode}
            onClick={() => setCount(c => c + 1)}>
            +1
          </Button>
          <Button variant="secondary" size="sm" mode={mode}
            onClick={() => setCount(c => c + 10)}>
            +10
          </Button>
          <Button variant="ghost" size="sm" mode={mode}
            onClick={() => setCount(0)}>
            Reset
          </Button>
        </div>
      </div>
    </main>
  )
}
