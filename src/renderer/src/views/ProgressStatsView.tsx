import { Activity, Award, Clock, Flame, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { AppLanguage, StudyStats } from '../../../shared/ipc-contracts'
import { getTranslations } from '../i18n/translations'

interface ProgressStatsViewProps {
  language: AppLanguage
}

export function ProgressStatsView({ language }: ProgressStatsViewProps) {
  const t = getTranslations(language).stats
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    const res = await window.englishChecks.getStats()
    if (res.ok) setStats(res.data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden p-3">
      <section className="flex items-center justify-between rounded-xl border border-surface-container-high bg-surface-container-low px-3.5 py-2 shadow-md">
        <div>
          <h1 className="text-xs font-semibold text-on-surface">{t.title}</h1>
          <p className="text-[10px] text-outline">{t.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => void loadStats()}
          className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[11px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{t.refresh}</span>
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-outline">
            <span>{t.streak}</span>
            <Flame className="h-4 w-4 text-tertiary" />
          </div>
          <p className="mt-1.5 font-mono text-2xl font-bold text-on-surface">
            {stats?.currentStreakDays ?? 0}{' '}
            <span className="text-xs font-normal text-outline">{t.days}</span>
          </p>
        </div>

        <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-outline">
            <span>{t.totalTime}</span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1.5 font-mono text-2xl font-bold text-on-surface">
            {stats?.totalFocusMinutes ?? 0}{' '}
            <span className="text-xs font-normal text-outline">{t.min}</span>
          </p>
        </div>

        <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-outline">
            <span>{t.averageScore}</span>
            <Award className="h-4 w-4 text-secondary" />
          </div>
          <p className="mt-1.5 font-mono text-2xl font-bold text-secondary">
            {stats?.averageScore ?? 0}
            <span className="text-sm font-normal">%</span>
          </p>
        </div>

        <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-outline">
            <span>{t.totalSessions}</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1.5 font-mono text-2xl font-bold text-on-surface">
            {stats?.totalSessions ?? 0}
          </p>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-low p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-on-surface">{t.recentSessions}</h2>
          <span className="font-mono text-[10px] text-outline">{t.last10}</span>
        </div>

        {!stats || stats.recentSessions.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-surface-container-high bg-surface-container-lowest/50 p-6 text-center text-xs text-outline">
            {t.emptyHint}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-surface-container-high bg-surface-container-lowest">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-surface-container font-mono text-[10px] text-outline uppercase">
                <tr>
                  <th className="px-3 py-2">{t.colType}</th>
                  <th className="px-3 py-2">{t.colDuration}</th>
                  <th className="px-3 py-2">{t.colScore}</th>
                  <th className="px-3 py-2">{t.colTimestamp}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/60">
                {stats.recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-surface-container/40">
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${
                          session.type === 'pronunciation'
                            ? 'bg-primary/15 text-primary'
                            : session.type === 'writing'
                              ? 'bg-secondary-container/25 text-secondary'
                              : 'bg-tertiary-container/25 text-tertiary'
                        }`}
                      >
                        {t.sessionTypes[session.type]}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-on-surface-variant">
                      {session.durationSeconds}s
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] font-semibold text-on-surface">
                      {session.score !== null ? `${session.score}%` : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-outline">
                      {new Date(session.createdAt).toLocaleString(language === 'pt-BR' ? 'pt-BR' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
