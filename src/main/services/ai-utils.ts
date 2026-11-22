import type { AppLanguage } from '../../shared/ipc-contracts'

export function normalizeAudioMimeType(rawMimeType: string): string {
  const base = rawMimeType.split(';')[0]?.trim().toLowerCase()
  return base && base.startsWith('audio/') ? base : 'audio/webm'
}

export function parseJsonResponse(rawText: string | undefined): unknown {
  if (!rawText || !rawText.trim()) {
    throw new Error('Gemini returned an empty response.')
  }
  try {
    return JSON.parse(rawText)
  } catch {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/```$/i, '')
      .trim()
    return JSON.parse(cleaned)
  }
}

export function extractErrorDetails(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const cause = (error as Error & { cause?: unknown }).cause
  if (cause instanceof Error) {
    return `${error.message} ${cause.message}`
  }
  if (cause && typeof cause === 'object' && 'code' in cause) {
    return `${error.message} ${String((cause as { code?: unknown }).code)}`
  }
  return error.message
}

export function isTransientNetworkError(error: unknown): boolean {
  const details = extractErrorDetails(error).toLowerCase()
  return (
    details.includes('fetch failed') ||
    details.includes('econnreset') ||
    details.includes('etimedout') ||
    details.includes('eai_again') ||
    details.includes('und_err_connect_timeout') ||
    details.includes('socket hang up')
  )
}

export async function withTransientRetry<T>(
  fn: () => Promise<T>,
  delayMs = 600
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (!isTransientNetworkError(error)) {
      throw error
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    return fn()
  }
}

export function formatGeminiError(error: unknown, language: AppLanguage): Error {
  const raw = extractErrorDetails(error)
  const isPt = language === 'pt-BR'

  if (isTransientNetworkError(error)) {
    return new Error(
      isPt
        ? 'Falha de conexão com a Gemini API (rede ou timeout). Verifique sua internet e tente novamente.'
        : 'Connection failed while reaching Gemini API (network or timeout). Check your internet and try again.'
    )
  }
  if (raw.includes('402') || raw.includes('RESOURCE_EXHAUSTED') || raw.includes('depleted')) {
    return new Error(
      isPt
        ? 'Créditos da Gemini API esgotados (402). Verifique seu projeto/faturamento no Google AI Studio ou troque a chave em Configurações.'
        : 'Gemini API credits depleted (402). Check billing in Google AI Studio or update your key in Settings.'
    )
  }
  if (
    raw.includes('401') ||
    raw.includes('403') ||
    raw.includes('API_KEY_INVALID') ||
    raw.includes('PERMISSION_DENIED')
  ) {
    return new Error(
      isPt
        ? 'Gemini API Key inválida ou sem permissão (401/403). Atualize sua chave em Configurações.'
        : 'Invalid or unauthorized Gemini API Key (401/403). Update your key in Settings.'
    )
  }
  if (raw.includes('404') || raw.includes('NOT_FOUND')) {
    return new Error(
      isPt
        ? 'Modelo Gemini não encontrado (404). Verifique o modelo configurado (ex.: gemini-3.8-flash).'
        : 'Gemini model not found (404). Verify the active model (e.g., gemini-3.8-flash).'
    )
  }
  if (raw.includes('429') || raw.includes('RATE_LIMIT') || raw.toLowerCase().includes('quota')) {
    return new Error(
      isPt
        ? 'Limite de requisições da Gemini API atingido (429). Aguarde alguns segundos e tente novamente.'
        : 'Gemini API rate limit reached (429). Wait a few seconds and try again.'
    )
  }

  return error instanceof Error ? error : new Error(raw)
}
