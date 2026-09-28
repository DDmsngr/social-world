import { useRef, useState } from 'react'

/** Первый из перечисленных MIME, который умеет писать MediaRecorder в этом браузере. */
function pickMime(candidates: string[]) {
  for (const c of candidates) if (MediaRecorder.isTypeSupported(c)) return c
  return undefined
}

const AUDIO_MIME = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
const VIDEO_MIME = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']

const ext = (mime: string) => (mime.startsWith('video/') ? 'webm' : mime.includes('ogg') ? 'ogg' : 'webm')

/**
 * Запись голосового/видео прямо в браузере через MediaRecorder — тот же файл,
 * что и обычное вложение, дальше идёт по уже готовому пути (uploadFile в
 * ws-files, привязка к message_id). Микрофон/камера освобождаются в любом
 * исходе (stop/cancel/ошибка), иначе индикатор записи в браузере не гаснет.
 */
export function useRecorder() {
  const [recording, setRecording] = useState<{ kind: 'audio' | 'video'; seconds: number } | null>(null)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | undefined>(undefined)

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    window.clearInterval(timerRef.current)
    timerRef.current = undefined
  }

  const start = async (kind: 'audio' | 'video') => {
    const stream = await navigator.mediaDevices.getUserMedia(
      kind === 'video' ? { audio: true, video: { facingMode: 'user', width: 480 } } : { audio: true },
    )
    streamRef.current = stream
    const mime = pickMime(kind === 'video' ? VIDEO_MIME : AUDIO_MIME)
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    chunksRef.current = []
    rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorderRef.current = rec
    rec.start()
    setRecording({ kind, seconds: 0 })
    setPreviewStream(kind === 'video' ? stream : null)
    timerRef.current = window.setInterval(() => setRecording(r => r && { ...r, seconds: r.seconds + 1 }), 1000)
  }

  /** `null`, если запись меньше секунды — почти всегда случайный клик мимо. */
  const stop = (): Promise<File | null> => new Promise(resolve => {
    const rec = recorderRef.current
    const kind = recording?.kind
    if (!rec || !kind) { resolve(null); return }
    rec.onstop = () => {
      const mime = rec.mimeType || (kind === 'video' ? 'video/webm' : 'audio/webm')
      const blob = new Blob(chunksRef.current, { type: mime })
      stopTracks()
      setRecording(null)
      setPreviewStream(null)
      resolve(blob.size < 2000 ? null : new File([blob], `${kind === 'video' ? 'video' : 'voice'}-${Date.now()}.${ext(mime)}`, { type: mime }))
    }
    rec.stop()
  })

  const cancel = () => {
    if (recorderRef.current) recorderRef.current.onstop = null
    recorderRef.current?.stop()
    stopTracks()
    chunksRef.current = []
    setRecording(null)
    setPreviewStream(null)
  }

  return { recording, previewStream, start, stop, cancel }
}

export function fmtRecTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}
