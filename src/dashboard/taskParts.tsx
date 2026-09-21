import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, MessageSquare, Paperclip } from 'lucide-react'
import { createTask, updateTask, type TaskPatch } from './api'
import { useWorkspace } from './auth'
import { PRIORITIES, STATUSES, fmtDate, isOverdue, priorityMeta, statusMeta, todayIso } from './meta'
import type { Priority, Task, TaskStatus } from './types'
import { Avatar, Field, Modal, errMsg, useToast } from './ui'

export function StatusChip({ status }: { status: TaskStatus }) {
  const m = statusMeta(status)
  return (
    <span className="dash-chip" style={{ color: m.color, borderColor: m.color + '66' }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} aria-hidden />{m.label}
    </span>
  )
}

export function PriorityChip({ priority }: { priority: Priority }) {
  const m = priorityMeta(priority)
  return <span className="dash-chip" style={{ color: m.color, borderColor: m.color + '66' }}>{m.label}</span>
}

export function DueLabel({ task }: { task: Pick<Task, 'due_date' | 'status'> }) {
  if (!task.due_date) return null
  const late = isOverdue(task.due_date, task.status)
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${late ? 'font-semibold text-[#e5566d]' : 'dash-muted'}`}>
      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
      {fmtDate(task.due_date)}{late && <span className="sr-only"> (просрочено)</span>}
    </span>
  )
}

export function LabelChips({ ids }: { ids: string[] }) {
  const { labels } = useWorkspace()
  return (
    <>
      {ids.map(id => labels.find(l => l.id === id)).filter(Boolean).map(l => (
        <span key={l!.id} className="dash-chip" style={{ color: l!.color, borderColor: l!.color + '66' }}>{l!.name}</span>
      ))}
    </>
  )
}

export function TaskCardBody({ task }: { task: Task }) {
  const { byUser } = useWorkspace()
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <Link to={`/dashboard/tasks/${task.id}`} className="text-sm font-medium leading-snug hover:underline">
          {task.title}
        </Link>
        <Avatar member={byUser(task.assignee_id)} size={24} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityChip priority={task.priority} />
        <LabelChips ids={task.label_ids} />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <DueLabel task={task} />
        {task.comment_count > 0 && (
          <span className="dash-muted inline-flex items-center gap-1 text-xs" title="Комментарии">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />{task.comment_count}
            <span className="sr-only"> комментариев</span>
          </span>
        )}
        {task.attachment_count > 0 && (
          <span className="dash-muted inline-flex items-center gap-1 text-xs" title="Файлы">
            <Paperclip className="h-3.5 w-3.5" aria-hidden />{task.attachment_count}
            <span className="sr-only"> файлов</span>
          </span>
        )}
      </div>
    </>
  )
}

/** Правка задачи: сразу обновляет все закешированные списки, при отказе БД откатывает. */
export function useTaskUpdate() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TaskPatch }) => updateTask(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const snapshot = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] })
      qc.setQueriesData<Task[]>({ queryKey: ['tasks'] }, old => old?.map(t => (t.id === id ? { ...t, ...patch } : t)))
      qc.setQueryData<Task | null>(['task', id], old => (old ? { ...old, ...patch } : old))
      return { snapshot }
    },
    onError: (e, _v, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data))
      toast(errMsg(e), 'error')
    },
    onSettled: (_d, _e, v) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task', v.id] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function CreateTaskModal({ open, onClose, initialStatus = 'todo' }: {
  open: boolean; onClose: () => void; initialStatus?: TaskStatus
}) {
  const { workspace, project, members } = useWorkspace()
  const qc = useQueryClient()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>(initialStatus)
  const [priority, setPriority] = useState<Priority>('medium')
  const [assignee, setAssignee] = useState('')
  const [due, setDue] = useState('')

  const create = useMutation({
    mutationFn: () => createTask({
      workspace_id: workspace.id, project_id: project.id, title: title.trim(), description,
      status, priority, assignee_id: assignee || null, due_date: due || null,
    }),
    onSuccess: t => {
      toast(`Задача «${t.title}» создана`)
      setTitle(''); setDescription(''); setAssignee(''); setDue(''); setPriority('medium')
      for (const k of ['tasks', 'stats', 'activity', 'notifications']) qc.invalidateQueries({ queryKey: [k] })
      onClose()
    },
    onError: e => toast(errMsg(e), 'error'),
  })

  const submit = (e: FormEvent) => { e.preventDefault(); if (title.trim()) create.mutate() }
  const assignable = members.filter(m => m.status === 'active' && m.user_id)

  return (
    <Modal open={open} onClose={onClose} title="Новая задача">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Название">
          <input className="dash-input" required autoFocus value={title} onChange={e => setTitle(e.target.value)} />
        </Field>
        <Field label="Описание">
          <textarea className="dash-input" value={description} onChange={e => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Статус">
            <select className="dash-input" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Приоритет">
            <select className="dash-input" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Исполнитель">
            <select className="dash-input" value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="">Не назначен</option>
              {assignable.map(m => <option key={m.id} value={m.user_id!}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Срок">
            <input className="dash-input" type="date" min={todayIso()} value={due} onChange={e => setDue(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="dash-btn dash-btn-ghost" onClick={onClose}>Отмена</button>
          <button className="dash-btn" disabled={create.isPending || !title.trim()}>
            {create.isPending ? 'Создаём…' : 'Создать задачу'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
