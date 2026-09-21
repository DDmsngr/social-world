import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { acceptInvitation, invitationPreview } from '../api'
import { useAuth } from '../auth'
import { Field, QueryState, Spinner, errMsg } from '../ui'

/** Токен живёт во фрагменте URL (#...): в отличие от пути и query он не уходит на сервер. */
export default function Invite() {
  const token = useLocation().hash.replace(/^#/, '')
  const nav = useNavigate()
  const { session } = useAuth()
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [accepting, setAccepting] = useState(false)

  const preview = useQuery({
    queryKey: ['invite', token], queryFn: () => invitationPreview(token), enabled: !!token, retry: false,
  })
  const inv = preview.data

  // вошедший пользователь сразу принимает приглашение
  useEffect(() => {
    if (!session || !inv || accepting) return
    setAccepting(true)
    acceptInvitation(token)
      .then(() => nav('/dashboard', { replace: true }))
      .catch(e => { setError(errMsg(e)); setAccepting(false) })
  }, [session, inv]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!inv) return
    setBusy(true)
    setError('')
    const creds = { email: inv.email, password }
    const res = mode === 'signup' ? await supabase.auth.signUp(creds) : await supabase.auth.signInWithPassword(creds)
    setBusy(false)
    if (res.error) setError(res.error.message)
    else if (!res.data.session) setNotice('Аккаунт создан, но сервер требует подтверждения email. Подтвердите почту и вернитесь по этой же ссылке.')
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="dash-card w-full max-w-sm p-6">
        <div className="dash-label">Social World</div>
        <h1 className="mt-1 text-xl font-semibold">Приглашение в команду</h1>
        {!token ? (
          <p role="alert" className="mt-4 text-sm">В ссылке нет токена приглашения. Запросите новую.</p>
        ) : (
          <QueryState loading={preview.isLoading} error={preview.error} onRetry={() => preview.refetch()}
            empty={!inv} emptyText="Приглашение недействительно или просрочено" emptyHint="Попросите владельца выпустить новое.">
            {inv && (
              <div className="mt-3 space-y-4">
                <p className="text-sm">
                  {inv.name}, вас приглашают в <b>{inv.workspace_name}</b> как {inv.role}.
                </p>
                {inv.message && <p className="dash-muted rounded-lg bg-[var(--d-bg)] p-3 text-sm">«{inv.message}»</p>}
                {accepting ? <Spinner label="Принимаем приглашение" /> : session ? (
                  <p role="alert" className="text-sm text-[var(--d-tint)]">{error || 'Вы уже вошли под другим аккаунтом.'}</p>
                ) : (
                  <form onSubmit={submit} className="space-y-3">
                    <Field label="Email (из приглашения)">
                      <input className="dash-input opacity-70" value={inv.email} readOnly aria-readonly />
                    </Field>
                    <Field label={mode === 'signup' ? 'Придумайте пароль' : 'Пароль'} hint={mode === 'signup' ? 'Не короче 6 символов' : undefined}>
                      <input className="dash-input" type="password" minLength={6} required value={password}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} onChange={e => setPassword(e.target.value)} />
                    </Field>
                    {error && <p role="alert" className="text-sm text-[var(--d-tint)]">{error}</p>}
                    {notice && <p role="status" className="text-sm">{notice}</p>}
                    <button className="dash-btn w-full" disabled={busy}>
                      {mode === 'signup' ? 'Создать аккаунт и войти' : 'Войти и принять'}
                    </button>
                    <button type="button" className="dash-muted w-full text-center text-xs underline"
                      onClick={() => { setMode(m => (m === 'signup' ? 'login' : 'signup')); setError('') }}>
                      {mode === 'signup' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </QueryState>
        )}
      </div>
    </main>
  )
}
