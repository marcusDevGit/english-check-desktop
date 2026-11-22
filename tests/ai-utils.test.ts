import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatGeminiError,
  isTransientNetworkError,
  normalizeAudioMimeType,
  parseJsonResponse,
  withTransientRetry
} from '../src/main/services/ai-utils.ts'

describe('AI Evaluator Utilities', () => {
  it('normalizes audio MIME types and falls back to audio/webm for unknown formats', () => {
    assert.equal(normalizeAudioMimeType('audio/webm;codecs=opus'), 'audio/webm')
    assert.equal(normalizeAudioMimeType('AUDIO/OGG;codecs=opus'), 'audio/ogg')
    assert.equal(normalizeAudioMimeType('application/octet-stream'), 'audio/webm')
  })

  it('parses raw JSON and markdown-fenced JSON, rejecting empty strings', () => {
    assert.deepEqual(parseJsonResponse('{"score": 92}'), { score: 92 })
    assert.deepEqual(parseJsonResponse('```json\n{"score": 88}\n```'), { score: 88 })
    assert.throws(() => parseJsonResponse('   '), /empty response/i)
  })

  it('detects transient network errors and retries once before succeeding', async () => {
    assert.equal(isTransientNetworkError(new Error('fetch failed ECONNRESET')), true)
    assert.equal(isTransientNetworkError(new Error('401 API_KEY_INVALID')), false)

    let attempts = 0
    const result = await withTransientRetry(async () => {
      attempts += 1
      if (attempts === 1) {
        throw new Error('fetch failed ETIMEDOUT')
      }
      return 'ok'
    }, 1)

    assert.equal(result, 'ok')
    assert.equal(attempts, 2)
  })

  it('formats Gemini status errors in both PT-BR and EN', async () => {
    const errPt = formatGeminiError(new Error('401 API_KEY_INVALID'), 'pt-BR')
    assert.match(errPt.message, /API Key inválida/i)

    const errEn = formatGeminiError(new Error('429 RESOURCE_EXHAUSTED'), 'en')
    assert.match(errEn.message, /credits depleted|rate limit/i)

    let nonTransientCalls = 0
    await assert.rejects(
      () =>
        withTransientRetry(async () => {
          nonTransientCalls += 1
          throw new Error('403 PERMISSION_DENIED')
        }, 1),
      /PERMISSION_DENIED/
    )
    assert.equal(nonTransientCalls, 1)
  })
})
