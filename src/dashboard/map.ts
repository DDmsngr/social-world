import type { AppModule, ModuleInput, ModuleKind, ModuleStatus } from './types'

export const MODULE_STATUSES: { id: ModuleStatus; label: string; color: string; weight: number }[] = [
  { id: 'idea', label: 'Идея', color: '#8a8587', weight: 0 },
  { id: 'planned', label: 'В плане', color: '#bba9af', weight: 0 },
  { id: 'in_dev', label: 'В разработке', color: '#d8b56a', weight: 0.4 },
  { id: 'beta', label: 'Бета', color: '#e89bba', weight: 0.75 },
  { id: 'live', label: 'Работает', color: '#75c9a5', weight: 1 },
  { id: 'deprecated', label: 'Выводится', color: '#e87878', weight: 1 },
]

export const MODULE_KINDS: { id: ModuleKind; label: string }[] = [
  { id: 'module', label: 'Модуль' },
  { id: 'screen', label: 'Экран' },
  { id: 'feature', label: 'Функция' },
  { id: 'service', label: 'Сервис' },
]

export const moduleStatus = (s: ModuleStatus) => MODULE_STATUSES.find(x => x.id === s)!
export const moduleKind = (k: ModuleKind) => MODULE_KINDS.find(x => x.id === k)!.label

export interface MapNode { m: AppModule; children: MapNode[]; depth: number }

/** Лес узлов: корни — без родителя (или с архивным/отсутствующим родителем). */
export function buildTree(items: AppModule[]): MapNode[] {
  const byParent = new Map<string | null, AppModule[]>()
  const ids = new Set(items.map(i => i.id))
  for (const m of items) {
    const key = m.parent_id && ids.has(m.parent_id) ? m.parent_id : null
    byParent.set(key, [...(byParent.get(key) ?? []), m])
  }
  const make = (m: AppModule, depth: number): MapNode => ({
    m, depth,
    children: (byParent.get(m.id) ?? [])
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, 'ru'))
      .map(c => make(c, depth + 1)),
  })
  return (byParent.get(null) ?? [])
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, 'ru'))
    .map(m => make(m, 0))
}

export function flatten(nodes: MapNode[]): MapNode[] {
  return nodes.flatMap(n => [n, ...flatten(n.children)])
}

/** Готовность узла 0..1: у листа — вес статуса, у родителя — среднее по листьям. */
export function readiness(n: MapNode): number {
  const leaves = flatten([n]).filter(x => x.children.length === 0)
  if (leaves.length === 0) return 0
  return leaves.reduce((a, l) => a + moduleStatus(l.m.status).weight, 0) / leaves.length
}

export function countByStatus(items: AppModule[]): Record<ModuleStatus, number> {
  const r: Record<ModuleStatus, number> = { idea: 0, planned: 0, in_dev: 0, beta: 0, live: 0, deprecated: 0 }
  for (const m of items) r[m.status]++
  return r
}

/** Id узла и всех его потомков — чтобы не дать выбрать потомка новым родителем. */
export function descendantIds(items: AppModule[], id: string): Set<string> {
  const out = new Set<string>([id])
  let grew = true
  while (grew) {
    grew = false
    for (const m of items) if (m.parent_id && out.has(m.parent_id) && !out.has(m.id)) { out.add(m.id); grew = true }
  }
  return out
}

// Стартовая карта Chawo по папкам lib/features приложения.
interface Tpl { name: string; kind: ModuleKind; status: ModuleStatus; repo?: string; children?: Tpl[]; description?: string }
const f = (name: string, status: ModuleStatus, description = ''): Tpl => ({ name, kind: 'feature', status, description })

export const MAP_TEMPLATE: Tpl[] = [
  { name: 'Вход и профиль', kind: 'module', status: 'live', repo: 'lib/features/auth', children: [
    f('Вход через VK ID', 'live'), f('Вход через Яндекс ID', 'live'), f('Вход по почте', 'live'),
    f('Подтверждение телефона', 'beta', 'Код по SMS, подтверждённый номер в профиле'),
    f('Профиль и Social Score', 'live'),
  ] },
  { name: 'Чат', kind: 'module', status: 'live', repo: 'lib/features/chat', children: [
    f('Личные и групповые чаты', 'live'), f('Ответ свайпом и пересылка', 'live'),
    f('Удаление у всех', 'live'), f('Отправка «без звука» и по расписанию', 'live'),
    f('Вложения: фото, видео, голосовые', 'live'), f('Реакции и стикеры', 'beta'),
    f('Настройки уведомлений чата', 'live'),
  ] },
  { name: 'Лента', kind: 'module', status: 'live', repo: 'lib/features/feed', children: [
    f('Посты с фото и видео', 'live'), f('Статьи с медиа в тексте', 'live'),
    f('Комментарии, дизлайки, «Свернуть»', 'live'), f('Лента города', 'live'),
  ] },
  { name: 'Каналы', kind: 'module', status: 'beta', repo: 'lib/features/channels', children: [
    f('Каналы-источники и подписки', 'beta'), f('Автоподбор постов (channel-feeder)', 'beta'),
  ] },
  { name: 'Pulse и карта', kind: 'module', status: 'beta', repo: 'lib/features/discover', children: [
    f('Карта с людьми рядом', 'beta'), f('События на карте', 'live'), f('Маршруты', 'live'),
    f('Квесты на карте', 'beta'), f('Потребности (needs)', 'in_dev'),
  ] },
  { name: 'События и маршруты', kind: 'module', status: 'live', repo: 'lib/features/events', children: [
    f('Создание события', 'live'), f('Участники: друзья первыми', 'live'),
  ] },
  { name: 'Рефералы и баллы', kind: 'module', status: 'planned', repo: 'lib/features/referrals', children: [
    f('Персональные ссылки и QR', 'planned'), f('Activity Points', 'planned', 'Журнал начислений на базе score_events'),
    f('Коды мест для бизнеса', 'live'),
  ] },
  { name: 'Уведомления', kind: 'module', status: 'live', repo: 'lib/features/notifications', children: [
    f('Push-уведомления', 'live'), f('Центр уведомлений', 'live'),
  ] },
  { name: 'Модерация', kind: 'module', status: 'beta', repo: 'lib/features/moderation', children: [
    f('Жалобы и очередь модерации', 'beta'),
  ] },
  { name: 'Платформа', kind: 'service', status: 'live', children: [
    { name: 'Бэкенд Supabase (Yandex Cloud)', kind: 'service', status: 'live', description: 'Self-hosted, 152-ФЗ' },
    { name: 'CI и автообновление APK', kind: 'service', status: 'live', repo: '.github/workflows/flutter-ci.yml' },
    { name: 'Аналитика', kind: 'service', status: 'idea', description: 'Система не выбрана (AppMetrica?)' },
  ] },
]

/** Развёртка шаблона в строки для вставки (id генерируются заранее, чтобы связать родителей). */
export function templateRows(workspaceId: string): (ModuleInput & { id: string; workspace_id: string; position: number })[] {
  const rows: (ModuleInput & { id: string; workspace_id: string; position: number })[] = []
  const walk = (list: Tpl[], parent: string | null) => list.forEach((t, i) => {
    const id = crypto.randomUUID()
    rows.push({
      id, workspace_id: workspaceId, parent_id: parent, kind: t.kind, name: t.name, description: t.description ?? '',
      status: t.status, owner_id: null, release_code: null, repo_path: t.repo ?? '', position: i,
    })
    if (t.children) walk(t.children, id)
  })
  walk(MAP_TEMPLATE, null)
  return rows
}
