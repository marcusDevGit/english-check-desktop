import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import {
  AnalyzePronunciationResponseSchema,
  CheckGrammarResponseSchema,
  EvaluateOpenQaResponseSchema,
  EvaluateRecallResponseSchema,
  GeneratedDrillsPayloadSchema,
  GeneratedLessonSchema,
  GeneratedTrackSchema,
  RoleplayTurnResponseSchema,
  type AnalyzePronunciationRequest,
  type AnalyzePronunciationResponse,
  type AppLanguage,
  type CheckGrammarRequest,
  type CheckGrammarResponse,
  type EvaluateOpenQaRequest,
  type EvaluateOpenQaResponse,
  type EvaluateRecallRequest,
  type EvaluateRecallResponse,
  type GenerateCustomTrackRequest,
  type GeneratedTrack,
  type PhonemeError,
  type RoleplayTurnRequest,
  type RoleplayTurnResponse
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

export async function evaluateActiveRecall(
  input: EvaluateRecallRequest
): Promise<EvaluateRecallResponse> {
  const { client, model, language } = getAiClient()
  const feedbackLang =
    language === 'pt-BR'
      ? 'Write "feedback" and "grammarNote" in clear, encouraging Brazilian Portuguese (pt-BR). Keep "betterPhrasing" in natural English.'
      : 'Write all fields in clear English.'

  const prompt = `You are an English coach evaluating an Active Recall (PT-BR -> EN) translation/speaking attempt.
Original Portuguese intention: "${input.promptPt}"
Reference English sentence: "${input.expectedEnglish}"
Learner's English attempt: "${input.userAnswer}"
${feedbackLang}

Evaluate if the learner accurately conveyed the Portuguese meaning in natural English (even if they used valid synonyms instead of the exact reference sentence).

Return ONLY valid JSON:
{
  "score": number (0-100),
  "isMeaningAccurate": boolean,
  "feedback": string (1-2 concise sentences),
  "betterPhrasing": string (the most natural English version preserving their intent),
  "grammarNote": string (concise tip on any error or why their phrasing works)
}`

  try {
    const response = await withTransientRetry(() =>
      client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.25
        }
      })
    )

    const parsed = parseJsonResponse(response.text)
    return EvaluateRecallResponseSchema.parse(parsed)
  } catch (error) {
    throw formatGeminiError(error, language)
  }
}

export async function generateCustomDrills(
  topErrors: PhonemeError[],
  count: number
): Promise<
  Array<{
    sentence: string
    ipa: string
    category: string
    promptPt: string
    contrastHint: string
    activityType: 'pronunciation' | 'minimal_pair'
  }>
> {
  const { client, model, language } = getAiClient()
  const errorContext =
    topErrors.length > 0
      ? topErrors
          .slice(0, 5)
          .map(
            (e) =>
              `- Word "${e.word}" (expected ${e.expectedSound}, issue: ${e.userIssue}, ${e.occurrences}x)`
          )
          .join('\n')
      : '- Common Brazilian Portuguese L1 targets: /θ/, /ð/, voiceless -ed /t/, vowel contrast /iː/ vs /ɪ/, initial /h/ vs /r/'

  const prompt = `Create ${count} fresh, practical English practice sentences for a Brazilian Portuguese (PT-BR) learner, specifically targeting these phoneme hotspots:
${errorContext}

Write "promptPt" (natural Brazilian Portuguese translation) and "contrastHint" (short PT-BR coaching hint) in Brazilian Portuguese.
Write "sentence", "ipa" (General US IPA), and "category" (concise label, e.g. "AI Drill • /θ/ & -ed") cleanly.

Return ONLY valid JSON:
{
  "drills": [
    {
      "sentence": string (8-16 words, natural spoken English),
      "ipa": string,
      "category": string,
      "promptPt": string,
      "contrastHint": string,
      "activityType": "pronunciation" | "minimal_pair"
    }
  ]
}`

  try {
    const response = await withTransientRetry(() =>
      client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      })
    )

    const parsed = parseJsonResponse(response.text)
    return GeneratedDrillsPayloadSchema.parse(parsed).drills
  } catch (error) {
    throw formatGeminiError(error, language)
  }
}

