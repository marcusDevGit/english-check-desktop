import { getDb } from './index'
import { practiceItems } from './schema'

const SEED_PRACTICE_ITEMS = [
  {
    sentence: 'I thought they worked through the whole problem together.',
    ipa: '/aɪ θɔːt ðeɪ wɜːrkt θruː ðə hoʊl ˈprɑːbləm təˈɡeðər/',
    category: 'TH & Past -ed'
  },
  {
    sentence: 'Although those paths seemed smooth, they gathered there.',
    ipa: '/ɔːlˈðoʊ ðoʊz pæθs siːmd smuːð ðeɪ ˈɡæðərd ðer/',
    category: 'Voiced /ð/ vs /θ/'
  },
  {
    sentence: 'She decided to call after she finished the updated report.',
    ipa: '/ʃi dɪˈsaɪdɪd tuː kɔːl ˈæftər ʃi ˈfɪnɪʃt ði ʌpˈdeɪtɪd rɪˈpɔːrt/',
    category: 'Past -ed Endings'
  },
  {
    sentence: 'Please leave his green keys near the big kitchen sink.',
    ipa: '/pliːz liːv hɪz ɡriːn kiːz nɪr ðə bɪɡ ˈkɪtʃɪn sɪŋk/',
    category: 'Vowel Length /iː/ vs /ɪ/'
  },
  {
    sentence: 'That man had a bad habit of laughing at sad facts.',
    ipa: '/ðæt mæn hæd ə bæd ˈhæbɪt ʌv ˈlæfɪŋ æt sæd fækts/',
    category: 'Vowel /æ/ Clarity'
  },
  {
    sentence: 'I doubt she knew how to fasten the subtle castle latch.',
    ipa: '/aɪ daʊt ʃi nuː haʊ tuː ˈfæsən ðə ˈsʌtəl ˈkæsəl lætʃ/',
    category: 'Silent Letters'
  },
  {
    sentence: 'Harry rarely hears how heavy rain hits the red roof.',
    ipa: '/ˈhæri ˈrerli hɪrz haʊ ˈhevi reɪn hɪts ðə red ruːf/',
    category: 'Initial /h/ vs /r/'
  },
  {
    sentence: 'The cold milk spilled across the old wooden table.',
    ipa: '/ðə koʊld mɪlk spɪld əˈkrɔːs ði oʊld ˈwʊdən ˈteɪbəl/',
    category: 'Dark /l/ & Clusters'
  },
  {
    sentence: 'We need a comfortable room to record the project progress.',
    ipa: '/wiː niːd ə ˈkʌmftərbəl ruːm tuː rɪˈkɔːrd ðə ˈprɑːdʒekt ˈprɑːɡres/',
    category: 'Word Stress & Elision'
  },
  {
    sentence: 'They watched the demo, asked tough questions, and helped us ship.',
    ipa: '/ðeɪ wɑːtʃt ðə ˈdemoʊ æskt tʌf ˈkwestʃənz ænd helpt ʌs ʃɪp/',
    category: 'Voiceless /t/ Clusters'
  }
] as const

/**
 * Inserts default PT-BR focused practice sentences idempotently.
 */
export function seedPracticeItems(): void {
  const db = getDb()
  db.insert(practiceItems).values([...SEED_PRACTICE_ITEMS]).onConflictDoNothing().run()
}
