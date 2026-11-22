import { sql } from 'drizzle-orm'
import {
  CurriculumSeedSchema,
  type ActivityType,
  type TrackLevel
} from '../../shared/ipc-contracts'
import rawCurriculumSeed from './data/curriculum-seed.json'
import { getDb } from './index'
import { upsertGeneratedCurriculumTracks } from './repository'
import { learningTracks, practiceItems } from './schema'

interface SeedTrack {
  slug: string
  titlePt: string
  titleEn: string
  descriptionPt: string
  descriptionEn: string
  level: TrackLevel
  orderIndex: number
}

interface SeedPracticeItem {
  trackSlug: string
  activityType: ActivityType
  sentence: string
  ipa: string
  category: string
  promptPt: string | null
  contrastHint: string | null
  orderIndex: number
}

const SEED_TRACKS: SeedTrack[] = [
  {
    slug: 'critical-phonetics',
    titlePt: 'Fonética Crítica PT-BR',
    titleEn: 'Critical PT-BR Phonetics',
    descriptionPt:
      'Domine os sons que mais causam sotaque e falhas de compreensão para brasileiros: th, finais -ed, /h/ vs /r/ e pares mínimos.',
    descriptionEn:
      'Master the sounds most affected by Portuguese L1 interference: th, -ed endings, /h/ vs /r/, and minimal vowel pairs.',
    level: 'A2',
    orderIndex: 1
  },
  {
    slug: 'tech-workplace',
    titlePt: 'Inglês Técnico & Reuniões de Dev',
    titleEn: 'Tech English & Engineering Meetings',
    descriptionPt:
      'Pratique frases reais de daily standup, code review, arquitetura, prazos e incidentes de produção.',
    descriptionEn:
      'Practice real-world phrases for daily standups, code reviews, architecture discussions, and incident updates.',
    level: 'B1',
    orderIndex: 2
  },
  {
    slug: 'daily-conversation',
    titlePt: 'Conversação & Situações Reais',
    titleEn: 'Everyday Conversation & Listening',
    descriptionPt:
      'Treine ritmo natural, pedidos educados e compreensão auditiva com atividades de shadowing e resposta rápida.',
    descriptionEn:
      'Build natural rhythm, polite requests, and listening fluency with shadowing and quick recall prompts.',
    level: 'A2',
    orderIndex: 3
  }
]

