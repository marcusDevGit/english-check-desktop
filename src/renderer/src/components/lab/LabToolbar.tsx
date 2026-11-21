import { Mic, RefreshCw, Shuffle } from 'lucide-react'
import type { Accent, AppLanguage } from '../../../../shared/ipc-contracts'
import type { AudioInputDevice } from '../../hooks/useAudioRecorder'
import { getTranslations } from '../../i18n/translations'

interface LabToolbarProps {
  language: AppLanguage
  devices: AudioInputDevice[]
  selectedDeviceId: string
  onSelectDevice: (deviceId: string) => void
  onRefreshDevices: () => void
  isRecording: boolean
  inputLevel: number
  accent: Accent
  onSelectAccent: (accent: Accent) => void
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
  onShuffle: () => void
  onNext: () => void
}

export function LabToolbar({
  language,
  devices,
  selectedDeviceId,
  onSelectDevice,
  onRefreshDevices,
  isRecording,
  inputLevel,
  accent,
  onSelectAccent,
  categories,
  selectedCategory,
  onSelectCategory,
  onShuffle,
  onNext
}: LabToolbarProps) {
  const t = getTranslations(language).lab

  return (
    <section className="relative z-10 flex w-full items-center justify-between gap-2.5 rounded-xl border border-surface-container-high bg-surface-container-low/95 px-2.5 py-1.5 text-xs shadow-md backdrop-blur-md">
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 shadow-sm">
          <Mic className="h-3.5 w-3.5 shrink-0 text-primary" />
          <select
            aria-label="Audio Input Device"
            value={selectedDeviceId}
            onChange={(e) => onSelectDevice(e.target.value)}
            className="max-w-[185px] cursor-pointer bg-transparent text-[11px] font-medium tracking-tight text-on-surface outline-none"
          >
            {devices.length === 0 ? (
              <option value="" className="bg-surface-container text-on-surface">
                {t.defaultMic}
              </option>
            ) : (
              devices.map((device) => (
                <option
                  key={device.deviceId}
                  value={device.deviceId}
                  className="bg-surface-container text-on-surface"
                >
                  {device.label}
                </option>
              ))
            )}
          </select>

          <div className="ml-0.5 flex items-center gap-0.5">
            <span
              className={`h-1.5 w-1 rounded-full transition-colors ${
                isRecording && inputLevel > 0.05 ? 'bg-secondary' : 'bg-secondary/50'
              }`}
            />
            <span
              className={`h-2 w-1 rounded-full transition-colors ${
                isRecording && inputLevel > 0.25 ? 'bg-secondary' : 'bg-surface-variant'
              }`}
            />
            <span
              className={`h-1.5 w-1 rounded-full transition-colors ${
                isRecording && inputLevel > 0.55 ? 'bg-tertiary' : 'bg-surface-variant'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={onRefreshDevices}
            title={t.refreshDevices}
            className="text-outline transition-colors hover:text-on-surface"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>

        <div className="hidden h-4 w-px bg-surface-container-high sm:block" />

        <div className="flex items-center rounded-lg bg-surface-container-lowest p-0.5">
          {(['US', 'UK'] as const).map((option) => {
            const active = accent === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => onSelectAccent(option)}
                className={
                  active
                    ? 'flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-[11px] font-semibold text-on-primary shadow-sm transition-all'
                    : 'flex items-center gap-1 rounded px-2.5 py-1 text-[11px] text-on-surface-variant transition-all hover:text-on-surface'
                }
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-on-primary" />}
                <span>{option}</span>
                <span className={`font-mono text-[9px] ${active ? 'opacity-80' : 'text-outline'}`}>
                  {option === 'US' ? 'General' : 'RP'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-0.5">
        {categories.map((category) => {
          const active = selectedCategory === category
          const label = category === 'All' ? t.allCategories : category
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={
                active
                  ? 'flex shrink-0 items-center gap-1 rounded-lg bg-surface-container-high px-2 py-1 text-[11px] font-semibold text-primary shadow-sm'
                  : 'shrink-0 rounded-lg bg-surface-container px-2 py-1 text-[11px] font-medium text-on-surface-variant transition-colors hover:text-on-surface'
              }
            >
              {active && <span className="h-1 w-1 rounded-full bg-primary" />}
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onShuffle}
          title={t.shuffleTitle}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <Shuffle className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-on-primary shadow-sm transition-all hover:brightness-110 active:scale-95"
        >
          <span>{t.next}</span>
          <kbd className="rounded bg-on-primary/20 px-1 py-0.5 font-mono text-[9px] text-on-primary">
            Enter
          </kbd>
        </button>
      </div>
    </section>
  )
}
