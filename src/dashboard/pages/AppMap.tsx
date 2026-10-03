import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Network, Plus, Sparkles } from 'lucide-react'
import { createModule, fetchModuleTaskCounts, fetchModules, insertModules } from '../api'
import { useWorkspace } from '../auth'
import { MODULE_STATUSES, buildTree, countByStatus, moduleKind, readiness, templateRows, type MapNode } from '../map'
import { EMPTY_MODULE, ModuleForm, ModuleStatusChip, ReadinessBar } from '../mapParts'
import type { ModuleStatus } from '../types'
import { Avatar, Modal, PageHeader, QueryState, errMsg, useToast } from '../ui'

type Counts = Record<string, { open: number; done: number }>

function Row({ n, collapsed, toggle, counts, byUser }: {
  n: MapNode; collapsed: Set<string>; toggle: (id: string) => void; counts: Counts
  byUser: ReturnType<typeof useWorkspace>['byUser']
}) {
  const has = n.children.length > 0
  const open = !collapsed.has(n.m.id)
  const c = counts[n.m.id]
  const owner = byUser(n.m.owner_id)
  return (
    <>
      <li className="dash-row flex items-center gap-2 py-2" style={{ paddingLeft: n.depth * 20 }} data-testid="map-node">
        <button className="dash-btn dash-btn-ghost dash-btn-sm !min-h-7 !w-7 !px-0" onClick={() => toggle(n.m.id)}
          disabled={!has} aria-label={open ? 'Свернуть' : 'Развернуть'} aria-expanded={has ? open : undefined}
          style={{ visibility: has ? 'visible' : 'hidden' }}>
          <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden />
        </button>
        <Link to={`/dashboard/map/${n.m.id}`} className="min-w-0 flex-1 hover:underline">
          <span className="font-medium">{n.m.name}</span>
          <span className="dash-muted ml-2 text-xs">{moduleKind(n.m.kind)}</span>
        </Link>
        {has && <div className="hidden w-32 sm:block"><ReadinessBar value={readiness(n)} /></div>}
        {c && (c.open > 0 || c.done > 0) && (
          <span className="dash-muted hidden text-xs tabular-nums md:inline" title="Открытые / закрытые задачи">{c.open}/{c.done}</span>
        )}
        {n.m.release_code != null && <span className="dash-chip hidden font-mono md:inline-flex">#{n.m.release_code}</span>}
        {owner && <span className="hidden sm:inline"><Avatar member={owner} size={22} /></span>}
        <ModuleStatusChip status={n.m.status} />
      </li>
      {has && open && n.children.map(ch => <Row key={ch.m.id} n={ch} collapsed={collapsed} toggle={toggle} counts={counts} byUser={byUser} />)}
    </>
  )
}

export default function AppMap() {
  const { workspace, isAdmin, byUser } = useWorkspace()
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const list = useQuery({ queryKey: ['modules', workspace.id], queryFn: () => fetchModules(workspace.id) })
  const taskCounts = useQuery({ queryKey: ['module-task-counts', workspace.id], queryFn: () => fetchModuleTaskCounts(workspace.id) })
  const all = list.data ?? []

  const status = sp.get('status') as ModuleStatus | null
  const q = (sp.get('q') ?? '').trim().toLowerCase()
  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(sp)
    if (v) n.set(k, v); else n.delete(k)
    setSp(n, { replace: true })
  }

  const filtering = !!status || !!q
  // при фильтре оставляем совпавшие узлы вместе с цепочкой предков, чтобы был виден контекст
  const visible = useMemo(() => {
    if (!filtering) return all
    const byId = new Map(all.map(m => [m.id, m]))
    const keep = new Set<string>()
    for (const m of all) {
      if ((status && m.status !== status) || (q && ![m.name, m.description, m.repo_path].some(s => s.toLowerCase().includes(q)))) continue
      for (let x: typeof m | undefined = m; x && !keep.has(x.id); x = x.parent_id ? byId.get(x.parent_id) : undefined) keep.add(x.id)
    }
    return all.filter(m => keep.has(m.id))
  }, [all, filtering, status, q])

  const tree = useMemo(() => buildTree(visible), [visible])
  const fullTree = useMemo(() => buildTree(all), [all])
  const total = fullTree.length ? fullTree.reduce((a, r) => a + readiness(r), 0) / fullTree.length : 0
  const counts = countByStatus(all)

  const toggle = (id: string) => setCollapsed(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const create = useMutation({
    mutationFn: (v: Parameters<typeof createModule>[1]) => createModule(workspace.id, v),
    onSuccess: m => { void qc.invalidateQueries({ queryKey: ['modules'] }); setCreating(false); toast('Добавлено в карту'); nav(`/dashboard/map/${m.id}`) },
    onError: e => toast(errMsg(e), 'error'),
  })
  const seed = useMutation({
    mutationFn: () => insertModules(templateRows(workspace.id)),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['modules'] }); toast('Карта заполнена по модулям приложения') },
    onError: e => toast(errMsg(e), 'error'),
  })

  return (
    <>
      <PageHeader title="Карта приложения"
        sub="Из чего состоит Chawo: модули, экраны и функции со статусом готовности, ответственными и задачами."
        actions={<button className="dash-btn" onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden /> Добавить</button>} />

      {all.length > 0 && (
        <div className="dash-card mb-4 p-4">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="dash-label">Готовность приложения</span>
            <span className="text-sm tabular-nums">{all.length} узлов</span>
          </div>
          <ReadinessBar value={total} />
          <div className="mt-3 flex flex-wrap gap-2">
            {MODULE_STATUSES.map(s => (
              <button key={s.id} onClick={() => setParam('status', status === s.id ? '' : s.id)} aria-pressed={status === s.id}
                className={`dash-chip cursor-pointer ${status === s.id ? 'dash-tab-active' : ''}`}
                style={status === s.id ? undefined : { color: s.color, borderColor: `${s.color}66` }}>
                {s.label} · {counts[s.id]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <input className="dash-input max-w-md" type="search" value={sp.get('q') ?? ''} onChange={e => setParam('q', e.target.value)}
          placeholder="Название, описание, путь в коде" aria-label="Поиск по карте" />
      </div>

      <QueryState loading={list.isLoading} error={list.error} onRetry={() => list.refetch()} empty={all.length === 0}
        emptyText="Карта пока пуста" emptyHint="Добавьте первый модуль или начните с шаблона по текущим разделам приложения.">
        {tree.length === 0 ? <p className="dash-muted py-8 text-center text-sm">Ничего не найдено</p> : (
          <ul className="dash-card px-3 py-1" data-testid="app-map">
            {tree.map(n => <Row key={n.m.id} n={n} collapsed={collapsed} toggle={toggle} counts={taskCounts.data ?? {}} byUser={byUser} />)}
          </ul>
        )}
      </QueryState>

      {all.length === 0 && !list.isLoading && !list.error && (
        <div className="mt-2 flex justify-center gap-2">
          {isAdmin && (
            <button className="dash-btn dash-btn-ghost" disabled={seed.isPending} onClick={() => seed.mutate()}>
              <Sparkles className="h-4 w-4" aria-hidden /> Заполнить по шаблону Chawo
            </button>
          )}
          <button className="dash-btn" onClick={() => setCreating(true)}><Network className="h-4 w-4" aria-hidden /> Добавить вручную</button>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Новый узел карты">
        <ModuleForm initial={EMPTY_MODULE} all={all} submitLabel="Добавить" busy={create.isPending}
          onSubmit={v => create.mutate(v)} onCancel={() => setCreating(false)} />
      </Modal>
    </>
  )
}
