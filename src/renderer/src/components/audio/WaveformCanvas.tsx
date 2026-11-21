import { useEffect, useRef } from 'react'

interface WaveformCanvasProps {
  isRecording: boolean
  liveSamples: number[]
  recordedPeaks: number[]
  standbyLabel: string
}

function downsamplePeaks(peaks: number[], targetBars: number): number[] {
  if (peaks.length === 0) return []
  if (peaks.length <= targetBars) return peaks

  const bucketSize = peaks.length / targetBars
  const sampled: number[] = []
  for (let i = 0; i < targetBars; i += 1) {
    const start = Math.floor(i * bucketSize)
    const end = Math.min(peaks.length, Math.floor((i + 1) * bucketSize))
    let maxVal = 0
    for (let j = start; j < end; j += 1) {
      if (peaks[j] > maxVal) maxVal = peaks[j]
    }
    sampled.push(maxVal)
  }
  return sampled
}

export function WaveformCanvas({
  isRecording,
  liveSamples,
  recordedPeaks,
  standbyLabel
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const draw = (): void => {
      const rect = container.getBoundingClientRect()
      const width = Math.max(200, Math.floor(rect.width))
      const height = Math.max(56, Math.floor(rect.height))
      const dpr = window.devicePixelRatio || 1

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      // Subtle timeline gridlines
      ctx.strokeStyle = 'rgba(144, 143, 160, 0.14)'
      ctx.lineWidth = 1
      const divisions = 6
      for (let i = 1; i < divisions; i += 1) {
        const x = (width / divisions) * i
        ctx.beginPath()
        ctx.moveTo(x, 6)
        ctx.lineTo(x, height - 6)
        ctx.stroke()
      }

      const centerY = height / 2
      ctx.setLineDash([3, 4])
      ctx.strokeStyle = 'rgba(192, 193, 255, 0.22)'
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(width, centerY)
      ctx.stroke()
      ctx.setLineDash([])

      const rawBars = isRecording ? liveSamples : downsamplePeaks(recordedPeaks, 72)
      if (rawBars.length === 0) return

      const barCount = 72
      const slotWidth = width / barCount
      const barWidth = Math.max(2, Math.min(5, slotWidth * 0.55))
      const offset = isRecording ? barCount - rawBars.length : 0

      for (let i = 0; i < rawBars.length; i += 1) {
        const amplitude = Math.max(0.06, rawBars[i])
        const barHeight = amplitude * (height * 0.78)
        const x = (offset + i) * slotWidth + (slotWidth - barWidth) / 2
        const y = centerY - barHeight / 2

        ctx.fillStyle = isRecording ? '#c0c1ff' : '#4edea3'
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, 2)
        ctx.fill()
      }
    }

    draw()

    const observer = new ResizeObserver(() => draw())
    observer.observe(container)
    return () => observer.disconnect()
  }, [isRecording, liveSamples, recordedPeaks])

  return (
    <div ref={containerRef} className="relative h-14 w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
      {!isRecording && recordedPeaks.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-md bg-surface-container/90 px-2.5 py-1 font-mono text-[10px] text-outline">
            {standbyLabel}
          </span>
        </div>
      )}
    </div>
  )
}
