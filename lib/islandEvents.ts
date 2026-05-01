export type IslandEventType = 'journal' | 'gym' | 'duel' | 'oracle'

export interface IslandEvent {
  icon: IslandEventType
  text: string
}

export function dispatchIslandEvent(type: IslandEventType, text: string): void {
  const event = new CustomEvent('nexus:island-event', {
    detail: { icon: type, text: text.toUpperCase() }
  })
  window.dispatchEvent(event)
}
