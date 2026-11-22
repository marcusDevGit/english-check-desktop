import { ArrowRight, CheckCircle2 } from 'lucide-react'
import type { AppLanguage, LessonSummary } from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

interface TrackLessonsListProps {
  lessons: LessonSummary[]
  language: AppLanguage
  onOpenLesson: (lessonId: number) => void
}

export function TrackLessonsList({
  lessons,
  language,
  onOpenLesson
}: TrackLessonsListProps) {
  const t = getTranslations(language).tracks
  const isPt = language === 'pt-BR'

  if (lessons.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-surface-container-high p-6 text-xs text-outline">
        {t.noLessonsHint}
      </div>
    )
  }

  return (
    <>
      {lessons.map((lesson, idx) => {
        const doneActivities = lesson.activities.filter((a) => a.completed).length
        const isLessonDone = lesson.completedAt !== null
        const title = isPt ? lesson.titlePt : lesson.titleEn

        return (
          <div
            key={lesson.id}
            className="flex flex-col justify-between gap-3 rounded-xl border border-surface-container-high bg-surface-container-lowest p-3.5 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] text-outline">#{idx + 1}</span>
                <span className="rounded bg-tertiary-container/25 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-tertiary">
                  +{lesson.xpReward} XP
                </span>
                <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[10px] text-on-surface-variant">
                  {lesson.cheatSheet.length}{' '}
                  {isPt ? 'chunks no Cheat Sheet' : 'Cheat Sheet chunks'}
                </span>
                <span className="font-mono text-[10px] text-outline">
                  {doneActivities}/{lesson.activities.length}{' '}
                  {isPt ? 'etapas' : 'steps'}
                </span>
                {isLessonDone && (
                  <span className="inline-flex items-center gap-1 rounded bg-secondary-container/25 px-1.5 py-0.5 font-mono text-[10px] text-secondary">
                    <CheckCircle2 className="h-3 w-3" />
                    {lesson.bestScore !== null ? `${lesson.bestScore}%` : t.mastered}
                  </span>
                )}
              </div>

              <h3 className="mt-1 text-xs font-semibold text-on-surface">{title}</h3>

              <div className="mt-1.5 flex flex-wrap gap-1">
                {lesson.activities.map((activity) => (
                  <span
                    key={activity.id}
                    className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${
                      activity.completed
                        ? 'bg-secondary-container/20 text-secondary'
                        : 'bg-surface-container text-outline'
                    }`}
                  >
                    {t.stepLabels[activity.activityType]}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenLesson(lesson.id)}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary-container px-3.5 py-2 text-xs font-semibold text-on-primary-container transition-all hover:brightness-110"
            >
              <span>{isLessonDone ? t.reviewLessonBtn : t.openLessonBtn}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </>
  )
}
