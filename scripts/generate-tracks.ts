import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import {
  CurriculumSeedSchema,
  GeneratedLessonSchema,
  GeneratedTrackSchema,
  type CefrLevel,
  type GeneratedLesson,
  type GeneratedTrack
} from '../src/shared/tracks-contracts.ts'

interface RawSources {
  cmudictPhoneticTraps: Array<{
    id: string
    phonemes: string
    ptBrTrap: string
    minimalPairs: Array<{ wordA: string; ipaA: string; wordB: string; ipaB: string }>
  }>
  oxfordCefrVocabulary: Record<
    CefrLevel,
    Array<{ term: string; ipa: string; meaningPt: string; pos: string }>
  >
  tatoebaAndDailyDialogSeeds: Array<{
    level: CefrLevel
    category: string
    context: string
    sampleSentences: string[]
  }>
}

interface TrackBlueprint {
  slug: string
  level: CefrLevel
  category: string
  orderIndex: number
  titlePt: string
  titleEn: string
  descriptionPt: string
  descriptionEn: string
  lessonTopics: Array<{
    slugSuffix: string
    focusTitlePt: string
    focusTitleEn: string
    scenarioFocus: string
  }>
}

const TRACK_BLUEPRINTS: TrackBlueprint[] = [
  {
    slug: 'critical-phonetics',
    level: 'A2',
    category: 'phonetics',
    orderIndex: 1,
    titlePt: 'Fonética Crítica PT-BR',
    titleEn: 'Critical PT-BR Phonetics',
    descriptionPt:
      'Domine os sons que mais causam sotaque e falhas de compreensão para brasileiros: th, finais -ed, /h/ vs /r/ e pares mínimos.',
    descriptionEn:
      'Master the sounds most affected by Portuguese L1 interference: th, -ed endings, /h/ vs /r/, and minimal vowel pairs.',
    lessonTopics: [
      {
        slugSuffix: 'th-and-ed',
        focusTitlePt: 'Sons do TH e Finais -ed Sem Vogal Extra',
        focusTitleEn: 'TH Consonants & Crisp -ed Endings',
        scenarioFocus: 'Everyday plans and describing finished tasks clearly without epenthetic vowels'
      },
      {
        slugSuffix: 'vowel-pairs',
        focusTitlePt: 'Pares Mínimos (/iː/ vs /ɪ/ e /æ/ vs /ɛ/)',
        focusTitleEn: 'Minimal Vowel Contrasts (/iː/ vs /ɪ/ & /æ/ vs /ɛ/)',
        scenarioFocus: 'High-stakes word contrasts at work and in casual conversation'
      },
      {
        slugSuffix: 'connected-speech',
        focusTitlePt: 'Dark L, Finais Consonantes e Ritmo',
        focusTitleEn: 'Dark L, Final Stops & Connected Rhythm',
        scenarioFocus: 'Linking words naturally while keeping final /p, t, k, l/ audible'
      }
    ]
  },
  {
    slug: 'tech-workplace',
    level: 'B1',
    category: 'tech',
    orderIndex: 2,
    titlePt: 'Inglês Técnico & Reuniões de Dev',
    titleEn: 'Tech English & Engineering Meetings',
    descriptionPt:
      'Pratique frases reais de daily standup, code review, arquitetura, prazos e incidentes de produção.',
    descriptionEn:
      'Practice real-world phrases for daily standups, code reviews, architecture discussions, and incident updates.',
    lessonTopics: [
      {
        slugSuffix: 'daily-standup',
        focusTitlePt: 'Daily Standup & Bloqueios Técnicos',
        focusTitleEn: 'Daily Standups & Unblocking Tasks',
        scenarioFocus: 'Giving a concise progress update and asking teammates for a quick sync'
      },
      {
        slugSuffix: 'pr-reviews',
        focusTitlePt: 'Code Review & Feedback Construtivo',
        focusTitleEn: 'Pull Request Reviews & Constructive Feedback',
        scenarioFocus: 'Discussing edge cases, naming, and test coverage politely on GitHub/Slack'
      },
      {
        slugSuffix: 'incident-triage',
        focusTitlePt: 'Triagem de Incidentes & Rollbacks',
        focusTitleEn: 'Production Triage & Safe Rollbacks',
        scenarioFocus: 'Communicating root cause hypotheses calmly under time pressure'
      }
    ]
  },
  {
    slug: 'daily-conversation',
    level: 'A2',
    category: 'daily',
    orderIndex: 3,
    titlePt: 'Conversação & Situações Reais',
    titleEn: 'Everyday Conversation & Listening',
    descriptionPt:
      'Treine ritmo natural, pedidos educados e compreensão auditiva com cenários práticos do dia a dia.',
    descriptionEn:
      'Build natural rhythm, polite requests, and listening fluency across everyday scenarios.',
    lessonTopics: [
      {
        slugSuffix: 'coffee-orders',
        focusTitlePt: 'Cafeterias, Pedidos e Preferências',
        focusTitleEn: 'Coffee Shops, Orders & Preferences',
        scenarioFocus: 'Ordering customized drinks and confirming prices/pickup smoothly'
      },
      {
        slugSuffix: 'plans-rescheduling',
        focusTitlePt: 'Planos, Atrasos e Reagendamentos',
        focusTitleEn: 'Weekend Plans & Polite Rescheduling',
        scenarioFocus: 'Letting someone know you are running late and proposing an alternative time'
      },
      {
        slugSuffix: 'small-talk',
        focusTitlePt: 'Small Talk Natural & Hobbies',
        focusTitleEn: 'Natural Small Talk & Hobbies',
        scenarioFocus: 'Keeping a friendly conversation going with follow-up questions'
      }
    ]
  },
  {
    slug: 'international-travel',
    level: 'B1',
    category: 'travel',
    orderIndex: 4,
    titlePt: 'Viagens Internacionais, Aeroportos & Hotel',
    titleEn: 'International Travel, Airports & Hotels',
    descriptionPt:
      'Resolva check-in, imigração, conexões atrasadas e solicitações de hospedagem com naturalidade.',
    descriptionEn:
      'Handle check-in, customs, missed connections, and hotel requests with confidence.',
    lessonTopics: [
      {
        slugSuffix: 'airport-checkin',
        focusTitlePt: 'Check-in, Bagagem e Embarque',
        focusTitleEn: 'Airport Check-in & Boarding Gate',
        scenarioFocus: 'Checking luggage, confirming seat preferences, and handling gate changes'
      },
      {
        slugSuffix: 'missed-connections',
        focusTitlePt: 'Voos Atrasados & Remarcação',
        focusTitleEn: 'Flight Delays & Rebooking Options',
        scenarioFocus: 'Negotiating a rebooked itinerary politely with an airline agent'
      },
      {
        slugSuffix: 'hotel-issues',
        focusTitlePt: 'Check-in de Hotel & Solicitações',
        focusTitleEn: 'Hotel Check-in & Room Requests',
        scenarioFocus: 'Requesting a quieter room, late checkout, or Wi-Fi troubleshooting'
      }
    ]
  },
  {
    slug: 'career-interviews',
    level: 'B2',
    category: 'career',
    orderIndex: 5,
    titlePt: 'Entrevistas Técnicas & Projetos Passados',
    titleEn: 'Tech Interviews & Past Project Storytelling',
    descriptionPt:
      'Estruture respostas com método STAR, explique decisões técnicas e demonstre ownership em inglês.',
    descriptionEn:
      'Structure STAR interview answers, explain technical decisions, and show ownership in English.',
    lessonTopics: [
      {
        slugSuffix: 'star-storytelling',
        focusTitlePt: 'Explicando Projetos com Método STAR',
        focusTitleEn: 'Explaining Impact with the STAR Method',
        scenarioFocus: 'Summarizing a challenging project and its measurable outcome in 60 seconds'
      },
      {
        slugSuffix: 'handling-disagreement',
        focusTitlePt: 'Discordância Saudável & Alinhamento',
        focusTitleEn: 'Handling Technical Disagreements',
        scenarioFocus: 'Describing a time you pushed back respectfully with data'
      },
      {
        slugSuffix: 'salary-and-questions',
        focusTitlePt: 'Perguntas ao Time & Próximos Passos',
        focusTitleEn: 'Asking Sharp Questions to the Panel',
        scenarioFocus: 'Evaluating engineering culture, expectations, and onboarding in live Q&A'
      }
    ]
  },
  {
    slug: 'system-design-c1',
    level: 'C1',
    category: 'tech',
    orderIndex: 6,
    titlePt: 'System Design, Trade-offs & Arquitetura',
    titleEn: 'System Design Trade-offs & Architecture',
    descriptionPt:
      'Debata escalabilidade, latência vs consistência e pontos únicos de falha com vocabulário executivo C1.',
    descriptionEn:
      'Debate scalability, latency vs consistency, and failure resilience with C1 engineering nuance.',
    lessonTopics: [
      {
        slugSuffix: 'caching-consistency',
        focusTitlePt: 'Caching, Latência & Consistência Eventual',
        focusTitleEn: 'Caching vs Eventual Consistency',
        scenarioFocus: 'Defending cache invalidation trade-offs during an architecture review'
      },
      {
        slugSuffix: 'resilience-spof',
        focusTitlePt: 'Resiliência, Circuit Breakers & SPOF',
        focusTitleEn: 'Graceful Degradation & Failure Isolation',
        scenarioFocus: 'Designing fallback behavior when an upstream dependency degrades'
      },
      {
        slugSuffix: 'cost-vs-complexity',
        focusTitlePt: 'Retornos Decrescentes & Complexidade Operacional',
        focusTitleEn: 'Diminishing Returns & Operational Cost',
        scenarioFocus: 'Challenging premature microservices with pragmatic monolithic modularity'
      }
    ]
  }
]

