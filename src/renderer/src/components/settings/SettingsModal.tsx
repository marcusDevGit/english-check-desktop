import { CheckCircle2, Eye, EyeOff, Globe, KeyRound, ShieldCheck, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppLanguage, SettingsStatus } from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

interface SettingsModalProps {
  isOpen: boolean
  language: AppLanguage
  onLanguageChanged: (language: AppLanguage) => void
  onClose: () => void
}

export function SettingsModal({
  isOpen,
  language,
  onLanguageChanged,
  onClose
}: SettingsModalProps) {
  const t = getTranslations(language).settings

  const [status, setStatus] = useState<SettingsStatus | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setFeedback(null)
    setApiKeyInput('')
    void window.englishChecks.getSettingsStatus().then((res) => {
      if (res.ok) {
        setStatus(res.data)
      }
    })
  }, [isOpen])

  if (!isOpen) return null

  const handleLanguageChange = async (nextLang: AppLanguage): Promise<void> => {
    if (nextLang === language || isSaving) return
    setIsSaving(true)
    setFeedback(null)
    const res = await window.englishChecks.saveLanguage({ language: nextLang })
    setIsSaving(false)

    if (res.ok) {
      setStatus(res.data)
      onLanguageChanged(res.data.language)
      setFeedback({
        type: 'success',
        text: getTranslations(res.data.language).settings.languageSavedSuccess
      })
    } else {
      setFeedback({ type: 'error', text: res.error })
    }
  }

  const handleSave = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (!apiKeyInput.trim()) return

    setIsSaving(true)
    setFeedback(null)
    const res = await window.englishChecks.saveApiKey({ apiKey: apiKeyInput.trim() })
    setIsSaving(false)

    if (res.ok) {
      setStatus(res.data)
      setApiKeyInput('')
      setFeedback({ type: 'success', text: t.keySavedSuccess })
    } else {
      setFeedback({ type: 'error', text: res.error })
    }
  }

  const handleClear = async (): Promise<void> => {
    setIsSaving(true)
    setFeedback(null)
    const res = await window.englishChecks.clearApiKey()
    setIsSaving(false)

    if (res.ok) {
      setStatus(res.data)
      setFeedback({ type: 'success', text: t.keyClearedSuccess })
    } else {
      setFeedback({ type: 'error', text: res.error })
    }
  }

  const sourceLabel =
    status?.source === 'safeStorage'
      ? t.statusSafeStorage
      : status?.source === 'env'
        ? t.statusEnv
        : t.statusNone

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-surface-container-high bg-surface-container-low p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-surface-container-high pb-3">
          <div>
            <h2 id="settings-modal-title" className="text-sm font-semibold text-on-surface">
              {t.title}
            </h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="rounded-lg p-1 text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSave(e)} className="mt-4 flex flex-col gap-3.5">
          {/* Language Switcher */}
          <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                <Globe className="h-3.5 w-3.5 text-primary" />
                {t.languageTitle}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-outline">{t.languageHelp}</p>

            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'pt-BR', label: t.ptBrLabel },
                  { id: 'en', label: t.enLabel }
                ] as const
              ).map((option) => {
                const active = language === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleLanguageChange(option.id)}
                    className={
                      active
                        ? 'rounded-lg border border-primary/50 bg-primary-container px-3 py-1.5 text-xs font-semibold text-on-primary-container shadow-sm'
                        : 'rounded-lg border border-surface-container-high bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:text-on-surface'
                    }
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Gemini Key */}
          <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                {t.geminiEngine}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                  status?.hasApiKey
                    ? 'bg-secondary-container/25 text-secondary'
                    : 'bg-tertiary-container/25 text-tertiary'
                }`}
              >
                <ShieldCheck className="h-3 w-3" />
                {sourceLabel}
              </span>
            </div>

            <div className="mt-3">
              <label
                htmlFor="gemini-api-key"
                className="block text-[11px] font-medium text-on-surface-variant"
              >
                {status?.hasApiKey ? t.replaceKey : t.enterKey}
              </label>
              <div className="relative mt-1.5">
                <input
                  id="gemini-api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIza..."
                  autoComplete="off"
                  className="w-full rounded-lg border border-surface-container-high bg-surface-container px-3 py-2 pr-9 font-mono text-xs text-on-surface placeholder:text-outline/60 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-outline">
                {t.activeModel}:{' '}
                <span className="text-on-surface">{status?.model ?? 'gemini-3.8-flash'}</span>
              </p>
            </div>
          </div>

          {feedback && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                feedback.type === 'success'
                  ? 'bg-secondary-container/20 text-secondary'
                  : 'bg-error-container/25 text-error'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {status?.source === 'safeStorage' ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleClear()}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-error transition-colors hover:bg-error-container/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t.removeStoredKey}</span>
              </button>
            ) : (
              <span className="font-mono text-[10px] text-outline">
                {t.neverLeavesMain}
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                {t.close}
              </button>
              <button
                type="submit"
                disabled={isSaving || apiKeyInput.trim().length < 10}
                className="rounded-lg bg-primary-container px-3.5 py-1.5 text-xs font-semibold text-on-primary-container transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? t.saving : t.saveKey}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
