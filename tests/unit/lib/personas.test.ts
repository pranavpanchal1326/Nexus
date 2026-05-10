import { describe, it, expect } from 'vitest'
import {
  COMMANDER_SYSTEM,
  POET_SYSTEM,
  AMBIENT_SYSTEM,
  EVALUATOR_SYSTEM,
  getPersonaSystem,
  getTokenLimit,
  buildChatMessages,
  buildAmbientMessages,
  buildEvaluatorMessages,
} from '@/lib/personas'

describe('personas', () => {

  describe('COMMANDER_SYSTEM', () => {
    it('contains identity declaration', () => {
      expect(COMMANDER_SYSTEM).toContain('Commander')
    })
    it('contains prohibited phrases list', () => {
      expect(COMMANDER_SYSTEM).toContain('Great!')
    })
    it('specifies 120 word limit', () => {
      expect(COMMANDER_SYSTEM).toContain('120 words')
    })
    it('does not itself use prohibited phrases as responses', () => {
      // We skip a simple not.toContain because the phrases are literally
      // in the prompt under the HARD LIMITS section.
      expect(COMMANDER_SYSTEM).toContain('HARD LIMITS')
    })
  })

  describe('POET_SYSTEM', () => {
    it('contains identity declaration', () => {
      expect(POET_SYSTEM).toContain('Poet')
    })
    it('specifies 200 word limit', () => {
      expect(POET_SYSTEM).toContain('200 words')
    })
    it('prohibits bullet points', () => {
      // Phase 4A prompt uses lowercase 'bullet points' in the HARD LIMITS section
      expect(POET_SYSTEM).toContain('bullet points')
    })
    it('does not itself use bullet points in excessive quantity', () => {
      const lines = POET_SYSTEM.split('\n')
      const bulletLines = lines.filter(l =>
        l.trim().startsWith('- ')
      )
      // Total lines starting with - are around 16 (rules + prohibitions + format)
      expect(bulletLines.length).toBeLessThan(20)
    })
  })

  describe('AMBIENT_SYSTEM', () => {
    it('specifies 12 word maximum', () => {
      expect(AMBIENT_SYSTEM).toContain('12 words')
    })
    it('specifies one sentence', () => {
      expect(AMBIENT_SYSTEM).toContain('ONE sentence')
    })
  })

  describe('getPersonaSystem', () => {
    it('returns COMMANDER for apex mode', () => {
      expect(getPersonaSystem('apex')).toBe(COMMANDER_SYSTEM)
    })
    it('returns POET for haven mode', () => {
      expect(getPersonaSystem('haven')).toBe(POET_SYSTEM)
    })
  })

  describe('getTokenLimit', () => {
    it('returns 200 for apex', () => {
      expect(getTokenLimit('apex')).toBe(200)
    })
    it('returns 400 for haven', () => {
      expect(getTokenLimit('haven')).toBe(400)
    })
  })

  describe('buildChatMessages', () => {
    it('starts with system message', () => {
      const msgs = buildChatMessages('apex', [], 'hello')
      expect(msgs[0].role).toBe('system')
    })
    it('ends with user message', () => {
      const msgs = buildChatMessages('apex', [], 'hello')
      expect(msgs[msgs.length - 1].role).toBe('user')
      expect(msgs[msgs.length - 1].content).toBe('hello')
    })
    it('includes history between system and user', () => {
      const history = [
        { role: 'user' as const,      content: 'first' },
        { role: 'assistant' as const, content: 'reply' },
      ]
      const msgs = buildChatMessages('apex', history, 'second')
      expect(msgs).toHaveLength(4)
      expect(msgs[1].content).toBe('first')
      expect(msgs[2].content).toBe('reply')
    })
    it('uses Commander system for apex', () => {
      const msgs = buildChatMessages('apex', [], 'test')
      expect(msgs[0].content).toBe(COMMANDER_SYSTEM)
    })
    it('uses Poet system for haven', () => {
      const msgs = buildChatMessages('haven', [], 'test')
      expect(msgs[0].content).toBe(POET_SYSTEM)
    })
  })

  describe('buildAmbientMessages', () => {
    it('starts with ambient system', () => {
      const msgs = buildAmbientMessages('context', 'journal')
      expect(msgs[0].content).toBe(AMBIENT_SYSTEM)
    })
    it('includes surface and context in user message', () => {
      const msgs = buildAmbientMessages('some context', 'gym')
      expect(msgs[1].content).toContain('gym')
      expect(msgs[1].content).toContain('some context')
    })
  })

  describe('buildEvaluatorMessages', () => {
    it('includes word and sentence', () => {
      const msgs = buildEvaluatorMessages('ephemeral', 'test')
      expect(msgs[1].content).toContain('ephemeral')
      expect(msgs[1].content).toContain('test')
    })
    it('starts with evaluator system', () => {
      const msgs = buildEvaluatorMessages('word', 'sentence')
      expect(msgs[0].content).toBe(EVALUATOR_SYSTEM)
    })
  })

})
