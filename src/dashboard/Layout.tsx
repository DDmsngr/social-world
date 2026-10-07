import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bell, FolderOpen, LayoutDashboard, ListChecks, LogOut, Menu, MessageSquare, Network, Search, Settings, Smartphone, Users,
  type LucideIcon,
} from 'lucide-react'
import { signOut, useWorkspace } from './auth'
import { fetchNotifications, fetchUnread } from './api'
import { Avatar, Modal } from './ui'
import ChangePassword from './ChangePassword'

interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; mobile?: boolean }

// mobile: пункт попадает в нижнюю панель телефона, остальные — в «Ещё»
const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Обзор', icon: LayoutDashboard, end: true, mobile: true },
  { to: '/dashboard/tasks', label: 'Задачи', icon: ListChecks, mobile: true },
  { to: '/dashboard/messages', label: 'Сообщения', icon: MessageSquare, mobile: true },
  { to: '/dashboard/map', label: 'Карта', icon: Network },
  { to: '/dashboard/team', label: 'Команда', icon: Users },
  { to: '/dashboard/files', label: 'Файлы', icon: FolderOpen },
  { to: '/dashboard/releases', label: 'Релизы', icon: Smartphone },
  { to: '/dashboard/settings', label: 'Настройки', icon: Settings },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { workspace, project, me } = useWorkspace()
  const nav = useNavigate()
  const loc = useLocation()
  const [more, setMore] = useState(false)

  const unread = useQuery({ queryKey: ['unread', workspace.id], queryFn: () => fetchUnread(workspace.id), refetchInterval: 60_000 })
  const notes = useQuery({ queryKey: ['notifications', workspace.id], queryFn: () => fetchNotifications(workspace.id), refetchInterval: 60_000 })
  const msgBadge = Object.values(unread.data ?? {}).reduce((a, b) => a + b, 0)
  const noteBadge = (notes.data ?? []).filter(n => !n.read_at).length

  const [q, setQ] = useState('')
  useEffect(() => { if (!loc.pathname.endsWith('/search')) setQ('') }, [loc.pathname])
  useEffect(() => { setMore(false) }, [loc.pathname])
  // дебаунс: поиск уходит в БД только после паузы в наборе
  useEffect(() => {
    if (q.trim().length < 2) return
    const t = setTimeout(() => nav(`/dashboard/search?q=${encodeURIComponent(q.trim())}`, { replace: loc.pathname.endsWith('/search') }), 350)
    return () => clearTimeout(t)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const badge = (to: string) => (to.endsWith('/messages') && msgBadge > 0 ? msgBadge : 0)
  const moreActive = NAV.some(n => !n.mobile && loc.pathname.startsWith(n.to))

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-[var(--d-line)] bg-[var(--d-surface)] p-4 md:flex">
        <div className="mb-6 px-2">
          <div className="flex items-center gap-2.5">
            <span className="dash-logo" aria-hidden>C</span>
            <div className="min-w-0">
              <div className="font-instrument text-2xl leading-none tracking-tight">Chawo</div>
              <div className="dash-muted mt-1 truncate text-xs">{workspace.name} · {project.name}</div>
            </div>
          </div>
        </div>
        <nav aria-label="Основная навигация" className="flex flex-1 flex-col gap-1">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${isActive
                ? 'bg-gradient-to-r from-[var(--d-champagne)] to-[#efd9a6] font-semibold text-[#21151d] shadow-[0_6px_18px_-8px_rgba(230,201,138,.7)]' : 'text-[var(--d-muted)] hover:bg-[var(--d-raised)] hover:text-[var(--d-text)]'}`}>
              <n.icon className="h-4 w-4" aria-hidden />
              <span className="flex-1">{n.label}</span>
              {badge(n.to) > 0 && (
                <span className="rounded-full bg-[var(--d-tint)] px-1.5 text-[11px] font-bold text-[#21151d]"
                  aria-label={`${badge(n.to)} непрочитанных`}>{badge(n.to)}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 border-t border-[var(--d-line)] pt-3">
          <NavLink to="/dashboard/settings" className="flex min-w-0 flex-1 items-center gap-2 rounded-md hover:opacity-80" title="Настройки профиля">
            <Avatar member={me} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{me.name}</div>
              <div className="dash-muted truncate text-xs">{me.position || me.role}</div>
            </div>
          </NavLink>
          <ChangePassword />
          <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => void signOut()} aria-label="Выйти" title="Выйти">
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="dash-safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--d-line)] bg-[var(--d-bg)]/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="font-instrument text-xl md:hidden">Chawo</div>
          <form role="search" className="relative ml-auto w-full max-w-md" onSubmit={e => { e.preventDefault(); if (q.trim()) nav(`/dashboard/search?q=${encodeURIComponent(q.trim())}`) }}>
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 dash-muted" aria-hidden />
            <input className="dash-input pl-9" type="search" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Поиск по задачам, людям, сообщениям, файлам" aria-label="Глобальный поиск" />
          </form>
          <NavLink to="/dashboard/notifications" className="dash-btn dash-btn-ghost relative !px-3"
            aria-label={noteBadge ? `Уведомления, непрочитанных: ${noteBadge}` : 'Уведомления'}>
            <Bell className="h-4 w-4" aria-hidden />
            {noteBadge > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-[var(--d-tint)] px-1.5 text-[10px] font-bold text-[#21151d]">{noteBadge}</span>
            )}
          </NavLink>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 md:px-6 md:pb-10">{children}</main>

        <nav aria-label="Навигация" className="dash-safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--d-line)] bg-[var(--d-surface)] md:hidden">
          {NAV.filter(n => n.mobile).map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${isActive ? 'text-[var(--d-champagne)]' : 'text-[var(--d-muted)]'}`}>
              <n.icon className="h-5 w-5" aria-hidden />
              {n.label}
              {badge(n.to) > 0 && <span className="absolute right-[22%] top-1.5 rounded-full bg-[var(--d-tint)] px-1.5 text-[10px] font-bold text-[#21151d]">{badge(n.to)}</span>}
            </NavLink>
          ))}
          <button type="button" onClick={() => setMore(true)}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${moreActive ? 'text-[var(--d-champagne)]' : 'text-[var(--d-muted)]'}`}>
            <Menu className="h-5 w-5" aria-hidden />
            Ещё
          </button>
        </nav>

        <Modal open={more} onClose={() => setMore(false)} title="Разделы">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {NAV.map(n => (
                <NavLink key={n.to} to={n.to} end={n.end}
                  className={({ isActive }) => `flex min-h-11 items-center gap-2.5 rounded-md border px-3 text-sm ${isActive
                    ? 'border-[var(--d-champagne)] text-[var(--d-champagne)]' : 'border-[var(--d-line)] text-[var(--d-text)]'}`}>
                  <n.icon className="h-4 w-4" aria-hidden />{n.label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-[var(--d-line)] pt-3">
              <Avatar member={me} size={30} />
              <div className="min-w-0 flex-1 truncate text-sm">{me.name}</div>
              <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" aria-hidden /> Выйти
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
