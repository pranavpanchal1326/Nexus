'use client'

export function triggerProtocolZero(): void {
  window.dispatchEvent(new CustomEvent('nexus:protocol-zero'))
}
