import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ArrowLeft, Link2, Pencil, Plus, X } from 'lucide-react'
import {
  archiveModule, createModule, fetchModuleTasks, fetchModules, fetchReleases, fetchTasks, linkTask, unlinkTask, updateModule,
} from '../api'
import { useWorkspace } from '../auth'
import { buildTree, flatten, moduleKind, readiness } from '../map'
import { EMPTY_MODULE, ModuleForm, ModuleStatusChip, ReadinessBar } from '../mapParts'
import { fmtDateTime } from '../meta'
import { Avatar, Modal, QueryState, errMsg, useToast } from '../ui'
import Md from '../Md'
import { PriorityChip, StatusChip } from '../taskParts'

export default function ModuleDetail() {
  const { id = '' } = useParams()
  const { workspace, project, isAdmin, byUser } = useWorkspace()
  const qc = useQueryClient()
  const nav = useNavigate()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [pick, setPick] = useState('')

  const modules = useQuery({ queryKey: ['modules', workspace.id], queryFn: () => fetchModules(workspace.id) })
  const tasks = useQuery({ queryKey: ['module-tasks', id], queryFn: () => fetchModuleTasks(id) })
  const projectTasks = useQuery({ queryKey: ['tasks', project.id, { sort: 'newest' }], queryFn: () => fetchTasks(project.id, { sort: 'newest' }) })
  const releases = useQuery({ queryKey: ['releases', workspace.id], queryFn: () => fetchReleases(workspace.id) })

  const all = modules.data ?? []
  const m = all.find(x => x.id === id)
  const tree = buildTree(all)
  const node = flatten(tree).find(n => n.m.id === id)
  const parent = m?.parent_id ? all.find(x => x.id === m.parent_id) : undefined
  const release = m?.release_code != null ? releases.data?.find(r => r.version_code === m.release_code) : undefined
  const linked = tasks.data ?? []
  const candidates = (projectTasks.data ?? []).filter(t => !linked.some(l => l.id === t.id))

  const refresh = () => { void qc.invalidateQueries({ queryKey: ['modules'] }); void qc.invalidateQueries({ queryKey: ['module-task-counts'] }) }
  const save = useMutation({
    mutationFn: (v: Parameters<typeof updateModule>[1]) => updateModule(id, v),
    onSuccess: () => { refresh(); setEditing(false); toast('Сохранено') },
    onError: e => toast(errMsg(e), 'error'),
  })
  const addChild = useMutation({
    mutationFn: (v: Parameters<typeof createModule>[1]) => createModule(workspace.id, v),
    onSuccess: () => { refresh(); setAdding(false); toast('Добавлено') },
    onError: e => toast(errMsg(e), 'error'),
  })
  const archive = useMutation({
    mutationFn: () => archiveModule(id),
    onSuccess: () => { refresh(); toast('Узел убран в архив'); nav('/dashboard/map') },
    onError: e => toast(errMsg(e), 'error'),
  })
  const link = useMutation({
    mutationFn: (taskId: string) => linkTask(id, taskId),
    onSuccess: () => { setPick(''); void qc.invalidateQueries({ queryKey: ['module-tasks', id] }); refresh() },
    onError: e => toast(errMsg(e), 'error'),
  })
  const unlink = useMutation({
    mutationFn: (taskId: string) => unlinkTask(id, taskId),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['module-tasks', id] }); refresh() },
    onError: e => toast(errMsg(e), 'error'),
  })

  return (
    <QueryState loading={modules.isLoading} error={modules.error} onRetry={() => modules.refetch()} empty={!m} emptyText="Узел не найден">
      {m && node && (
        <>
          <Link to="/dashboard/map" className="dash-muted mb-3 inline-flex items-center gap-1 text-sm hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Карта приложения
          </Link>
          <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="dash-label">{moduleKind(m.kind)}{parent && <> · в «<Link to={`/dashboard/map/${parent.id}`} className="underline">{parent.name}</Link>»</>}</div>
              <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">{m.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ModuleStatusChip status={m.status} />
                {release && <span className="dash-chip">с версии {release.version_name} · #{release.version_code}</span>}
                {m.repo_path && <code className="dash-chip font-mono">{m.repo_path}</code>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="dash-btn dash-btn-ghost" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" aria-hidden /> Изменить</button>
              {isAdmin && <button className="dash-btn dash-btn-ghost" disabled={archive.isPending}
                onClick={() => { if (confirm(`Убрать «${m.name}» в архив вместе с вложенными?`)) archive.mutate() }}>
                <Archive className="h-4 w-4" aria-hidden /> В архив</button>}
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 space-y-4 lg:col-span-2">
              <section className="dash-card p-4" aria-label="Описание">
                <h2 className="dash-label mb-2">Описание</h2>
                {m.description.trim() ? <Md>{m.description}</Md> : <p className="dash-muted text-sm">Описание не заполнено</p>}
              </section>

              <section className="dash-card p-4" aria-label="Состав">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="dash-label">Состав · {node.children.length}</h2>
                  <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" aria-hidden /> Вложенный узел</button>
                </div>
                {node.children.length === 0 ? <p className="dash-muted text-sm">Внутри ничего нет</p> : (
                  <ul>
                    {node.children.map(c => (
                      <li key={c.m.id} className="dash-row flex items-center gap-3 py-2">
                        <Link to={`/dashboard/map/${c.m.id}`} className="min-w-0 flex-1 truncate hover:underline">{c.m.name}</Link>
                        {c.children.length > 0 && <div className="hidden w-28 sm:block"><ReadinessBar value={readiness(c)} /></div>}
                        <ModuleStatusChip status={c.m.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="dash-card p-4" aria-label="Задачи">
                <h2 className="dash-label mb-3">Задачи · {linked.length}</h2>
                <div className="mb-3 flex gap-2">
                  <select className="dash-input" value={pick} onChange={e => setPick(e.target.value)} aria-label="Привязать задачу">
                    <option value="">Привязать задачу…</option>
                    {candidates.map(t => <option key={t.id} value={t.id}>#{t.num} {t.title}</option>)}
                  </select>
                  <button className="dash-btn" disabled={!pick || link.isPending} onClick={() => link.mutate(pick)}><Link2 className="h-4 w-4" aria-hidden /> Привязать</button>
                </div>
                <QueryState loading={tasks.isLoading} error={tasks.error} onRetry={() => tasks.refetch()} empty={linked.length === 0}
                  emptyText="Задач нет" emptyHint="Привяжите задачи, которые двигают этот узел вперёд.">
                  <ul>
                    {linked.map(t => (
                      <li key={t.id} className="dash-row flex flex-wrap items-center gap-2 py-2">
                        <Link to={`/dashboard/tasks/${t.id}`} className="min-w-0 flex-1 truncate hover:underline"><span className="dash-muted">#{t.num}</span> {t.title}</Link>
                        <PriorityChip priority={t.priority} />
                        <StatusChip status={t.status} />
                        <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => unlink.mutate(t.id)} aria-label={`Отвязать задачу ${t.num}`}><X className="h-3.5 w-3.5" aria-hidden /></button>
                      </li>
                    ))}
                  </ul>
                </QueryState>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="dash-card p-4" aria-label="Сводка">
                <h2 className="dash-label mb-3">Сводка</h2>
                {node.children.length > 0 && <div className="mb-4"><div className="dash-muted mb-1 text-xs">Готовность по составу</div><ReadinessBar value={readiness(node)} /></div>}
                <dl className="space-y-3 text-sm">
                  <div><dt className="dash-muted text-xs">Ответственный</dt>
                    <dd className="mt-1 flex items-center gap-2">{byUser(m.owner_id) ? <><Avatar member={byUser(m.owner_id)} size={22} />{byUser(m.owner_id)!.name}</> : <span className="dash-muted">не назначен</span>}</dd></div>
                  <div><dt className="dash-muted text-xs">Обновлено</dt><dd className="mt-1">{fmtDateTime(m.updated_at)}</dd></div>
                </dl>
              </section>
            </aside>
          </div>

          <Modal open={editing} onClose={() => setEditing(false)} title="Изменить узел">
            <ModuleForm initial={{ parent_id: m.parent_id, kind: m.kind, name: m.name, description: m.description, status: m.status, owner_id: m.owner_id, release_code: m.release_code, repo_path: m.repo_path }}
              all={all} selfId={m.id} submitLabel="Сохранить" busy={save.isPending} onSubmit={v => save.mutate(v)} onCancel={() => setEditing(false)} />
          </Modal>
          <Modal open={adding} onClose={() => setAdding(false)} title="Вложенный узел">
            <ModuleForm initial={{ ...EMPTY_MODULE, parent_id: m.id }} all={all} submitLabel="Добавить" busy={addChild.isPending}
              onSubmit={v => addChild.mutate(v)} onCancel={() => setAdding(false)} />
          </Modal>
        </>
      )}
    </QueryState>
  )
}