export async function evaluateOpenQa(
  input: EvaluateOpenQaRequest
): Promise<EvaluateOpenQaResponse> {
  const { client, model, language } = getAiClient()
  const base64Audio = Buffer.from(input.audio).toString('base64')
  const mimeType = normalizeAudioMimeType(input.mimeType)
  const feedbackLang =
    language === 'pt-BR'
      ? 'Write "feedback" in encouraging, concise Brazilian Portuguese (pt-BR). Keep "transcript", "coveredTopics", "missingTopics", and "improvedAnswer" in natural English.'
      : 'Write all fields in clear English.'

  const prompt = `You are an English speaking coach evaluating an Open Q&A audio response from a Brazilian Portuguese (PT-BR) learner at CEFR ${input.level}.
Question asked: "${input.question}"
Expected topics to cover:
${input.expectedTopics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

${feedbackLang}

Listen carefully to the learner's recorded English speech:
1. Transcribe accurately what they said in "transcript".
2. Evaluate topic coverage, fluency, clarity, and natural phrasing.
3. Map each expected topic verbatim into either "coveredTopics" or "missingTopics".
4. Provide an authentic CEFR ${input.level} "improvedAnswer" (2-4 sentences).

Return ONLY valid JSON:
{
  "score": number (0-100),
  "transcript": string,
  "coveredTopics": string[],
  "missingTopics": string[],
  "feedback": string,
  "improvedAnswer": string
}`

  try {
    const response = await withTransientRetry(() =>
      client.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Audio,
                  mimeType
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      })
    )

    const parsed = parseJsonResponse(response.text)
    return EvaluateOpenQaResponseSchema.parse(parsed)
  } catch (error) {
    throw formatGeminiError(error, language)
  }
}

