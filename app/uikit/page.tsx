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
        <Button variant="surface" size="sm"
          onClick={(): void => toggleMode()}>
          Toggle Mode
        </Button>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p className="text-caption">Buttons — Mode: {mode}</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="surface"   size="md">Surface</Button>
          <Button variant="surface"   size="md">Secondary</Button>
          <Button variant="ghost"     size="md">Ghost</Button>
          <Button variant="signal"    size="md">Signal</Button>
          <Button variant="danger"    size="md">Danger</Button>
          <Button variant="surface"   size="md" loading>
            Loading
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="surface"  size="sm">Small</Button>
          <Button variant="surface"  size="md">Medium</Button>
          <Button variant="surface"  size="lg">Large</Button>
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
            {isAiProcessing ? 'AI Processing...' : 'AI Ready'}
          </span>
          <Button
            variant="signal"
            size="sm"
            onClick={(): void => {
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
          <OdometerNumber
            value={count}
            suffix="days"
            style={{ fontSize: 48 }}
          />
          <OdometerNumber
            value={count * 10}
            suffix="xp"
            style={{ fontSize: 32, color: 'var(--color-signal)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="surface" size="sm"
            onClick={(): void => setCount(c => c + 1)}>
            +1
          </Button>
          <Button variant="surface" size="sm"
            onClick={(): void => setCount(c => c + 10)}>
            +10
          </Button>
          <Button variant="ghost" size="sm"
            onClick={(): void => setCount(0)}>
            Reset
          </Button>
        </div>
      </div>
    </main>
  )
}
