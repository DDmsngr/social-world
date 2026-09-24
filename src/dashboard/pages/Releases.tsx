import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Pencil } from 'lucide-react'
import { fetchReleases, updateReleaseNotes } from '../api'
import { useWorkspace } from '../auth'
import { fmtDateTime, fmtSize } from '../meta'
import type { AppRelease } from '../types'
import Md from '../Md'
import { PageHeader, QueryState, errMsg, useToast } from '../ui'

function NotesEditor({ release, onDone }: { release: AppRelease; onDone: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [text, setText] = useState(release.notes)
  const save = useMutation({
    mutationFn: () => updateReleaseNotes(release.id, text.trim()),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['releases'] })
      toast('Описание сохранено')
      onDone()
    },
    onError: e => toast(errMsg(e), 'error'),
  })
  return (
    <div>
      <textarea className="dash-input min-h-32" value={text} onChange={e => setText(e.target.value)}
        aria-label={`Описание сборки ${release.version_code}`} placeholder="Что сделано в этой сборке (Markdown)" />
      <div className="mt-2 flex gap-2">
        <button className="dash-btn dash-btn-sm" disabled={save.isPending} onClick={() => save.mutate()}>Сохранить</button>
        <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={onDone}>Отмена</button>
      </div>
    </div>
  )
}

function ReleaseCard({ release, latest, isAdmin }: { release: AppRelease; latest: boolean; isAdmin: boolean }) {
  const [editing, setEditing] = useState(false)
  return (
    <li className="dash-card p-4" data-testid="release">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Версия {release.version_name} <span className="dash-muted text-sm font-normal">· сборка {release.version_code}</span></h2>
            {latest && <span className="dash-chip dash-tab-active">Последняя</span>}
          </div>
          <p className="dash-muted mt-1 text-xs">
            {fmtDateTime(release.created_at)}
            {release.size_bytes ? ` · ${fmtSize(release.size_bytes)}` : ''}
            {release.commit_sha ? ` · ${release.commit_sha.slice(0, 7)}` : ''}
          </p>
        </div>
        <a className={`dash-btn ${latest ? '' : 'dash-btn-ghost'}`} href={release.apk_url} download>
          <Download className="h-4 w-4" aria-hidden /> Скачать APK
        </a>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="dash-label">Что сделано</span>
          {isAdmin && !editing && (
            <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Изменить описание
            </button>
          )}
        </div>
        {editing
          ? <NotesEditor release={release} onDone={() => setEditing(false)} />
          : release.notes.trim()
            ? <Md>{release.notes}</Md>
            : <p className="dash-muted text-sm">Описание не заполнено</p>}
      </div>
    </li>
  )
}

export default function Releases() {
  const { workspace, isAdmin } = useWorkspace()
  const list = useQuery({ queryKey: ['releases', workspace.id], queryFn: () => fetchReleases(workspace.id), refetchInterval: 60_000 })
  const items = list.data ?? []

  return (
    <>
      <PageHeader title="Релизы" sub="Сборки приложения для Android: скачать APK и посмотреть, что изменилось. Новые сборки появляются здесь сами после публикации из GitHub." />
      <QueryState loading={list.isLoading} error={list.error} onRetry={() => list.refetch()}
        empty={items.length === 0} emptyText="Сборок пока нет" emptyHint="Первая появится после публикации релиза в GitHub Actions.">
        <ul className="space-y-3" data-testid="releases">
          {items.map((r, i) => <ReleaseCard key={r.id} release={r} latest={i === 0} isAdmin={isAdmin} />)}
        </ul>
      </QueryState>
    </>
  )
}