export async function evaluateRoleplayTurn(
  input: RoleplayTurnRequest
): Promise<RoleplayTurnResponse> {
  const { client, model, language } = getAiClient()
  const feedbackLang =
    language === 'pt-BR'
      ? 'Write "turnFeedback" as 1-2 short coaching sentences in Brazilian Portuguese (pt-BR). Keep "userTranscript" and "assistantReply" in natural conversational English.'
      : 'Write all fields in clear English.'

  const historyText = input.history
    .map((msg) => `${msg.role === 'assistant' ? 'Persona' : 'Learner'}: ${msg.content}`)
    .join('\n')

  const prompt = `You are roleplaying in English as: ${input.persona}
Scenario: ${input.scenario}
Verifiable Objectives:
${input.objectives.map((obj, idx) => `${idx + 1}. ${obj}`).join('\n')}

Conversation so far:
${historyText}
${input.userMessage ? `Learner's latest message: "${input.userMessage}"` : "Learner's latest message is in the attached audio recording."}

${feedbackLang}

Instructions:
1. Output what the learner said/wrote in "userTranscript" (faithful transcript if audio was attached, or cleaned userMessage if text).
2. Reply naturally in character as the persona in "assistantReply" (2-3 conversational sentences advancing the scenario or wrapping up cleanly if all objectives are achieved).
3. In "achievedObjectives", list the EXACT strings from the Objectives list above that the learner has satisfied across the conversation so far (including this turn).
4. Give a concise coaching tip on naturalness/pronunciation/grammar in "turnFeedback" and a realistic "suggestedScore" (0-100) reflecting clarity and objective progress.

Return ONLY valid JSON:
{
  "userTranscript": string,
  "assistantReply": string,
  "achievedObjectives": string[],
  "turnFeedback": string,
  "suggestedScore": number
}`

  const parts: Array<
    { text: string } | { inlineData: { data: string; mimeType: string } }
  > = [{ text: prompt }]

  if (input.audio && input.mimeType) {
    parts.push({
      inlineData: {
        data: Buffer.from(input.audio).toString('base64'),
        mimeType: normalizeAudioMimeType(input.mimeType)
      }
    })
  }

  try {
    const response = await withTransientRetry(() =>
      client.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.45
        }
      })
    )

    const parsed = parseJsonResponse(response.text)
    return RoleplayTurnResponseSchema.parse(parsed)
  } catch (error) {
    throw formatGeminiError(error, language)
  }
}

const CustomTrackAiPayloadSchema = z.object({
  titlePt: z.string().trim().min(3).max(180),
  titleEn: z.string().trim().min(3).max(180),
  descriptionPt: z.string().trim().min(5).max(500),
  descriptionEn: z.string().trim().min(5).max(500),
  category: z.string().trim().min(2).max(60),
  lesson: GeneratedLessonSchema.omit({ slug: true })
})

export async function generateCustomTrackFromContent(
  input: GenerateCustomTrackRequest
): Promise<GeneratedTrack> {
  const { client, model, language } = getAiClient()
  const responseSchema = z.toJSONSchema(CustomTrackAiPayloadSchema)
  const slugBase = `custom-${Date.now().toString(36)}`

  const prompt = `You are an expert ESL curriculum designer for Brazilian Portuguese (PT-BR) native speakers.
Transform the user's pasted English article, technical notes, or podcast transcript below into ONE complete, cohesive CEFR ${input.level} learning track with 1 rich 5-step lesson based directly on the vocabulary, ideas, and situations in the source material.
${input.titleHint ? `Optional user title hint: "${input.titleHint}"` : ''}

Source Content:
"""
${input.sourceText}
"""

Requirements:
1. Extract 3 to 5 high-value chunks/phrasal verbs/terms directly from the source content for "lesson.cheatSheet" with accurate US IPA, Portuguese translation ("meaningPt"), and a realistic example.
2. Create EXACTLY 5 activities in "lesson.activities" ordered strictly 1..5:
   - stepOrder 1: payload.type = "shadowing" (key sentence adapted from the material, US IPA, Portuguese translation, and concrete PT-BR phoneticsTip).
   - stepOrder 2: payload.type = "listening_repeat" (spoken phrasing related to the topic + connectedSpeechNote + PT-BR contextHint).
   - stepOrder 3: payload.type = "open_qa" (open discussion question tied to the material, ptContext, suggestedSeconds: 20, 3 expectedTopics, 3 starterChips).
   - stepOrder 4: payload.type = "micro_writing" (realistic Slack/email prompt applying ideas from the source content, 2-4 targetExpressions, 3 starterChips, sampleAnswer).
   - stepOrder 5: payload.type = "roleplay" (realistic persona discussing the content topic with openingLine, 3 verifiable objectives, 3 starterChips, maxTurns: 4).
3. Write Portuguese explanations cleanly in Brazilian Portuguese (pt-BR) and English lines cleanly at CEFR ${input.level}.`

  try {
    const response = await withTransientRetry(() =>
      client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: responseSchema,
          temperature: 0.6
        }
      })
    )

    const parsed = CustomTrackAiPayloadSchema.parse(parseJsonResponse(response.text))
    const expectedOrder = [
      'shadowing',
      'listening_repeat',
      'open_qa',
      'micro_writing',
      'roleplay'
    ] as const
    const sortedActivities = [...parsed.lesson.activities].sort(
      (a, b) => a.stepOrder - b.stepOrder
    )
    for (let idx = 0; idx < expectedOrder.length; idx++) {
      if (
        sortedActivities[idx]?.payload.type !== expectedOrder[idx] ||
        sortedActivities[idx]?.stepOrder !== idx + 1
      ) {
        throw new Error('Generated lesson activities did not match expected 5-step order.')
      }
    }

    return GeneratedTrackSchema.parse({
      slug: slugBase,
      level: input.level,
      category: parsed.category,
      titlePt: parsed.titlePt,
      titleEn: parsed.titleEn,
      descriptionPt: parsed.descriptionPt,
      descriptionEn: parsed.descriptionEn,
      orderIndex: 99,
      lessons: [
        {
          ...parsed.lesson,
          slug: `${slugBase}-lesson-1`,
          activities: sortedActivities
        }
      ]
    })
  } catch (error) {
    throw formatGeminiError(error, language)
  }
}
