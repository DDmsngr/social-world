import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchReleases } from './api'
import { useWorkspace } from './auth'
import { MODULE_KINDS, MODULE_STATUSES, descendantIds, moduleStatus } from './map'
import type { AppModule, ModuleInput, ModuleKind, ModuleStatus } from './types'
import { Field } from './ui'

export const EMPTY_MODULE: ModuleInput = {
  parent_id: null, kind: 'feature', name: '', description: '', status: 'idea', owner_id: null, release_code: null, repo_path: '',
}

export function ModuleStatusChip({ status }: { status: ModuleStatus }) {
  const s = moduleStatus(status)
  return (
    <span className="dash-chip" style={{ color: s.color, borderColor: `${s.color}66` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} aria-hidden />{s.label}
    </span>
  )
}

export function ReadinessBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2" role="img" aria-label={label ?? `Готовность ${pct}%`}>
      <div className="h-1.5 w-full min-w-12 overflow-hidden rounded-full bg-[var(--d-bg)]">
        <div className="h-full rounded-full bg-gradient-to-r from-[var(--d-primary)] to-[var(--d-champagne)]" style={{ width: `${pct}%` }} />
      </div>
      <span className="dash-muted w-9 text-right text-xs tabular-nums">{pct}%</span>
    </div>
  )
}

export function ModuleForm({ initial, all, selfId, submitLabel, busy, onSubmit, onCancel }: {
  initial: ModuleInput
  all: AppModule[]
  selfId?: string
  submitLabel: string
  busy: boolean
  onSubmit: (v: ModuleInput) => void
  onCancel?: () => void
}) {
  const { members, workspace } = useWorkspace()
  const [v, setV] = useState<ModuleInput>(initial)
  const releases = useQuery({ queryKey: ['releases', workspace.id], queryFn: () => fetchReleases(workspace.id) })
  const blocked = selfId ? descendantIds(all, selfId) : new Set<string>()
  const parents = all.filter(m => !blocked.has(m.id))
  const people = members.filter(m => m.status === 'active' && m.user_id)
  const set = <K extends keyof ModuleInput>(k: K, x: ModuleInput[K]) => setV(p => ({ ...p, [k]: x }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!v.name.trim()) return
    onSubmit({ ...v, name: v.name.trim(), description: v.description.trim(), repo_path: v.repo_path.trim() })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Название">
        <input className="dash-input" value={v.name} onChange={e => set('name', e.target.value)} required maxLength={120}
          placeholder="Например: Ответ свайпом" autoFocus />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Тип">
          <select className="dash-input" value={v.kind} onChange={e => set('kind', e.target.value as ModuleKind)}>
            {MODULE_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </Field>
        <Field label="Статус">
          <select className="dash-input" value={v.status} onChange={e => set('status', e.target.value as ModuleStatus)}>
            {MODULE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Входит в">
          <select className="dash-input" value={v.parent_id ?? ''} onChange={e => set('parent_id', e.target.value || null)}>
            <option value="">— корень карты —</option>
            {parents.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
        <Field label="Ответственный">
          <select className="dash-input" value={v.owner_id ?? ''} onChange={e => set('owner_id', e.target.value || null)}>
            <option value="">— не назначен —</option>
            {people.map(m => <option key={m.id} value={m.user_id!}>{m.name}</option>)}
          </select>
        </Field>
        <Field label="Появился в сборке">
          <select className="dash-input" value={v.release_code ?? ''} onChange={e => set('release_code', e.target.value ? Number(e.target.value) : null)}>
            <option value="">— ещё не выпущен —</option>
            {(releases.data ?? []).map(r => <option key={r.id} value={r.version_code}>{r.version_name} · сборка {r.version_code}</option>)}
          </select>
        </Field>
        <Field label="Путь в коде">
          <input className="dash-input font-mono" value={v.repo_path} onChange={e => set('repo_path', e.target.value)} placeholder="lib/features/chat" />
        </Field>
      </div>
      <Field label="Описание (Markdown)">
        <textarea className="dash-input" value={v.description} onChange={e => set('description', e.target.value)}
          placeholder="Что делает, какие есть ограничения, ссылки на документы" />
      </Field>
      <div className="flex gap-2 pt-1">
        <button className="dash-btn" type="submit" disabled={busy || !v.name.trim()}>{submitLabel}</button>
        {onCancel && <button className="dash-btn dash-btn-ghost" type="button" onClick={onCancel}>Отмена</button>}
      </div>
    </form>
  )
}
