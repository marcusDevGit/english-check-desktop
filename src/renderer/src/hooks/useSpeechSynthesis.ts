import { useCallback, useEffect, useState } from 'react'
import type { Accent, AppLanguage } from '../../../shared/ipc-contracts'
import { getTranslations } from '../i18n/translations'

interface UseSpeechSynthesisResult {
  isSpeaking: boolean
  voiceWarning: string | null
  activeVoiceLabel: string | null
  speak: (text: string, accent: Accent, rate: number) => void
  stopSpeaking: () => void
}

function findBestVoice(
  voices: SpeechSynthesisVoice[],
  accent: Accent
): SpeechSynthesisVoice | null {
  const targetLang = accent === 'UK' ? 'en-gb' : 'en-us'
  const exact = voices.find((v) => v.lang.toLowerCase() === targetLang)
  if (exact) return exact

  const englishFallback = voices.find((v) => v.lang.toLowerCase().startsWith('en'))
  return englishFallback ?? null
}

export function useSpeechSynthesis(
  accent: Accent,
  language: AppLanguage = 'pt-BR'
): UseSpeechSynthesisResult {
  const t = getTranslations(language).hooks
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const loadVoices = (): void => {
      setVoices(window.speechSynthesis.getVoices())
    }

    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      window.speechSynthesis.cancel()
    }
  }, [])

  const matchedVoice = findBestVoice(voices, accent)

  let voiceWarning: string | null = null
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    voiceWarning = t.voiceUnavailable
  } else if (voices.length > 0 && !matchedVoice) {
    voiceWarning = t.noEnglishVoice
  }

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [])

  const speak = useCallback(
    (text: string, targetAccent: Accent, rate: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = targetAccent === 'UK' ? 'en-GB' : 'en-US'
      utterance.rate = rate

      const voice = findBestVoice(voices, targetAccent)
      if (voice) {
        utterance.voice = voice
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [voices]
  )

  return {
    isSpeaking,
    voiceWarning,
    activeVoiceLabel: matchedVoice ? `${matchedVoice.name} (${matchedVoice.lang})` : null,
    speak,
    stopSpeaking
  }
}