const SingleLessonBodySchema = GeneratedLessonSchema.omit({ slug: true })

function loadEnvSafely(): void {
  const envPath = path.join(process.cwd(), '.env')
  if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath)
  }
}

function parseJsonResponse(rawText: string | undefined): unknown {
  if (!rawText || !rawText.trim()) {
    throw new Error('Gemini returned empty text.')
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

async function generateLessonWithRetry(
  ai: GoogleGenAI,
  model: string,
  blueprint: TrackBlueprint,
  topic: TrackBlueprint['lessonTopics'][number],
  lessonNumber: number,
  sources: RawSources
): Promise<GeneratedLesson> {
  const vocab = sources.oxfordCefrVocabulary[blueprint.level] ?? []
  const traps = sources.cmudictPhoneticTraps
  const seeds = sources.tatoebaAndDailyDialogSeeds.filter(
    (s) => s.level === blueprint.level || s.category === blueprint.category
  )

  const responseSchema = z.toJSONSchema(SingleLessonBodySchema)

  const prompt = `
You are an expert ESL curriculum designer for Brazilian Portuguese (PT-BR) native speakers.
Generate ONE rich, cohesive English lesson as valid JSON matching the exact schema.

Track Context:
- CEFR Level: ${blueprint.level}
- Category: ${blueprint.category}
- Track Title (EN): ${blueprint.titleEn}
- Lesson #${lessonNumber}: ${topic.focusTitleEn} (PT-BR: ${topic.focusTitlePt})
- Scenario Focus: ${topic.scenarioFocus}

Open Linguistic Reference Material (use and adapt naturally):
- Target CEFR Vocabulary/Chunks: ${JSON.stringify(vocab)}
- PT-BR L1 Pronunciation Traps & IPA contrasts: ${JSON.stringify(traps.slice(0, 3))}
- Natural Dialogue/Sentence Seeds: ${JSON.stringify(seeds)}

Strict Pedagogical Requirements:
1. "titlePt" and "titleEn": clear lesson titles matching the focus above.
2. "xpReward": integer between 80 and 150 scaled to level (${blueprint.level}).
3. "cheatSheet": 3 to 5 essential chunks/phrasal verbs/expressions for this lesson with accurate US IPA, Portuguese meaning ("meaningPt"), and a realistic example sentence ("example").
4. "activities": EXACTLY 5 items with "stepOrder" 1..5 in this strict order:
   - stepOrder 1 -> payload.type = "shadowing": natural sentence with US IPA and a specific PT-BR phonetic tip ("phoneticsTip", e.g., -ed ending, /θ/, dark L, no epenthetic vowel).
   - stepOrder 2 -> payload.type = "listening_repeat": spoken idiomatic sentence with connected speech note ("connectedSpeechNote") and PT-BR context hint ("contextHint").
   - stepOrder 3 -> payload.type = "open_qa": thought-provoking question ("question"), PT-BR guidance ("ptContext"), "suggestedSeconds": 20, 3 "expectedTopics", and 3 "starterChips" (e.g., "In my experience...", "The main challenge was...").
   - stepOrder 4 -> payload.type = "micro_writing": concise realistic prompt ("scenario" + "taskPrompt", e.g., Slack update or short email), 2-4 "targetExpressions", 3 "starterChips", and a natural "sampleAnswer".
   - stepOrder 5 -> payload.type = "roleplay": realistic "persona", "scenario", strong "openingLine", 3 verifiable "objectives", 3 conversational "starterChips", and "maxTurns": 4.
5. Keep all Portuguese explanations ("ptTranslation", "meaningPt", "phoneticsTip", "contextHint", "ptContext") in clear Brazilian Portuguese, and English practice lines strictly CEFR ${blueprint.level} authentic.
`

  let lastError: unknown = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.65,
          responseMimeType: 'application/json',
          responseJsonSchema: responseSchema
        }
      })

      const parsed = parseJsonResponse(response.text)
      const validated = GeneratedLessonSchema.parse({
        ...(parsed as Record<string, unknown>),
        slug: `${blueprint.slug}-${topic.slugSuffix}`
      })

      // Verify stepOrder 1..5 match strict sequence
      const expectedOrder = ['shadowing', 'listening_repeat', 'open_qa', 'micro_writing', 'roleplay'] as const
      const sorted = [...validated.activities].sort((a, b) => a.stepOrder - b.stepOrder)
      for (let idx = 0; idx < expectedOrder.length; idx++) {
        if (sorted[idx]?.payload.type !== expectedOrder[idx] || sorted[idx]?.stepOrder !== idx + 1) {
          throw new Error(
            `Activity order mismatch at step ${idx + 1}: expected ${expectedOrder[idx]}, got ${sorted[idx]?.payload.type}`
          )
        }
      }

      return { ...validated, activities: sorted }
    } catch (error) {
      lastError = error
      console.warn(
        `  Attempt ${attempt}/3 failed for ${blueprint.slug}/${topic.slugSuffix}:`,
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function main(): Promise<void> {
  loadEnvSafely()

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    console.error(
      'Missing GEMINI_API_KEY in environment or .env. Set GEMINI_API_KEY before running npm run generate:tracks.'
    )
    process.exitCode = 1
    return
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
  const sourcesPath = path.join(process.cwd(), 'scripts', 'sources', 'open-curriculum-raw.json')
  const sources = JSON.parse(await fs.readFile(sourcesPath, 'utf-8')) as RawSources

  const ai = new GoogleGenAI({ apiKey })
  const outPath = path.join(
    process.cwd(),
    'src',
    'main',
    'database',
    'data',
    'curriculum-seed.json'
  )

  console.log(`Generating rich CEFR curriculum (${TRACK_BLUEPRINTS.length} tracks) using ${model}...`)
  const generatedTracks: GeneratedTrack[] = []

  for (let i = 0; i < TRACK_BLUEPRINTS.length; i++) {
    const bp = TRACK_BLUEPRINTS[i]!
    console.log(`\n[${i + 1}/${TRACK_BLUEPRINTS.length}] Track ${bp.level} (${bp.slug}): ${bp.titleEn}`)
    const lessons: GeneratedLesson[] = []

    for (let j = 0; j < bp.lessonTopics.length; j++) {
      const topic = bp.lessonTopics[j]!
      console.log(`  - Lesson ${j + 1}/${bp.lessonTopics.length}: ${topic.focusTitleEn}...`)
      const lesson = await generateLessonWithRetry(ai, model, bp, topic, j + 1, sources)
      lessons.push(lesson)
    }

    const track = GeneratedTrackSchema.parse({
      slug: bp.slug,
      level: bp.level,
      category: bp.category,
      titlePt: bp.titlePt,
      titleEn: bp.titleEn,
      descriptionPt: bp.descriptionPt,
      descriptionEn: bp.descriptionEn,
      orderIndex: bp.orderIndex,
      lessons
    })
    generatedTracks.push(track)
  }

  const verifiedCurriculum = CurriculumSeedSchema.parse(generatedTracks)
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, `${JSON.stringify(verifiedCurriculum, null, 2)}\n`, 'utf-8')
  console.log(`\nDone! Saved ${verifiedCurriculum.length} validated tracks to ${outPath}`)
}

main().catch((error) => {
  console.error('Curriculum generation failed:', error)
  process.exitCode = 1
})
