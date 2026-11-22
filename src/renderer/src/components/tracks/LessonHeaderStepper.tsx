import { ArrowLeft, Award, BookOpen, CheckCircle2 } from 'lucide-react'
import type {
  AppLanguage,
  CefrLevel,
  LessonActivityRecord
} from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

interface LessonHeaderStepperProps {
  language: AppLanguage
  level: CefrLevel
  lessonTitle: string
  xpReward: number
  activities: LessonActivityRecord[]
  viewPhase: 'cheat_sheet' | 'activity'
  stepIndex: number
  earnedXpNotice: number | null
  onBack: () => void
  onSelectCheatSheet: () => void
  onSelectStep: (index: number) => void
}

export function LessonHeaderStepper({
  language,
  level,
  lessonTitle,
  xpReward,
  activities,
  viewPhase,
  stepIndex,
  earnedXpNotice,
  onBack,
  onSelectCheatSheet,
  onSelectStep
}: LessonHeaderStepperProps) {
  const t = getTranslations(language).tracks
  const completedCount = activities.filter((a) => a.completed).length

  return (
    <section className="flex flex-col gap-2.5 rounded-2xl border border-surface-container-high bg-surface-container-low p-3.5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1 text-[11px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t.backToTracks}</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                CEFR {level}
              </span>
              <span className="font-mono text-[10px] text-tertiary">+{xpReward} XP</span>
              <span className="font-mono text-[10px] text-outline">
                {completedCount}/{activities.length}
              </span>
            </div>
            <h1 className="mt-0.5 text-sm font-semibold text-on-surface">{lessonTitle}</h1>
          </div>
        </div>

        {earnedXpNotice !== null && (
          <div className="flex items-center gap-1.5 rounded-xl border border-secondary/40 bg-secondary-container/25 px-3 py-1.5 text-xs font-semibold text-secondary">
            <Award className="h-4 w-4" />
            <span>
              {t.lessonCompletedBanner} +{earnedXpNotice} XP
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onSelectCheatSheet}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold transition-all ${
            viewPhase === 'cheat_sheet'
              ? 'bg-primary text-on-primary shadow'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <BookOpen className="h-3 w-3" />
          <span>{t.stepLabels.cheatSheet}</span>
        </button>

        {activities.map((activity, idx) => {
          const isSelected = viewPhase === 'activity' && stepIndex === idx
          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => onSelectStep(idx)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold transition-all ${
                isSelected
                  ? 'bg-primary text-on-primary shadow'
                  : activity.completed
                    ? 'bg-secondary-container/20 text-secondary hover:bg-secondary-container/30'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {activity.completed && <CheckCircle2 className="h-3 w-3" />}
              <span>{t.stepLabels[activity.activityType]}</span>
              {activity.score !== null && (
                <span className="opacity-80">({activity.score}%)</span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
