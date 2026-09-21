import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, markNotifications } from '../api'
import { useWorkspace } from '../auth'
import { timeAgo } from '../meta'
import type { Notification } from '../types'
import { PageHeader, QueryState, errMsg, useToast } from '../ui'

export default function Notifications() {
  const { workspace } = useWorkspace()
  const qc = useQueryClient()
  const nav = useNavigate()
  const toast = useToast()
  const list = useQuery({ queryKey: ['notifications', workspace.id], queryFn: () => fetchNotifications(workspace.id) })
  const mark = useMutation({
    mutationFn: markNotifications,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: e => toast(errMsg(e), 'error'),
  })
  const unread = (list.data ?? []).filter(n => !n.read_at)

  const open = (n: Notification) => {
    if (!n.read_at) mark.mutate([n.id])
    nav('/dashboard' + n.link)
  }

  return (
    <>
      <PageHeader title="Уведомления" sub={unread.length ? `${unread.length} непрочитанных` : 'Всё прочитано'}
        actions={unread.length > 0 && <button className="dash-btn dash-btn-ghost" onClick={() => mark.mutate(unread.map(n => n.id))}>Прочитать все</button>} />
      <div className="dash-card">
        <QueryState loading={list.isLoading} error={list.error} onRetry={() => list.refetch()} empty={list.data?.length === 0} emptyText="Уведомлений пока нет">
          <ul data-testid="notifications">
            {list.data?.map(n => (
              <li key={n.id} className="dash-row">
                <button className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--d-raised)]" onClick={() => open(n)}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-[var(--d-tint)]'}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${n.read_at ? 'dash-muted' : 'font-medium'}`}>{n.title}{!n.read_at && <span className="sr-only"> (не прочитано)</span>}</span>
                    <span className="dash-muted text-xs">{timeAgo(n.created_at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </QueryState>
      </div>
    </>
  )
}
