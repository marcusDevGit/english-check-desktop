import { Loader2, PlusCircle, X } from 'lucide-react'
import { useState } from 'react'
import type {
  AppLanguage,
  CefrLevel,
  LearningTrackProgress
} from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

interface CustomTrackModalProps {
  isOpen: boolean
  language: AppLanguage
  onClose: () => void
  onCreated: (track: LearningTrackProgress) => void
}

const LEVELS: CefrLevel[] = ['A2', 'B1', 'B2', 'C1']

export function CustomTrackModal({
  isOpen,
  language,
  onClose,
  onCreated
}: CustomTrackModalProps) {
  const t = getTranslations(language).tracks
  const [titleHint, setTitleHint] = useState('')
  const [level, setLevel] = useState<CefrLevel>('B2')
  const [sourceText, setSourceText] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmed = sourceText.trim()
    if (trimmed.length < 80) {
      setErrorMsg(t.customSourceMinError)
      return
    }

    setIsGenerating(true)
    setErrorMsg(null)
    try {
      const res = await window.englishChecks.generateCustomTrack({
        titleHint: titleHint.trim() || undefined,
        level,
        sourceText: trimmed
      })

      if (!res.ok) {
        setErrorMsg(res.error)
        return
      }

      setTitleHint('')
      setSourceText('')
      onCreated(res.data)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-surface-container-high bg-surface-container-low p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-on-surface">
                {t.customModalTitle}
              </h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {t.customModalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="rounded-lg p-1 text-outline transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-on-surface-variant">
                {t.customTitleLabel}
              </label>
              <input
                type="text"
                value={titleHint}
                onChange={(e) => setTitleHint(e.target.value)}
                placeholder={t.customTitlePlaceholder}
                disabled={isGenerating}
                className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-on-surface-variant">
                {t.customLevelLabel}
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CefrLevel)}
                disabled={isGenerating}
                className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest px-3 py-2 font-mono text-xs text-on-surface outline-none focus:border-primary"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    CEFR {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[11px] font-medium text-on-surface-variant">
                {t.customSourceLabel}
              </label>
              <span className="font-mono text-[10px] text-outline">
                {sourceText.trim().length} / 12000
              </span>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={8}
              placeholder={t.customSourcePlaceholder}
              disabled={isGenerating}
              className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest p-3 text-xs leading-relaxed text-on-surface outline-none focus:border-primary"
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-error/40 bg-error-container/20 px-3 py-2 text-xs text-error">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="rounded-xl bg-surface-container px-4 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
            >
              {t.customCancel}
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-on-primary-container transition-all hover:brightness-110 disabled:opacity-60"
            >
              {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isGenerating ? t.customGeneratingBtn : t.customGenerateBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
