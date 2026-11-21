import { GoogleGenAI } from '@google/genai'
import {
  AnalyzePronunciationResponseSchema,
  CheckGrammarResponseSchema,
  type AnalyzePronunciationRequest,
  type AnalyzePronunciationResponse,
  type AppLanguage,
  type CheckGrammarRequest,
  type CheckGrammarResponse
} from '../../shared/ipc-contracts'
import { getAppLanguage, getGeminiApiKey, getGeminiModel } from './settings-store'

function getAiClient(): { client: GoogleGenAI; model: string; language: AppLanguage } {
  const language = getAppLanguage()
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error(
      language === 'pt-BR'
        ? 'Gemini API Key não configurada. Clique na engrenagem (Configurações) para salvar sua chave.'
        : 'Gemini API Key not configured. Open Studio Settings (gear icon) to save your key securely.'
    )
  }
  return {
    client: new GoogleGenAI({ apiKey }),
    model: getGeminiModel(),
    language
  }
}

function normalizeAudioMimeType(rawMimeType: string): string {
  const base = rawMimeType.split(';')[0]?.trim().toLowerCase()
  return base && base.startsWith('audio/') ? base : 'audio/webm'
}

function parseJsonResponse(rawText: string | undefined): unknown {
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

function extractErrorDetails(error: unknown): string {
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

function isTransientNetworkError(error: unknown): boolean {
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

async function withTransientRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (!isTransientNetworkError(error)) {
      throw error
    }
    await new Promise((resolve) => setTimeout(resolve, 600))
    return fn()
  }
}

function formatGeminiError(error: unknown, language: AppLanguage): Error {
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
  if (raw.includes('401') || raw.includes('403') || raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED')) {
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

export async function analyzePronunciation(
  input: AnalyzePronunciationRequest
): Promise<AnalyzePronunciationResponse> {
  const { client, model, language } = getAiClient()
  const cleanMimeType = normalizeAudioMimeType(input.mimeType)
  const audioBase64 = Buffer.from(input.audio).toString('base64')

  const accentLabel =
    input.accent === 'UK' ? 'British English (RP)' : 'American English (General US)'

  const feedbackLangInstruction =
    language === 'pt-BR'
      ? 'Write ALL explanatory feedback fields ("fluencyNote", "words[].note", "articulatoryTip", and "flaggedPhonemes[].userIssue") in clear, simple Brazilian Portuguese (pt-BR) suitable for a beginner-to-intermediate learner. Keep "words[].word" as the original English word and IPA symbols intact.'
      : 'Write all feedback fields in clear English.'

  const prompt = `You are a strict English phonetics coach evaluating a Brazilian Portuguese (PT-BR) speaker.
Target sentence: "${input.targetText}"
Target accent: ${accentLabel}
${feedbackLangInstruction}

Listen carefully to the attached audio recording and evaluate every word in the target sentence.
Detect L1 Portuguese interference (e.g., substituting /t/, /d/, /f/, or /s/ for /θ/ and /ð/; adding an extra /ɪd/ vowel syllable on voiceless -ed endings like "worked" /kt/; swapping /h/ and /r/; vowel length errors like /iː/ vs /ɪ/; word stress shifts).

Return ONLY a valid JSON object matching this exact TypeScript structure:
{
  "overallScore": number (0-100),
  "fluencyNote": string (2-4 word summary),
  "words": [
    {
      "word": string,
      "status": "accurate" | "stress_issue" | "mispronounced",
      "score": number (0-100),
      "ipaExpected": string (optional IPA),
      "note": string (optional brief issue note)
    }
  ],
  "articulatoryTip": string (2-3 concise, practical sentences explaining tongue/lip/voicing adjustments for the worst flagged phoneme),
  "flaggedPhonemes": [
    {
      "word": string,
      "expectedSound": string (e.g. "/θ/", "-ed /t/"),
      "userIssue": string
    }
  ]
}`

  try {
    const response = await withTransientRetry(() =>
      client.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: cleanMimeType
            }
          },
          prompt
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    )

    const parsed = parseJsonResponse(response.text)
    return AnalyzePronunciationResponseSchema.parse(parsed)
  } catch (error) {
    throw formatGeminiError(error, language)
  }
}

export async function checkWriting(
  input: CheckGrammarRequest
): Promise<CheckGrammarResponse> {
  const { client, model, language } = getAiClient()

  const contextLabelMap: Record<CheckGrammarRequest['context'], string> = {
    email: 'Professional Email',
    work_tech: 'Engineering / Workplace Slack or Documentation',
    conversation: 'Everyday Natural Conversation',
    academic: 'Academic / Formal Writing'
  }

  const feedbackLangInstruction =
    language === 'pt-BR'
      ? 'Keep "correctedText" and "naturalAlternatives[].text" in natural English, while writing "naturalAlternatives[].label", "explanations[].rule", and "explanations[].detail" in clear, didactic Brazilian Portuguese (pt-BR).'
      : 'Write all explanations and labels in clear English.'

  const prompt = `You are a senior English writing coach helping a Brazilian Portuguese (PT-BR) speaker write natural, idiomatic English.
Context: ${contextLabelMap[input.context]}
${feedbackLangInstruction}
User draft:
"""
${input.text}
"""

Fix grammatical mistakes, unnatural phrasing, and Portuguese-to-English literal translations (e.g., "since two days ago" -> "for two days", "thinking to do" -> "thinking of doing").

Return ONLY a valid JSON object matching this exact TypeScript structure:
{
  "naturalnessScore": number (0-100),
  "correctedText": string,
  "naturalAlternatives": [
    { "label": string, "text": string }
  ],
  "explanations": [
    { "rule": string (short title), "detail": string (concise 1-2 sentence explanation) }
  ]
}`

  try {
    const response = await withTransientRetry(() =>
      client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      })
    )

    const parsed = parseJsonResponse(response.text)
    return CheckGrammarResponseSchema.parse(parsed)
  } catch (error) {
    throw formatGeminiError(error, language)
  }
}
