import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Paperclip } from 'lucide-react'
import {
  fetchAttachments, fetchConversations, fetchMessages, fetchUnread, markRead, openDirect, sendMessage, uploadFile,
} from '../api'
import { useWorkspace } from '../auth'
import { fmtDateTime } from '../meta'
import type { Conversation, Message } from '../types'
import { Avatar, PageHeader, QueryState, errMsg, useToast } from '../ui'
import { FileList } from '../shared'

export default function Messages() {
  const { convId } = useParams()
  const { workspace, members, userId, byUser } = useWorkspace()
  const nav = useNavigate()
  const toast = useToast()

  const convs = useQuery({ queryKey: ['conversations', workspace.id], queryFn: () => fetchConversations(workspace.id) })
  const unread = useQuery({ queryKey: ['unread', workspace.id], queryFn: () => fetchUnread(workspace.id) })

  const label = (c: Conversation) => {
    if (c.kind === 'channel') return c.name ?? 'Канал'
    const other = c.direct_key?.split(':').find(x => x !== userId)
    return byUser(other)?.name ?? 'Личный диалог'
  }
  const others = members.filter(m => m.status === 'active' && m.user_id && m.user_id !== userId)
  const start = useMutation({
    mutationFn: (uid: string) => openDirect(workspace.id, uid),
    onSuccess: id => nav(`/dashboard/messages/${id}`),
    onError: e => toast(errMsg(e), 'error'),
  })
  const active = convs.data?.find(c => c.id === convId)

  return (
    <>
      <PageHeader title="Сообщения" />
      <div className="dash-card grid min-h-[60dvh] overflow-hidden md:grid-cols-[260px_1fr]">
        <aside className={`border-[var(--d-line)] md:border-r ${convId ? 'hidden md:block' : ''}`} aria-label="Диалоги">
          <QueryState loading={convs.isLoading} error={convs.error} onRetry={() => convs.refetch()}>
            <ul>
              {convs.data?.map(c => {
                const n = unread.data?.[c.id] ?? 0
                return (
                  <li key={c.id}>
                    <Link to={`/dashboard/messages/${c.id}`} aria-current={c.id === convId ? 'page' : undefined}
                      className={`flex min-h-12 items-center gap-2 px-4 text-sm hover:bg-[var(--d-raised)] ${c.id === convId ? 'bg-[var(--d-raised)]' : ''}`}>
                      <span className="flex-1 truncate">{c.kind === 'channel' ? '# ' : ''}{label(c)}</span>
                      {n > 0 && <span className="rounded-full bg-[var(--d-tint)] px-1.5 text-[11px] font-bold text-[#151417]" aria-label={`${n} непрочитанных`}>{n}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </QueryState>
          {others.length > 0 && (
            <div className="border-t border-[var(--d-line)] p-3">
              <select className="dash-input !min-h-9 text-xs" aria-label="Новый личный диалог" value=""
                onChange={e => e.target.value && start.mutate(e.target.value)}>
                <option value="">+ Написать участнику…</option>
                {others.map(m => <option key={m.id} value={m.user_id!}>{m.name}</option>)}
              </select>
            </div>
          )}
        </aside>

        <section className={convId ? '' : 'hidden md:grid md:place-items-center'} aria-label="Переписка">
          {active ? (
            <Thread conv={active} title={label(active)} />
          ) : convId && convs.isLoading ? null : (
            <p className="dash-muted p-6 text-sm">{convId ? 'Диалог не найден' : 'Выберите диалог слева'}</p>
          )}
        </section>
      </div>
    </>
  )
}

function Thread({ conv, title }: { conv: Conversation; title: string }) {
  const { workspace, userId, byUser } = useWorkspace()
  const qc = useQueryClient()
  const toast = useToast()
  const [older, setOlder] = useState<Message[]>([])
  const [exhausted, setExhausted] = useState(false)
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => { setOlder([]); setExhausted(false) }, [conv.id])

  const latest = useQuery({ queryKey: ['messages', conv.id], queryFn: () => fetchMessages(conv.id) })
  const msgs = [...older, ...(latest.data ?? [])].filter((m, i, a) => a.findIndex(x => x.id === m.id) === i)
  const ids = msgs.map(m => m.id)
  const files = useQuery({
    queryKey: ['attachments', 'messages', conv.id, ids.length],
    queryFn: () => fetchAttachments({ messageIds: ids }),
    enabled: ids.length > 0,
  })

  // прочитано: открыли диалог или пришло новое сообщение
  const lastId = latest.data?.[latest.data.length - 1]?.id
  useEffect(() => {
    if (!lastId) return
    void markRead(conv.id).then(() => qc.invalidateQueries({ queryKey: ['unread'] }))
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [lastId, conv.id, qc])

  const loadOlder = async () => {
    try {
      const page = await fetchMessages(conv.id, msgs[0]?.created_at)
      setOlder(o => [...page, ...o])
      if (page.length < 30) setExhausted(true)
    } catch (e) { toast(errMsg(e), 'error') }
  }

  const send = useMutation({
    mutationFn: async () => {
      const m = await sendMessage(conv.id, body.trim())
      if (file) {
        try { await uploadFile(workspace.id, userId, file, { messageId: m.id }) }
        catch (e) { toast(`Сообщение отправлено, файл — нет: ${errMsg(e)}`, 'error') }
      }
    },
    onSuccess: () => {
      setBody(''); setFile(null)
      qc.invalidateQueries({ queryKey: ['messages'] }); qc.invalidateQueries({ queryKey: ['attachments'] })
    },
    onError: e => toast(errMsg(e), 'error'),
  })
  const submit = (e: FormEvent) => { e.preventDefault(); if (body.trim()) send.mutate() }

  return (
    <div className="flex h-[70dvh] flex-col md:h-[64dvh]">
      <header className="flex items-center gap-2 border-b border-[var(--d-line)] px-4 py-3">
        <Link to="/dashboard/messages" className="md:hidden" aria-label="К списку диалогов"><ArrowLeft className="h-5 w-5" aria-hidden /></Link>
        <h2 className="text-sm font-semibold">{conv.kind === 'channel' ? '# ' : ''}{title}</h2>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3" data-testid="thread">
        <QueryState loading={latest.isLoading} error={latest.error} onRetry={() => latest.refetch()} empty={msgs.length === 0} emptyText="Сообщений пока нет" emptyHint="Напишите первым.">
          {!exhausted && msgs.length >= 30 && <button className="dash-btn dash-btn-ghost dash-btn-sm mx-auto block" onClick={loadOlder}>Загрузить ранее</button>}
          {msgs.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.author_id === userId ? 'flex-row-reverse' : ''}`} data-testid="message">
              <Avatar member={byUser(m.author_id)} size={28} />
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.author_id === userId ? 'bg-[var(--d-primary)]' : 'bg-[var(--d-raised)]'}`}>
                <div className="mb-0.5 text-[11px] opacity-70">{byUser(m.author_id)?.name} · {fmtDateTime(m.created_at)}</div>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                {(files.data ?? []).some(f => f.message_id === m.id) && (
                  <div className="mt-1 rounded-lg bg-black/25 px-2"><FileList files={(files.data ?? []).filter(f => f.message_id === m.id)} /></div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottom} />
        </QueryState>
      </div>
      <form onSubmit={submit} className="dash-safe-bottom flex items-end gap-2 border-t border-[var(--d-line)] p-3">
        <input ref={fileInput} type="file" className="sr-only" tabIndex={-1} aria-label="Файл к сообщению" data-testid="msg-file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <button type="button" className="dash-btn dash-btn-ghost !px-3" onClick={() => fileInput.current?.click()} aria-label="Прикрепить файл"><Paperclip className="h-4 w-4" aria-hidden /></button>
        <div className="flex-1">
          {file && <p className="dash-muted mb-1 text-xs">Файл: {file.name} <button type="button" className="underline" onClick={() => setFile(null)}>убрать</button></p>}
          <textarea className="dash-input !min-h-10" rows={1} aria-label="Сообщение" placeholder="Сообщение…" value={body} onChange={e => setBody(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e as unknown as FormEvent) } }} />
        </div>
        <button className="dash-btn" disabled={send.isPending || !body.trim()}>Отправить</button>
      </form>
    </div>
  )
}
