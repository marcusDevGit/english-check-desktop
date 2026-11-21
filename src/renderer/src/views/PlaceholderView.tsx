import { Construction } from 'lucide-react'

interface PlaceholderViewProps {
  title: string
  description: string
  targetSprint: string
}

export function PlaceholderView({
  title,
  description,
  targetSprint
}: PlaceholderViewProps) {
  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-surface-container-high bg-surface-container-low p-6 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Construction className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-on-surface">{title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
          {description}
        </p>
        <span className="mt-4 inline-block rounded-full bg-surface-container px-3 py-1 font-mono text-[11px] text-primary">
          Planned for {targetSprint}
        </span>
      </div>
    </div>
  )
}
