import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AnalyzePronunciationRequestSchema,
  CheckGrammarRequestSchema,
  GenerateCustomTrackRequestSchema,
  RoleplayTurnRequestSchema,
  SaveApiKeyRequestSchema,
  Uint8ArraySchema
} from '../src/shared/ipc-contracts.ts'

describe('IPC Zod Contracts', () => {
  it('validates non-empty Uint8Array payloads and rejects empty or plain ArrayBuffer', () => {
    const valid = Uint8ArraySchema.safeParse(new Uint8Array([1, 2, 3]))
    assert.equal(valid.success, true)

    const empty = Uint8ArraySchema.safeParse(new Uint8Array([]))
    assert.equal(empty.success, false)

    const rawBuffer = Uint8ArraySchema.safeParse(new ArrayBuffer(8))
    assert.equal(rawBuffer.success, false)
  })

  it('validates AnalyzePronunciationRequest payload cleanly', () => {
    const res = AnalyzePronunciationRequestSchema.safeParse({
      audio: new Uint8Array([10, 20, 30]),
      mimeType: 'audio/webm;codecs=opus',
      targetText: 'I thought they worked through both checklists.',
      accent: 'US',
      durationSeconds: 4
    })
    assert.equal(res.success, true)

    const badAccent = AnalyzePronunciationRequestSchema.safeParse({
      audio: new Uint8Array([10]),
      mimeType: 'audio/webm',
      targetText: 'Hello world',
      accent: 'AU'
    })
    assert.equal(badAccent.success, false)
  })

  it('defaults CheckGrammar context to work_tech and enforces non-empty text', () => {
    const parsed = CheckGrammarRequestSchema.parse({ text: 'Hello team' })
    assert.equal(parsed.context, 'work_tech')

    const empty = CheckGrammarRequestSchema.safeParse({ text: '   ' })
    assert.equal(empty.success, false)
  })

  it('requires either userMessage or audio+mimeType in RoleplayTurnRequestSchema', () => {
    const neither = RoleplayTurnRequestSchema.safeParse({
      persona: 'Alex',
      scenario: 'Daily standup sync',
      objectives: ['Share progress'],
      history: [{ role: 'assistant', content: 'How is it going?' }]
    })
    assert.equal(neither.success, false)

    const withText = RoleplayTurnRequestSchema.safeParse({
      persona: 'Alex',
      scenario: 'Daily standup sync',
      objectives: ['Share progress'],
      history: [{ role: 'assistant', content: 'How is it going?' }],
      userMessage: 'Yesterday I finished the API migration.'
    })
    assert.equal(withText.success, true)
  })

  it('enforces minimum length on GenerateCustomTrackRequestSchema and SaveApiKeyRequestSchema', () => {
    const shortTrack = GenerateCustomTrackRequestSchema.safeParse({
      level: 'B2',
      sourceText: 'Too short text'
    })
    assert.equal(shortTrack.success, false)

    const validTrack = GenerateCustomTrackRequestSchema.safeParse({
      level: 'B2',
      sourceText:
        'Distributed systems often trade strong consistency for lower read latency and higher availability across regions.'
    })
    assert.equal(validTrack.success, true)

    assert.equal(SaveApiKeyRequestSchema.safeParse({ apiKey: 'short' }).success, false)
    assert.equal(
      SaveApiKeyRequestSchema.safeParse({ apiKey: 'AIzaSyDummyExampleKey12345' }).success,
      true
    )
  })
})