const SEED_PRACTICE_ITEMS: SeedPracticeItem[] = [
  // Track 1: Critical Phonetics (10 activities)
  {
    trackSlug: 'critical-phonetics',
    activityType: 'pronunciation',
    sentence: 'I thought they worked through the whole problem together.',
    ipa: '/aɪ θɔːt ðeɪ wɜːrkt θruː ðə hoʊl ˈprɑːbləm təˈɡeðər/',
    category: 'TH & Past -ed',
    promptPt: 'Eu achei que eles trabalharam juntos no problema inteiro.',
    contrastHint: '/θ/ (thought) sem vibrar vs. -ed surdo /t/ (worked)',
    orderIndex: 1
  },
  {
    trackSlug: 'critical-phonetics',
    activityType: 'pronunciation',
    sentence: 'Although those paths seemed smooth, they gathered there.',
    ipa: '/ɔːlˈðoʊ ðoʊz pæθs siːmd smuːð ðeɪ ˈɡæðərd ðer/',
    category: 'Voiced /ð/ vs /θ/',
    promptPt: 'Embora aqueles caminhos parecessem suaves, eles se reuniram lá.',
    contrastHint: 'Vibração em /ð/ (although, those, they) vs. sopro em /θ/ (paths)',
    orderIndex: 2
  },
  {
    trackSlug: 'critical-phonetics',
    activityType: 'pronunciation',
    sentence: 'She decided to call after she finished the updated report.',
    ipa: '/ʃi dɪˈsaɪdɪd tuː kɔːl ˈæftər ʃi ˈfɪnɪʃt ði ʌpˈdeɪtɪd rɪˈpɔːrt/',
    category: 'Past -ed Endings',
    promptPt: 'Ela decidiu ligar depois que terminou o relatório atualizado.',
    contrastHint: 'decided /ɪd/ vs. finished /t/ (sem vogal extra no final)',
    orderIndex: 3
  },
  {
    trackSlug: 'critical-phonetics',
    activityType: 'minimal_pair',
    sentence: 'Please leave his green keys near the big kitchen sink.',
    ipa: '/pliːz liːv hɪz ɡriːn kiːz nɪr ðə bɪɡ ˈkɪtʃɪn sɪŋk/',
    category: 'Vowel Length /iː/ vs /ɪ/',
    promptPt: 'Por favor, deixe as chaves verdes dele perto da pia grande da cozinha.',
    contrastHint: 'leave /liːv/ (longo) vs. live /lɪv/ (curto) • big /ɪ/ vs. green /iː/',
    orderIndex: 4
  },
  {
    trackSlug: 'critical-phonetics',
    activityType: 'minimal_pair',
    sentence: 'That man had a bad habit of laughing at sad facts.',
    ipa: '/ðæt mæn hæd ə bæd ˈhæbɪt ʌv ˈlæfɪŋ æt sæd fækts/',
    category: 'Vowel /æ/ Clarity',
    promptPt: 'Aquele homem tinha o mau hábito de rir de fatos tristes.',
    contrastHint: 'bad /bæd/ (boca bem aberta) vs. bed /bɛd/',
    orderIndex: 5
  },
  {
    trackSlug: 'critical-phonetics',
    activityType: 'pronunciation',
    sentence: 'I doubt she knew how to fasten the subtle castle latch.',
    ipa: '/aɪ daʊt ʃi nuː haʊ tuː ˈfæsən ðə ˈsʌtəl ˈkæsəl lætʃ/',
    category: 'Silent Letters',
    promptPt: 'Duvido que ela soubesse prender a trava sutil do castelo.',
    contrastHint: 'Letras mudas: b em doubt/subtle, k em knew, t em fasten/castle',
    orderIndex: 6
  },
  {
    trackSlug: 'critical-phonetics',
    activityType: 'minimal_pair',
    sentence: 'Harry rarely hears how heavy rain hits the red roof.',
    ipa: '/ˈhæri ˈrerli hɪrz haʊ ˈhevi reɪn hɪts ðə red ruːf/',
    category: 'Initial /h/ vs /r/',
    promptPt: 'Harry raramente ouve como a chuva forte bate no telhado vermelho.',
    contrastHint: '/h/ soprado na garganta (Harry, heavy) vs. /r/ retroflexo (rarely, red)',
    orderIndex: 7
  },
  {
    trackSlug: 'critical-phonetics',
    activityType: 'pronunciation',
    sentence: 'The cold milk spilled across the old wooden table.',
    ipa: '/ðə koʊld mɪlk spɪld əˈkrɔːs ði oʊld ˈwʊdən ˈteɪbəl/',
    category: 'Dark /l/ & Clusters',
    promptPt: 'O leite frio derramou pela velha mesa de madeira.',
    contrastHint: 'Língua toca o céu da boca no /l/ final (cold, milk, old), não vira "u"',
    orderIndex: 8
  },
  {
    trackSlug: 'critical-phonetics',
    activityType: 'minimal_pair',
    sentence: 'Ship the sheep before the cheap seats fill up.',
    ipa: '/ʃɪp ðə ʃiːp bɪˈfɔːr ðə tʃiːp siːts fɪl ʌp/',
    category: 'Minimal Pairs /ʃ/ & /tʃ/',
    promptPt: 'Envie as ovelhas antes que os assentos baratos lotem.',
    contrastHint: 'ship /ʃɪp/ vs. sheep /ʃiːp/ • cheap /tʃiːp/ vs. sheep /ʃiːp/',
    orderIndex: 9
  },
  {
    trackSlug: 'critical-phonetics',
    activityType: 'pronunciation',
    sentence: 'I taught three students what I thought about the theory.',
    ipa: '/aɪ tɔːt θriː ˈstuːdənts wʌt aɪ θɔːt əˈbaʊt ðə ˈθɪri/',
    category: 'Minimal Pairs /θ/ vs /t/',
    promptPt: 'Ensinei a três alunos o que eu pensava sobre a teoria.',
    contrastHint: 'taught /tɔːt/ (explosão no /t/) vs. thought /θɔːt/ (soprado entre dentes)',
    orderIndex: 10
  },

  // Track 2: Tech English & Engineering Meetings (8 activities)
  {
    trackSlug: 'tech-workplace',
    activityType: 'pronunciation',
    sentence: 'We need a comfortable room to record the project progress.',
    ipa: '/wiː niːd ə ˈkʌmftərbəl ruːm tuː rɪˈkɔːrd ðə ˈprɑːdʒekt ˈprɑːɡres/',
    category: 'Word Stress & Elision',
    promptPt: 'Precisamos de uma sala confortável para registrar o progresso do projeto.',
    contrastHint: 'comfortable tem 3 sílabas (/ˈkʌmf.tər.bəl/); verb re-CORD vs. noun PRO-ject',
    orderIndex: 1
  },
  {
    trackSlug: 'tech-workplace',
    activityType: 'pronunciation',
    sentence: 'They watched the demo, asked tough questions, and helped us ship.',
    ipa: '/ðeɪ wɑːtʃt ðə ˈdemoʊ æskt tʌf ˈkwestʃənz ænd helpt ʌs ʃɪp/',
    category: 'Voiceless /t/ Clusters',
    promptPt: 'Eles assistiram à demo, fizeram perguntas difíceis e nos ajudaram a publicar.',
    contrastHint: 'watched /tʃt/, asked /skt/, helped /lpt/ — finais sem vogal extra',
    orderIndex: 2
  },
  {
    trackSlug: 'tech-workplace',
    activityType: 'active_recall',
    sentence: 'I have been working on the authentication bug for two days.',
    ipa: '/aɪ hæv bɪn ˈwɜːrkɪŋ ɑːn ði ɔːˌθentɪˈkeɪʃən bʌɡ fɔːr tuː deɪz/',
    category: 'Daily Standup',
    promptPt: 'Estou trabalhando no bug de autenticação há dois dias (use "for", não "since").',
    contrastHint: 'Duração usa "for two days", não "since two days ago"',
    orderIndex: 3
  },
  {
    trackSlug: 'tech-workplace',
    activityType: 'active_recall',
    sentence: 'I am thinking of refactoring this service before we deploy.',
    ipa: '/aɪ æm ˈθɪŋkɪŋ ʌv riːˈfæktərɪŋ ðɪs ˈsɜːrvɪs bɪˈfɔːr wiː dɪˈplɔɪ/',
    category: 'Architecture & PRs',
    promptPt: 'Estou pensando em refatorar este serviço antes de fazermos deploy.',
    contrastHint: 'thinking OF + -ing (evite "thinking to refactor")',
    orderIndex: 4
  },
  {
    trackSlug: 'tech-workplace',
    activityType: 'pronunciation',
    sentence: 'Could you walk me through how the database migration runs at startup?',
    ipa: '/kʊd juː wɔːk miː θruː haʊ ðə ˈdeɪtəbeɪs maɪˈɡreɪʃən rʌnz æt ˈstɑːrtʌp/',
    category: 'Code Review',
    promptPt: 'Você poderia me explicar passo a passo como a migration do banco roda na inicialização?',
    contrastHint: 'L mudo em walk /wɔːk/ e would/could; /θ/ em through',
    orderIndex: 5
  },
  {
    trackSlug: 'tech-workplace',
    activityType: 'shadowing',
    sentence: 'We caught a regression in staging, so we rolled back the release.',
    ipa: '/wiː kɔːt ə rɪˈɡreʃən ɪn ˈsteɪdʒɪŋ soʊ wiː roʊld bæk ðə rɪˈliːs/',
    category: 'Incident Response',
    promptPt: 'Pegamos uma regressão em staging, então fizemos rollback da release.',
    contrastHint: 'caught /kɔːt/ e rolled /roʊld/ com /d/ final suave',
    orderIndex: 6
  },
  {
    trackSlug: 'tech-workplace',
    activityType: 'active_recall',
    sentence: 'I am blocked waiting for credentials from the infrastructure team.',
    ipa: '/aɪ æm blɑːkt ˈweɪtɪŋ fɔːr krɪˈdenʃəlz frʌm ði ˈɪnfrəstrʌktʃər tiːm/',
    category: 'Daily Standup',
    promptPt: 'Estou travado aguardando as credenciais do time de infraestrutura.',
    contrastHint: 'blocked /blɑːkt/ (-ed = /t/) + waiting FOR',
    orderIndex: 7
  },
  {
    trackSlug: 'tech-workplace',
    activityType: 'pronunciation',
    sentence: 'Let us schedule an architecture review once the pull request passes.',
    ipa: '/let ʌs ˈskedʒuːl æn ˈɑːrkɪtektʃər rɪˈvjuː wʌns ðə pʊl rɪˈkwest ˈpæsɪz/',
    category: 'Tech Planning',
    promptPt: 'Vamos agendar uma revisão de arquitetura assim que o pull request passar.',
    contrastHint: 'Acento tônico na 1ª sílaba: AR-chi-tec-ture; passes termina em /ɪz/',
    orderIndex: 8
  },

  // Track 3: Everyday Conversation & Listening (6 activities)
  {
    trackSlug: 'daily-conversation',
    activityType: 'shadowing',
    sentence: 'Would you mind repeating that a bit more slowly, please?',
    ipa: '/wʊd juː maɪnd rɪˈpiːtɪŋ ðæt ə bɪt mɔːr ˈsloʊli pliːz/',
    category: 'Polite Requests',
    promptPt: 'Você se importaria de repetir isso um pouco mais devagar, por favor?',
    contrastHint: 'Ligação natural entre "would you" (/wʊdʒuː/)',
    orderIndex: 1
  },
  {
    trackSlug: 'daily-conversation',
    activityType: 'pronunciation',
    sentence: 'I usually grab a quick coffee before heading to the office.',
    ipa: '/aɪ ˈjuːʒuəli ɡræb ə kwɪk ˈkɔːfi bɪˈfɔːr ˈhedɪŋ tuː ði ˈɔːfɪs/',
    category: 'Daily Routine',
    promptPt: 'Eu geralmente pego um café rápido antes de ir para o escritório.',
    contrastHint: 'usually /ˈjuːʒuəli/ e /h/ soprado em heading',
    orderIndex: 2
  },
  {
    trackSlug: 'daily-conversation',
    activityType: 'active_recall',
    sentence: 'How long have you been living in this neighborhood?',
    ipa: '/haʊ lɔːŋ hæv juː bɪn ˈlɪvɪŋ ɪn ðɪs ˈneɪbərhʊd/',
    category: 'Small Talk',
    promptPt: 'Há quanto tempo você mora neste bairro?',
    contrastHint: 'Use "How long have you been..." (não "How much time do you live")',
    orderIndex: 3
  },
  {
    trackSlug: 'daily-conversation',
    activityType: 'shadowing',
    sentence: 'It depends on the weather, though I would rather stay indoors.',
    ipa: '/ɪt dɪˈpendz ɑːn ðə ˈweðər ðoʊ aɪ wʊd ˈræðər steɪ ɪnˈdɔːrz/',
    category: 'Preferences',
    promptPt: 'Depende do clima, embora eu prefira ficar em casa.',
    contrastHint: 'depends ON (não "of") • /ð/ em weather, though, rather',
    orderIndex: 4
  },
  {
    trackSlug: 'daily-conversation',
    activityType: 'active_recall',
    sentence: 'I am looking forward to catching up with you this weekend.',
    ipa: '/aɪ æm ˈlʊkɪŋ ˈfɔːrwərd tuː ˈkætʃɪŋ ʌp wɪð juː ðɪs ˈwiːkend/',
    category: 'Social Plans',
    promptPt: 'Estou animado para colocar o papo em dia com você neste fim de semana.',
    contrastHint: 'look forward TO + -ing (catching up)',
    orderIndex: 5
  },
  {
    trackSlug: 'daily-conversation',
    activityType: 'pronunciation',
    sentence: 'Could I have the check whenever you get a chance, thanks.',
    ipa: '/kʊd aɪ hæv ðə tʃek wenˈevər juː ɡet ə tʃæns θæŋks/',
    category: 'Restaurants',
    promptPt: 'Poderia me trazer a conta quando tiver um tempinho, obrigado.',
    contrastHint: '/tʃ/ em check/chance vs. /θ/ em thanks',
    orderIndex: 6
  }
]

