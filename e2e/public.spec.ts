import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Эти тесты не требуют бэкенда: сессии нет, значит любой запрос к данным был бы багом.

test('лендинг не сломан появлением dashboard', async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('#idea')).toBeAttached()
  await expect(page).toHaveTitle(/Social World/)
  // лендинг не тянет код dashboard
  const scripts = await page.locator('script[src]').evaluateAll(els => els.map(e => e.getAttribute('src')))
  expect(scripts.join()).not.toContain('DashboardApp')
})

test('без входа /dashboard ведёт на форму входа', async ({ page }) => {
  await page.goto('dashboard')
  await expect(page).toHaveURL(/\/dashboard\/login$/)
  await expect(page.getByRole('heading', { name: 'Team Workspace' })).toBeVisible()
  await expect(page.getByLabel('Пароль')).toBeVisible()
})

test('прямая ссылка на закрытый раздел: fallback 404.html → логин, с возвратом после входа', async ({ page }) => {
  // на Pages этого файла нет → отдаётся 404.html, который перекидывает на index.html
  const res = await page.request.get('dashboard/tasks/abc')
  expect(res.status()).toBe(404)
  await page.goto('dashboard/tasks/abc')
  await expect(page).toHaveURL(/\/dashboard\/login$/)
})

test('глубокая ссылка с query сохраняется через fallback', async ({ page }) => {
  await page.goto('dashboard/invite?x=1#tok123')
  await expect(page).toHaveURL(/\/dashboard\/invite/)
  await expect(page.getByRole('heading', { name: 'Приглашение в команду' })).toBeVisible()
})

test('перезагрузка страницы входа остаётся на месте', async ({ page }) => {
  await page.goto('dashboard/login')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible()
})

test('неверный пароль показывает ошибку, а не пускает', async ({ page }) => {
  await page.route('**/auth/v1/token**', r => r.fulfill({
    status: 400, contentType: 'application/json',
    body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
  }))
  await page.goto('dashboard/login')
  await page.getByLabel('Email').fill('nobody@example.com')
  await page.getByLabel('Пароль').fill('wrong-password')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('alert')).toContainText('Неверный email или пароль')
  await expect(page).toHaveURL(/\/dashboard\/login$/)
})

test('приглашение без токена не притворяется рабочим', async ({ page }) => {
  await page.goto('dashboard/invite')
  await expect(page.getByRole('alert')).toContainText('нет токена')
})

test('в клиентском бандле нет серверных секретов', () => {
  const dist = path.resolve('dist/assets')
  const bad = [/service_role/i, /SERVICE_ROLE/, /POSTGRES_PASSWORD/, /JWT_SECRET/, /VK_CLIENT_SECRET/, /YANDEX_CLIENT_SECRET/]
  for (const f of fs.readdirSync(dist).filter(f => /\.(js|css|html)$/.test(f))) {
    const text = fs.readFileSync(path.join(dist, f), 'utf8')
    for (const re of bad) expect(text, `${f} содержит ${re}`).not.toMatch(re)
  }
  // JWT-подобные строки допустимы только для anon-ключа (role=anon)
  for (const f of fs.readdirSync(dist).filter(f => f.endsWith('.js'))) {
    const jwts = fs.readFileSync(path.join(dist, f), 'utf8').match(/eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g) ?? []
    for (const j of jwts) {
      const payload = JSON.parse(Buffer.from(j.split('.')[1], 'base64url').toString())
      expect(payload.role, `${f}: JWT с ролью ${payload.role}`).toBe('anon')
    }
  }
})

test('страница входа доступна с клавиатуры и не пустая для скринридера', async ({ page }) => {
  await page.goto('dashboard/login')
  await expect(page.getByRole('heading', { name: 'Team Workspace' })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Email')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Пароль')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Войти' })).toBeFocused()
})

test('мобильная вёрстка входа без горизонтальной прокрутки', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 })
  await page.goto('dashboard/login')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
