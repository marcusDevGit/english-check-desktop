import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppLanguage } from '../../../shared/ipc-contracts'
import { getTranslations } from '../i18n/translations'

export interface AudioInputDevice {
  deviceId: string
  label: string
}

interface UseAudioRecorderResult {
  devices: AudioInputDevice[]
  selectedDeviceId: string
  setSelectedDeviceId: (deviceId: string) => void
  refreshDevices: () => Promise<void>
  isRecording: boolean
  isPlayingRecording: boolean
  inputLevel: number
  liveSamples: number[]
  recordedPeaks: number[]
  durationMs: number
  audioBytes: Uint8Array | null
  mimeType: string | null
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  toggleRecording: () => Promise<void>
  playRecording: () => void
  stopPlayback: () => void
  clearRecording: () => void
}

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus'
]

function pickSupportedMimeType(): string {
  for (const candidate of PREFERRED_MIME_TYPES) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
      return candidate
    }
  }
  return ''
}

export function useAudioRecorder(language: AppLanguage = 'pt-BR'): UseAudioRecorderResult {
  const t = getTranslations(language).hooks

  const [devices, setDevices] = useState<AudioInputDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [isRecording, setIsRecording] = useState(false)
  const [isPlayingRecording, setIsPlayingRecording] = useState(false)
  const [inputLevel, setInputLevel] = useState(0)
  const [liveSamples, setLiveSamples] = useState<number[]>([])
  const [recordedPeaks, setRecordedPeaks] = useState<number[]>([])
  const [durationMs, setDurationMs] = useState(0)
  const [audioBytes, setAudioBytes] = useState<Uint8Array | null>(null)
  const [mimeType, setMimeType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const peaksBufferRef = useRef<number[]>([])
  const startTimeRef = useRef<number>(0)
  const objectUrlRef = useRef<string | null>(null)
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null)

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const inputs = allDevices
        .filter((device) => device.kind === 'audioinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Audio Input #${index + 1}`
        }))
      setDevices(inputs)
      setSelectedDeviceId((current) => {
        if (current && inputs.some((item) => item.deviceId === current)) {
          return current
        }
        return inputs[0]?.deviceId ?? ''
      })
    } catch {
      setError(t.micListError)
    }
  }, [t.micListError])

  useEffect(() => {
    void refreshDevices()
    const mediaDevices = navigator.mediaDevices
    if (!mediaDevices?.addEventListener) return

    const handleChange = (): void => {
      void refreshDevices()
    }
    mediaDevices.addEventListener('devicechange', handleChange)
    return () => {
      mediaDevices.removeEventListener('devicechange', handleChange)
    }
  }, [refreshDevices])

  const cleanupAudioGraph = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }
    setInputLevel(0)
  }, [])

  const stopPlayback = useCallback(() => {
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause()
      playbackAudioRef.current.currentTime = 0
      playbackAudioRef.current = null
    }
    setIsPlayingRecording(false)
  }, [])

  const clearRecording = useCallback(() => {
    stopPlayback()
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setAudioBytes(null)
    setMimeType(null)
    setRecordedPeaks([])
    setLiveSamples([])
    setDurationMs(0)
    setError(null)
  }, [stopPlayback])

  const startRecording = useCallback(async () => {
    if (isRecording) return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(t.micUnavailable)
      return
    }

    clearRecording()

    try {
      const audioConstraint: MediaTrackConstraints | boolean = selectedDeviceId
        ? {
            deviceId: { exact: selectedDeviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        : {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint })
      streamRef.current = stream
      void refreshDevices()

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const timeData = new Uint8Array(analyser.fftSize)
      peaksBufferRef.current = []

      const chosenMimeType = pickSupportedMimeType()
      const recorder = chosenMimeType
        ? new MediaRecorder(stream, { mimeType: chosenMimeType })
        : new MediaRecorder(stream)

      chunksRef.current = []
      startTimeRef.current = performance.now()

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const finalDuration = Math.max(0, Math.round(performance.now() - startTimeRef.current))
        const resolvedMime = recorder.mimeType || chosenMimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: resolvedMime })
        const buffer = await blob.arrayBuffer()

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
        }
        objectUrlRef.current = URL.createObjectURL(blob)

        setAudioBytes(new Uint8Array(buffer))
        setMimeType(resolvedMime)
        setDurationMs(finalDuration)
        setRecordedPeaks([...peaksBufferRef.current])
        cleanupAudioGraph()
        setIsRecording(false)
      }

      recorder.onerror = () => {
        setError(t.recordError)
        cleanupAudioGraph()
        setIsRecording(false)
      }

      mediaRecorderRef.current = recorder
      recorder.start(100)
      setIsRecording(true)

      let lastUiUpdate = 0
      const sampleFrame = (): void => {
        analyser.getByteTimeDomainData(timeData)
        let peak = 0
        for (let i = 0; i < timeData.length; i += 1) {
          const normalized = Math.abs((timeData[i] - 128) / 128)
          if (normalized > peak) peak = normalized
        }
        const scaled = Math.min(1, peak * 1.8)
        peaksBufferRef.current.push(scaled)

        const now = performance.now()
        if (now - lastUiUpdate >= 50) {
          lastUiUpdate = now
          setInputLevel(scaled)
          setDurationMs(Math.round(now - startTimeRef.current))
          setLiveSamples((prev) => {
            const next = [...prev, scaled]
            return next.length > 72 ? next.slice(next.length - 72) : next
          })
        }

        rafIdRef.current = requestAnimationFrame(sampleFrame)
      }

      rafIdRef.current = requestAnimationFrame(sampleFrame)
    } catch (err) {
      cleanupAudioGraph()
      setIsRecording(false)
      const message =
        err instanceof Error && err.name === 'NotAllowedError'
          ? t.micDenied
          : t.micAccessError
      setError(message)
    }
  }, [
    clearRecording,
    cleanupAudioGraph,
    isRecording,
    refreshDevices,
    selectedDeviceId,
    t.micAccessError,
    t.micDenied,
    t.micUnavailable,
    t.recordError
  ])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }, [])

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording()
      return
    }
    await startRecording()
  }, [isRecording, startRecording, stopRecording])

  const playRecording = useCallback(() => {
    if (!objectUrlRef.current) return
    stopPlayback()

    const audio = new Audio(objectUrlRef.current)
    playbackAudioRef.current = audio
    audio.onended = () => {
      setIsPlayingRecording(false)
      playbackAudioRef.current = null
    }
    audio.onerror = () => {
      setIsPlayingRecording(false)
      setError(t.playbackError)
    }
    setIsPlayingRecording(true)
    void audio.play()
  }, [stopPlayback, t.playbackError])

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }
      cleanupAudioGraph()
      stopPlayback()
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [cleanupAudioGraph, stopPlayback])

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDevices,
    isRecording,
    isPlayingRecording,
    inputLevel,
    liveSamples,
    recordedPeaks,
    durationMs,
    audioBytes,
    mimeType,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
    playRecording,
    stopPlayback,
    clearRecording
  }
}
