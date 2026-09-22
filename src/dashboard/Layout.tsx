import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, FolderOpen, LayoutDashboard, ListChecks, LogOut, MessageSquare, Search, Users } from 'lucide-react'
import { signOut, useWorkspace } from './auth'
import { fetchNotifications, fetchUnread } from './api'
import { Avatar } from './ui'
import ChangePassword from './ChangePassword'

const NAV = [
  { to: '/dashboard', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/dashboard/tasks', label: 'Задачи', icon: ListChecks },
  { to: '/dashboard/team', label: 'Команда', icon: Users },
  { to: '/dashboard/files', label: 'Файлы', icon: FolderOpen },
  { to: '/dashboard/messages', label: 'Сообщения', icon: MessageSquare },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { workspace, project, me } = useWorkspace()
  const nav = useNavigate()
  const loc = useLocation()

  const unread = useQuery({ queryKey: ['unread', workspace.id], queryFn: () => fetchUnread(workspace.id), refetchInterval: 60_000 })
  const notes = useQuery({ queryKey: ['notifications', workspace.id], queryFn: () => fetchNotifications(workspace.id), refetchInterval: 60_000 })
  const msgBadge = Object.values(unread.data ?? {}).reduce((a, b) => a + b, 0)
  const noteBadge = (notes.data ?? []).filter(n => !n.read_at).length

  const [q, setQ] = useState('')
  useEffect(() => { if (!loc.pathname.endsWith('/search')) setQ('') }, [loc.pathname])
  // дебаунс: поиск уходит в БД только после паузы в наборе
  useEffect(() => {
    if (q.trim().length < 2) return
    const t = setTimeout(() => nav(`/dashboard/search?q=${encodeURIComponent(q.trim())}`, { replace: loc.pathname.endsWith('/search') }), 350)
    return () => clearTimeout(t)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const badge = (to: string) => (to.endsWith('/messages') && msgBadge > 0 ? msgBadge : 0)

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-[var(--d-line)] bg-[var(--d-surface)] p-4 md:flex">
        <div className="mb-6 px-2">
          <div className="dash-label">{workspace.name}</div>
          <div className="mt-0.5 text-base font-semibold">Team Workspace</div>
          <div className="dash-muted text-xs">{project.name}</div>
        </div>
        <nav aria-label="Основная навигация" className="flex flex-1 flex-col gap-1">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${isActive
                ? 'bg-[var(--d-primary)] text-white' : 'text-[var(--d-muted)] hover:bg-[var(--d-raised)] hover:text-[var(--d-text)]'}`}>
              <n.icon className="h-4 w-4" aria-hidden />
              <span className="flex-1">{n.label}</span>
              {badge(n.to) > 0 && (
                <span className="rounded-full bg-[var(--d-tint)] px-1.5 text-[11px] font-bold text-[#151417]"
                  aria-label={`${badge(n.to)} непрочитанных`}>{badge(n.to)}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 border-t border-[var(--d-line)] pt-3">
          <Avatar member={me} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{me.name}</div>
            <div className="dash-muted truncate text-xs">{me.role}</div>
          </div>
          <ChangePassword />
          <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => void signOut()} aria-label="Выйти" title="Выйти">
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="dash-safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--d-line)] bg-[var(--d-bg)]/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="text-sm font-semibold md:hidden">{workspace.name}</div>
          <form role="search" className="relative ml-auto w-full max-w-md" onSubmit={e => { e.preventDefault(); if (q.trim()) nav(`/dashboard/search?q=${encodeURIComponent(q.trim())}`) }}>
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 dash-muted" aria-hidden />
            <input className="dash-input pl-9" type="search" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Поиск по задачам, людям, сообщениям, файлам" aria-label="Глобальный поиск" />
          </form>
          <NavLink to="/dashboard/notifications" className="dash-btn dash-btn-ghost relative !px-3"
            aria-label={noteBadge ? `Уведомления, непрочитанных: ${noteBadge}` : 'Уведомления'}>
            <Bell className="h-4 w-4" aria-hidden />
            {noteBadge > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-[var(--d-tint)] px-1.5 text-[10px] font-bold text-[#151417]">{noteBadge}</span>
            )}
          </NavLink>
          <button className="dash-btn dash-btn-ghost !px-3 md:hidden" onClick={() => void signOut()} aria-label="Выйти">
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 md:px-6 md:pb-10">{children}</main>

        <nav aria-label="Навигация" className="dash-safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--d-line)] bg-[var(--d-surface)] md:hidden">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${isActive ? 'text-[var(--d-tint)]' : 'text-[var(--d-muted)]'}`}>
              <n.icon className="h-5 w-5" aria-hidden />
              {n.label}
              {badge(n.to) > 0 && <span className="absolute right-[22%] top-1.5 rounded-full bg-[var(--d-tint)] px-1.5 text-[10px] font-bold text-[#151417]">{badge(n.to)}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
