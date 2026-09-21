import { useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, ExternalLink, Trash2, Upload } from 'lucide-react'
import { PAGE, deleteAttachment, fetchActivity, signedUrl, uploadFile } from './api'
import { useWorkspace } from './auth'
import { describeActivity, fmtDateTime, fmtSize, timeAgo } from './meta'
import type { Attachment } from './types'
import { QueryState, Spinner, errMsg, useToast } from './ui'

// ── журнал активности ───────────────────────────────────────────────────────

export function ActivityList({ entityId, actorId, empty = 'Событий пока нет' }: {
  entityId?: string; actorId?: string; empty?: string
}) {
  const { workspace, byUser } = useWorkspace()
  const q = useInfiniteQuery({
    queryKey: ['activity', workspace.id, entityId ?? null, actorId ?? null],
    queryFn: ({ pageParam }) => fetchActivity(workspace.id, pageParam, { entityId, actorId }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length : undefined),
  })
  const events = q.data?.pages.flat() ?? []
  return (
    <QueryState loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} empty={events.length === 0} emptyText={empty}>
      <ol className="space-y-2.5" data-testid="activity">
        {events.map(e => (
          <li key={e.id} className="flex gap-3 text-sm">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--d-tint)]" aria-hidden />
            <div className="min-w-0">
              <p>{describeActivity(e, byUser)}</p>
              <time className="dash-muted text-xs" dateTime={e.created_at} title={fmtDateTime(e.created_at)}>{timeAgo(e.created_at)}</time>
            </div>
          </li>
        ))}
      </ol>
      {q.hasNextPage && (
        <button className="dash-btn dash-btn-ghost dash-btn-sm mt-3" disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>
          {q.isFetchingNextPage ? 'Загружаем…' : 'Показать ещё'}
        </button>
      )}
    </QueryState>
  )
}

// ── файлы ───────────────────────────────────────────────────────────────────

export function UploadButton({ target, label = 'Прикрепить файл', onDone }: {
  target: { taskId?: string; messageId?: string }; label?: string; onDone?: () => void
}) {
  const { workspace, userId } = useWorkspace()
  const qc = useQueryClient()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const up = useMutation({
    mutationFn: (file: File) => uploadFile(workspace.id, userId, file, target),
    onSuccess: () => {
      toast('Файл загружен')
      for (const k of ['attachments', 'tasks', 'task', 'activity', 'notifications']) qc.invalidateQueries({ queryKey: [k] })
      onDone?.()
    },
    onError: e => toast(errMsg(e), 'error'),
  })
  return (
    <>
      <input ref={input} type="file" className="sr-only" tabIndex={-1} aria-label={label} data-testid="file-input"
        onChange={e => { const f = e.target.files?.[0]; if (f) up.mutate(f); e.target.value = '' }} />
      <button type="button" className="dash-btn dash-btn-ghost dash-btn-sm" disabled={up.isPending} onClick={() => input.current?.click()}>
        {up.isPending ? <Spinner label="Загружаем" /> : <><Upload className="h-4 w-4" aria-hidden /> {label}</>}
      </button>
    </>
  )
}

export function FileList({ files, showTask }: { files: Attachment[]; showTask?: boolean }) {
  const { byUser, isAdmin, userId } = useWorkspace()
  const qc = useQueryClient()
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)

  const open = async (a: Attachment, download: boolean) => {
    setBusy(a.id)
    try {
      const url = await signedUrl(a.storage_path, download ? a.filename : undefined)
      window.open(url, '_blank', 'noopener')
    } catch (e) { toast(errMsg(e), 'error') }
    setBusy(null)
  }
  const del = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => { toast('Файл удалён'); qc.invalidateQueries({ queryKey: ['attachments'] }); qc.invalidateQueries({ queryKey: ['tasks'] }) },
    onError: e => toast(errMsg(e), 'error'),
  })

  return (
    <ul data-testid="files">
      {files.map(a => (
        <li key={a.id} className="dash-row flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
          <div className="min-w-0 flex-1 basis-48">
            <div className="truncate text-sm font-medium">{a.filename}</div>
            <div className="dash-muted text-xs">
              {a.mime ?? 'файл'} · {fmtSize(a.size)} · {byUser(a.uploader_id)?.name ?? '—'} · {fmtDateTime(a.created_at)}
              {showTask && a.task_id && <> · <a className="underline" href={`${import.meta.env.BASE_URL}dashboard/tasks/${a.task_id}`}>задача</a></>}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button className="dash-btn dash-btn-ghost dash-btn-sm" disabled={busy === a.id} onClick={() => open(a, false)} aria-label={`Открыть ${a.filename}`}>
              <ExternalLink className="h-4 w-4" aria-hidden />
            </button>
            <button className="dash-btn dash-btn-ghost dash-btn-sm" disabled={busy === a.id} onClick={() => open(a, true)} aria-label={`Скачать ${a.filename}`}>
              <Download className="h-4 w-4" aria-hidden />
            </button>
            {(isAdmin || a.uploader_id === userId) && (
              <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => confirm(`Удалить «${a.filename}»?`) && del.mutate(a)} aria-label={`Удалить ${a.filename}`}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