/**
 * Seeds learning tracks and 24 practice items while preserving existing user progress.
 */
export function seedPracticeItems(): void {
  const db = getDb()

  db.transaction((tx) => {
    for (const track of SEED_TRACKS) {
      tx.insert(learningTracks)
        .values(track)
        .onConflictDoUpdate({
          target: learningTracks.slug,
          set: {
            titlePt: track.titlePt,
            titleEn: track.titleEn,
            descriptionPt: track.descriptionPt,
            descriptionEn: track.descriptionEn,
            level: track.level,
            orderIndex: track.orderIndex
          }
        })
        .run()
    }

    const trackRows = tx.select().from(learningTracks).all()
    const trackIdBySlug = new Map(trackRows.map((row) => [row.slug, row.id]))

    for (const item of SEED_PRACTICE_ITEMS) {
      const trackId = trackIdBySlug.get(item.trackSlug) ?? null
      tx.insert(practiceItems)
        .values({
          trackId,
          activityType: item.activityType,
          sentence: item.sentence,
          ipa: item.ipa,
          category: item.category,
          promptPt: item.promptPt,
          contrastHint: item.contrastHint,
          orderIndex: item.orderIndex
        })
        .onConflictDoUpdate({
          target: practiceItems.sentence,
          set: {
            trackId: sql`excluded.track_id`,
            activityType: sql`excluded.activity_type`,
            ipa: sql`excluded.ipa`,
            category: sql`excluded.category`,
            promptPt: sql`excluded.prompt_pt`,
            contrastHint: sql`excluded.contrast_hint`,
            orderIndex: sql`excluded.order_index`
          }
        })
        .run()
    }
  })

  const parsedCurriculum = CurriculumSeedSchema.parse(rawCurriculumSeed)
  upsertGeneratedCurriculumTracks(parsedCurriculum, 'seed')
}
