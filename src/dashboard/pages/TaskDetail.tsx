import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ArrowLeft, Pencil, Reply, Trash2 } from 'lucide-react'
import {
  addComment, createLabel, deleteComment, editComment, fetchAttachments, fetchComments, fetchTask, setTaskLabels,
} from '../api'
import { useWorkspace } from '../auth'
import { PRIORITIES, STATUSES, fmtDateTime, timeAgo } from '../meta'
import type { Priority, TaskComment, TaskStatus } from '../types'
import { Avatar, Field, QueryState, errMsg, useToast } from '../ui'
import { ActivityList, FileList, UploadButton } from '../shared'
import { LabelChips, PriorityChip, StatusChip, useTaskUpdate } from '../taskParts'

export default function TaskDetail() {
  const { id = '' } = useParams()
  const { members, byUser, isAdmin, userId, labels, workspace } = useWorkspace()
  const qc = useQueryClient()
  const nav = useNavigate()
  const toast = useToast()
  const update = useTaskUpdate()

  const task = useQuery({ queryKey: ['task', id], queryFn: () => fetchTask(id) })
  const t = task.data
  const isAssignee = !!t && t.assignee_id === userId
  const canStatus = isAdmin || isAssignee
  const [editingDesc, setEditingDesc] = useState(false)
  const [desc, setDesc] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('')

  const files = useQuery({ queryKey: ['attachments', 'task', id], queryFn: () => fetchAttachments({ taskId: id }), enabled: !!t })

  const labelsMut = useMutation({
    mutationFn: (ids: string[]) => setTaskLabels(id, ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', id] }); qc.invalidateQueries({ queryKey: ['tasks'] }) },
    onError: e => toast(errMsg(e), 'error'),
  })
  const [newLabel, setNewLabel] = useState('')
  const addLabel = useMutation({
    mutationFn: async () => {
      const l = await createLabel(workspace.id, newLabel.trim(), '#c4677c')
      await setTaskLabels(id, [...(t?.label_ids ?? []), l.id])
    },
    onSuccess: () => { setNewLabel(''); qc.invalidateQueries({ queryKey: ['labels'] }); qc.invalidateQueries({ queryKey: ['task', id] }); qc.invalidateQueries({ queryKey: ['tasks'] }) },
    onError: e => toast(errMsg(e), 'error'),
  })

  const patch = (p: Parameters<typeof update.mutate>[0]['patch']) => update.mutate({ id, patch: p })
  const assignable = members.filter(m => m.status === 'active' && m.user_id)

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/dashboard/tasks" className="dash-muted mb-3 inline-flex items-center gap-1 text-sm hover:text-[var(--d-text)]">
        <ArrowLeft className="h-4 w-4" aria-hidden /> К задачам
      </Link>

      <QueryState loading={task.isLoading} error={task.error} onRetry={() => task.refetch()}
        empty={!t} emptyText="Задача не найдена" emptyHint="Она удалена, в архиве или у вас нет доступа.">
        {t && (
          <>
            <div className="mb-5">
              {editingTitle ? (
                <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (title.trim()) { patch({ title: title.trim() }); setEditingTitle(false) } }}>
                  <input className="dash-input text-lg font-semibold" aria-label="Название задачи" autoFocus value={title} onChange={e => setTitle(e.target.value)} />
                  <button className="dash-btn">Сохранить</button>
                </form>
              ) : (
                <h1 className="flex items-start gap-2 text-xl font-semibold tracking-tight md:text-2xl" data-testid="task-title">
                  {t.title}
                  {isAdmin && (
                    <button className="dash-btn dash-btn-ghost dash-btn-sm mt-0.5" aria-label="Изменить название" onClick={() => { setTitle(t.title); setEditingTitle(true) }}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </h1>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusChip status={t.status} /><PriorityChip priority={t.priority} /><LabelChips ids={t.label_ids} />
              </div>
            </div>

            <section aria-label="Параметры" className="dash-card mb-5 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Статус">
                <select className="dash-input" disabled={!canStatus} value={t.status} onChange={e => patch({ status: e.target.value as TaskStatus })}>
                  {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Приоритет">
                <select className="dash-input" disabled={!isAdmin} value={t.priority} onChange={e => patch({ priority: e.target.value as Priority })}>
                  {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Исполнитель">
                <select className="dash-input" disabled={!isAdmin} value={t.assignee_id ?? ''} onChange={e => patch({ assignee_id: e.target.value || null })}>
                  <option value="">Не назначен</option>
                  {assignable.map(m => <option key={m.id} value={m.user_id!}>{m.name}</option>)}
                </select>
              </Field>
              <Field label="Срок">
                <input className="dash-input" type="date" disabled={!isAdmin} value={t.due_date ?? ''} onChange={e => patch({ due_date: e.target.value || null })} />
              </Field>
              <div>
                <span className="dash-label mb-1.5 block">Автор</span>
                <span className="flex items-center gap-2 text-sm"><Avatar member={byUser(t.creator_id)} size={24} />{byUser(t.creator_id)?.name ?? '—'}</span>
                <span className="dash-muted mt-1 block text-xs">создана {fmtDateTime(t.created_at)}</span>
              </div>
              <div>
                <span className="dash-label mb-1.5 block">Метки</span>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map(l => {
                    const on = t.label_ids.includes(l.id)
                    return (
                      <button key={l.id} type="button" disabled={!isAdmin || labelsMut.isPending} aria-pressed={on}
                        onClick={() => labelsMut.mutate(on ? t.label_ids.filter(x => x !== l.id) : [...t.label_ids, l.id])}
                        className="dash-chip disabled:cursor-default" style={on ? { color: l.color, borderColor: l.color, background: l.color + '1f' } : undefined}>
                        {l.name}
                      </button>
                    )
                  })}
                  {labels.length === 0 && <span className="dash-muted text-xs">Меток пока нет</span>}
                </div>
                {isAdmin && (
                  <form className="mt-2 flex gap-1.5" onSubmit={e => { e.preventDefault(); if (newLabel.trim()) addLabel.mutate() }}>
                    <input className="dash-input !min-h-8 text-xs" placeholder="Новая метка" aria-label="Название новой метки" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
                    <button className="dash-btn dash-btn-ghost dash-btn-sm" disabled={addLabel.isPending}>+</button>
                  </form>
                )}
              </div>
            </section>

            <section aria-labelledby="desc-h" className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 id="desc-h" className="dash-label">Описание</h2>
                {(isAdmin || isAssignee) && !editingDesc && (
                  <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => { setDesc(t.description); setEditingDesc(true) }}>Изменить</button>
                )}
              </div>
              {editingDesc ? (
                <form className="space-y-2" onSubmit={e => { e.preventDefault(); patch({ description: desc }); setEditingDesc(false) }}>
                  <textarea className="dash-input min-h-32" aria-label="Описание задачи" value={desc} onChange={e => setDesc(e.target.value)} />
                  <div className="flex gap-2">
                    <button className="dash-btn dash-btn-sm">Сохранить</button>
                    <button type="button" className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => setEditingDesc(false)}>Отмена</button>
                  </div>
                </form>
              ) : (
                <p className="dash-card whitespace-pre-wrap p-4 text-sm leading-relaxed">{t.description || <span className="dash-muted">Описания нет</span>}</p>
              )}
            </section>

            <section aria-labelledby="disc-h" className="mb-5">
              <h2 id="disc-h" className="dash-label mb-2">Обсуждение</h2>
              <Discussion taskId={id} />
            </section>

            <section aria-labelledby="files-h" className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 id="files-h" className="dash-label">Файлы</h2>
                <UploadButton target={{ taskId: id }} />
              </div>
              <div className="dash-card px-4 py-1">
                <QueryState loading={files.isLoading} error={files.error} onRetry={() => files.refetch()} empty={files.data?.length === 0} emptyText="Файлов нет">
                  <FileList files={files.data ?? []} />
                </QueryState>
              </div>
            </section>

            <section aria-labelledby="act-h" className="mb-5">
              <h2 id="act-h" className="dash-label mb-2">Активность</h2>
              <div className="dash-card p-4"><ActivityList entityId={id} /></div>
            </section>

            {isAdmin && (
              <button className="dash-btn dash-btn-ghost" onClick={() => {
                if (confirm('Архивировать задачу? Она исчезнет с доски, история сохранится.')) {
                  update.mutate({ id, patch: { archived_at: new Date().toISOString() } }, { onSuccess: () => { toast('Задача в архиве'); nav('/dashboard/tasks') } })
                }
              }}>
                <Archive className="h-4 w-4" aria-hidden /> Архивировать
              </button>
            )}
          </>
        )}
      </QueryState>
    </div>
  )
}

function Discussion({ taskId }: { taskId: string }) {
  const { members, byUser, userId } = useWorkspace()
  const qc = useQueryClient()
  const toast = useToast()
  const list = useQuery({ queryKey: ['comments', taskId], queryFn: () => fetchComments(taskId) })
  const [body, setBody] = useState('')
  const [mentions, setMentions] = useState<Record<string, string>>({})
  const [replyTo, setReplyTo] = useState<TaskComment | null>(null)

  const refresh = () => {
    for (const k of ['comments', 'tasks', 'task', 'activity']) qc.invalidateQueries({ queryKey: [k] })
  }
  const add = useMutation({
    mutationFn: () => {
      const ids = Object.entries(mentions).filter(([, name]) => body.includes('@' + name)).map(([id]) => id)
      return addComment(taskId, body.trim(), replyTo?.id ?? null, ids)
    },
    onSuccess: () => { setBody(''); setMentions({}); setReplyTo(null); refresh() },
    onError: e => toast(errMsg(e), 'error'),
  })
  const submit = (e: FormEvent) => { e.preventDefault(); if (body.trim()) add.mutate() }

  const all = list.data ?? []
  const roots = all.filter(c => !c.parent_id)
  const people = members.filter(m => m.status === 'active' && m.user_id && m.user_id !== userId)

  return (
    <div className="dash-card p-4">
      <QueryState loading={list.isLoading} error={list.error} onRetry={() => list.refetch()} empty={all.length === 0} emptyText="Пока нет сообщений" emptyHint="Начните обсуждение ниже.">
        <ul className="space-y-4" data-testid="comments">
          {roots.map(c => (
            <li key={c.id}>
              <Comment c={c} onReply={() => setReplyTo(c)} refresh={refresh} />
              <ul className="ml-9 mt-2 space-y-3 border-l border-[var(--d-line)] pl-3">
                {all.filter(r => r.parent_id === c.id).map(r => <li key={r.id}><Comment c={r} refresh={refresh} /></li>)}
              </ul>
            </li>
          ))}
        </ul>
      </QueryState>

      <form onSubmit={submit} className="mt-4 space-y-2 border-t border-[var(--d-line)] pt-4">
        {replyTo && (
          <p className="dash-muted flex items-center gap-2 text-xs">
            Ответ для {byUser(replyTo.author_id)?.name ?? 'участника'}
            <button type="button" className="underline" onClick={() => setReplyTo(null)}>отмена</button>
          </p>
        )}
        <textarea className="dash-input" aria-label="Новый комментарий" placeholder="Написать комментарий…" value={body} onChange={e => setBody(e.target.value)} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <select className="dash-input !min-h-8 !w-auto text-xs" aria-label="Упомянуть участника" value=""
            onChange={e => {
              const m = people.find(p => p.user_id === e.target.value)
              if (!m) return
              setMentions(x => ({ ...x, [m.user_id!]: m.name }))
              setBody(b => `${b}${b && !b.endsWith(' ') ? ' ' : ''}@${m.name} `)
            }}>
            <option value="">@ Упомянуть…</option>
            {people.map(p => <option key={p.id} value={p.user_id!}>{p.name}</option>)}
          </select>
          <button className="dash-btn dash-btn-sm" disabled={add.isPending || !body.trim()}>{add.isPending ? 'Отправляем…' : 'Отправить'}</button>
        </div>
      </form>
    </div>
  )
}

function Comment({ c, onReply, refresh }: { c: TaskComment; onReply?: () => void; refresh: () => void }) {
  const { byUser, userId } = useWorkspace()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(c.body)
  const mine = c.author_id === userId && !c.deleted_at
  const author = byUser(c.author_id)

  const save = useMutation({
    mutationFn: () => editComment(c.id, text.trim()),
    onSuccess: () => { setEditing(false); refresh() },
    onError: e => toast(errMsg(e), 'error'),
  })
  const del = useMutation({
    mutationFn: () => deleteComment(c.id),
    onSuccess: refresh,
    onError: e => toast(errMsg(e), 'error'),
  })

  return (
    <article className="flex gap-3" data-testid="comment">
      <Avatar member={author} size={28} />
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline gap-x-2 text-xs">
          <b className="text-sm">{author?.name ?? 'Участник'}</b>
          <time className="dash-muted" dateTime={c.created_at} title={fmtDateTime(c.created_at)}>{timeAgo(c.created_at)}</time>
          {c.edited_at && <span className="dash-muted">(изменено)</span>}
        </header>
        {editing ? (
          <form className="mt-1 space-y-2" onSubmit={e => { e.preventDefault(); if (text.trim()) save.mutate() }}>
            <textarea className="dash-input" aria-label="Текст комментария" value={text} onChange={e => setText(e.target.value)} />
            <div className="flex gap-2">
              <button className="dash-btn dash-btn-sm" disabled={save.isPending}>Сохранить</button>
              <button type="button" className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => { setEditing(false); setText(c.body) }}>Отмена</button>
            </div>
          </form>
        ) : (
          <p className={`mt-0.5 whitespace-pre-wrap text-sm ${c.deleted_at ? 'dash-muted italic' : ''}`}>{c.body}</p>
        )}
        {!editing && !c.deleted_at && (
          <div className="mt-1 flex gap-3 text-xs dash-muted">
            {onReply && <button className="inline-flex items-center gap-1 hover:text-[var(--d-text)]" onClick={onReply}><Reply className="h-3 w-3" aria-hidden />Ответить</button>}
            {mine && <button className="inline-flex items-center gap-1 hover:text-[var(--d-text)]" onClick={() => setEditing(true)}><Pencil className="h-3 w-3" aria-hidden />Изменить</button>}
            {mine && <button className="inline-flex items-center gap-1 hover:text-[var(--d-text)]" onClick={() => confirm('Удалить комментарий?') && del.mutate()}><Trash2 className="h-3 w-3" aria-hidden />Удалить</button>}
          </div>
        )}
      </div>
    </article>
  )
}
