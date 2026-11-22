import {
  Award,
  CheckCircle2,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  Square,
  Volume2
} from 'lucide-react'
import { useState } from 'react'
import type {
  ActivityPayload,
  AppLanguage,
  RoleplayMessage
} from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

type RoleplayPayload = Extract<ActivityPayload, { type: 'roleplay' }>

export interface RoleplayChatItem extends RoleplayMessage {
  feedback?: string
}

interface RoleplayStepProps {
  language: AppLanguage
  payload: RoleplayPayload
  history: RoleplayChatItem[]
  achievedObjectives: string[]
  isRecording: boolean
  hasRecording: boolean
  isSubmitting: boolean
  onSpeakLine: (text: string) => void
  onToggleRecording: () => void
  onSendTextTurn: (message: string) => void
  onSendVoiceTurn: () => void
  onFinishRoleplay: () => void
}

export function RoleplayStep({
  language,
  payload,
  history,
  achievedObjectives,
  isRecording,
  hasRecording,
  isSubmitting,
  onSpeakLine,
  onToggleRecording,
  onSendTextTurn,
  onSendVoiceTurn,
  onFinishRoleplay
}: RoleplayStepProps) {
  const t = getTranslations(language).tracks
  const isPt = language === 'pt-BR'
  const [inputText, setInputText] = useState('')

  const handleSubmitText = (): void => {
    const trimmed = inputText.trim()
    if (!trimmed || isSubmitting) return
    onSendTextTurn(trimmed)
    setInputText('')
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-on-surface">
              {payload.persona}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-on-surface-variant">{payload.scenario}</p>
        </div>

        <div className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-3">
          <p className="font-mono text-[10px] uppercase text-outline">
            {t.objectivesLabel}
          </p>
          <ul className="mt-1.5 space-y-1">
            {payload.objectives.map((obj) => {
              const done = achievedObjectives.includes(obj)
              return (
                <li
                  key={obj}
                  className={`flex items-start gap-1.5 text-[11px] ${
                    done ? 'font-medium text-secondary' : 'text-on-surface-variant'
                  }`}
                >
                  <CheckCircle2
                    className={`mt-0.5 h-3 w-3 shrink-0 ${
                      done ? 'text-secondary' : 'text-outline/40'
                    }`}
                  />
                  <span>{obj}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="min-h-[180px] flex-1 space-y-2.5 overflow-y-auto rounded-xl border border-surface-container-high bg-surface-container-lowest p-3">
        {history.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col gap-1 ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface'
              }`}
            >
              <p>{msg.content}</p>
              {msg.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => onSpeakLine(msg.content)}
                  className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                >
                  <Volume2 className="h-3 w-3" />
                  <span>{t.listenNative}</span>
                </button>
              )}
            </div>
            {msg.feedback && (
              <p className="max-w-[85%] text-[10px] text-outline">💡 {msg.feedback}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {payload.starterChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setInputText(`${chip} `)}
            className="rounded-lg border border-surface-container-high bg-surface-container-lowest px-2.5 py-1 text-[11px] text-on-surface-variant hover:border-primary/50 hover:text-primary"
          >
            + {chip}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmitText()
          }}
          placeholder={
            isPt
              ? 'Responda em inglês ou grave sua fala pelo microfone...'
              : 'Reply in English or record your response with the mic...'
          }
          className="min-w-[220px] flex-1 rounded-xl border border-surface-container-high bg-surface-container-lowest px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
        />

        <button
          type="button"
          disabled={isSubmitting || !inputText.trim()}
          onClick={handleSubmitText}
          className="flex items-center gap-1 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-on-primary disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{t.sendTurn}</span>
        </button>

        <button
          type="button"
          onClick={onToggleRecording}
          className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold ${
            isRecording
              ? 'animate-pulse bg-error text-on-error'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        </button>

        {hasRecording && !isRecording && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSendVoiceTurn}
            className="flex items-center gap-1 rounded-xl bg-secondary-container px-3 py-2 text-xs font-semibold text-on-secondary-container"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.sendVoiceTurn}</span>
          </button>
        )}

        {history.some((m) => m.role === 'user') && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onFinishRoleplay}
            className="flex items-center gap-1 rounded-xl border border-secondary/50 bg-secondary-container/25 px-3.5 py-2 text-xs font-semibold text-secondary hover:bg-secondary-container/40"
          >
            <Award className="h-3.5 w-3.5" />
            <span>{t.finishRoleplay}</span>
          </button>
        )}
      </div>
    </div>
  )
}
