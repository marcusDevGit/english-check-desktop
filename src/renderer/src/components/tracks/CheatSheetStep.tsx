import { ArrowRight, Volume2 } from 'lucide-react'
import type { AppLanguage, CheatSheetItem } from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

interface CheatSheetStepProps {
  language: AppLanguage
  items: CheatSheetItem[]
  onSpeak: (text: string) => void
  onStartLesson: () => void
}

export function CheatSheetStep({
  language,
  items,
  onSpeak,
  onStartLesson
}: CheatSheetStepProps) {
  const t = getTranslations(language).tracks

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-on-surface">{t.cheatSheetTitle}</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">{t.cheatSheetSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={onStartLesson}
          className="flex items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-on-primary-container transition-all hover:brightness-110"
        >
          <span>{t.startLessonBtn}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((card) => (
          <div
            key={card.term}
            className="flex flex-col justify-between gap-2 rounded-xl border border-surface-container-high bg-surface-container-lowest p-3.5"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-primary">{card.term}</span>
                <button
                  type="button"
                  onClick={() => onSpeak(`${card.term}. ${card.example}`)}
                  className="flex items-center gap-1 rounded-md bg-surface-container px-2 py-1 text-[10px] font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                >
                  <Volume2 className="h-3 w-3" />
                  <span>{t.listenNative}</span>
                </button>
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-outline">{card.ipa}</p>
              <p className="mt-1.5 text-xs font-medium text-on-surface">
                {card.meaningPt}
              </p>
            </div>
            <p className="rounded-lg bg-surface-container/60 px-2.5 py-2 text-[11px] italic text-on-surface-variant">
              “{card.example}”
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
