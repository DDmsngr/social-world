/**
 * Очистка тестовой песочницы перед прогоном: упавшие сценарии не доходят до уборки,
 * и старые E2E-задачи вытесняют новые из коротких списков на «Обзоре».
 *
 * Защиты, чтобы это никогда не задело рабочий workspace:
 *  - работает только от тестовой учётки (E2E_ADMIN_*) и только если она видит РОВНО один
 *    workspace со slug e2e-sandbox — иначе отказ с ошибкой;
 *  - трогает только задачи с тестовыми префиксами названия и только архивирует (не удаляет).
 */
export async function cleanSandbox() {
  const url = process.env.VITE_SUPABASE_URL?.trim()
  const key = process.env.VITE_SUPABASE_ANON_KEY?.trim()
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD
  if (!url || !key || !email || !password) return

  const auth = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: key, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!auth.ok) throw new Error(`cleanSandbox: не удалось войти тестовой учёткой (${auth.status})`)
  const { access_token } = await auth.json() as { access_token: string }
  const headers = { apikey: key, Authorization: `Bearer ${access_token}`, 'content-type': 'application/json' }

  const ws = await (await fetch(`${url}/rest/v1/ws_workspaces?select=slug`, { headers })).json() as { slug: string }[]
  if (ws.length !== 1 || ws[0].slug !== 'e2e-sandbox') {
    throw new Error('cleanSandbox: отказ — тестовая учётка видит не только workspace e2e-sandbox')
  }

  const q = new URLSearchParams({
    archived_at: 'is.null',
    or: '(title.like.E2E*,title.like.Импорт*,title.like.Свободная*,title.like.Плохая*)',
  })
  const res = await fetch(`${url}/rest/v1/ws_tasks?${q}`, {
    method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ archived_at: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error(`cleanSandbox: архивирование не удалось (${res.status})`)
}
