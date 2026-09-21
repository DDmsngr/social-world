import { expect, test, type Page } from '@playwright/test'

/**
 * Сценарии против РЕАЛЬНОГО бэкенда (Supabase). Данные создаются в боевой базе,
 * поэтому нужен отдельный тестовый workspace и две тестовые учётки:
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD   — owner или admin
 *   E2E_MEMBER_EMAIL / E2E_MEMBER_PASSWORD / E2E_MEMBER_NAME — обычный member
 * Сборка должна быть с настоящими VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.
 * Без переменных тесты честно пропускаются, а не «проходят».
 */
const env = process.env
const adminOk = !!(env.E2E_ADMIN_EMAIL && env.E2E_ADMIN_PASSWORD)
const memberOk = !!(env.E2E_MEMBER_EMAIL && env.E2E_MEMBER_PASSWORD && env.E2E_MEMBER_NAME)
test.skip(!adminOk, 'нет E2E_ADMIN_*: учётка ещё не заведена')
test.describe.configure({ mode: 'serial' })

const title = `E2E задача ${Date.now()}`

async function login(page: Page, email: string, password: string) {
  await page.goto('dashboard/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Пароль').fill(password)
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('navigation', { name: 'Основная навигация' }).or(page.getByRole('navigation', { name: 'Навигация' }))).toBeVisible()
}
const admin = (page: Page) => login(page, env.E2E_ADMIN_EMAIL!, env.E2E_ADMIN_PASSWORD!)
const member = (page: Page) => login(page, env.E2E_MEMBER_EMAIL!, env.E2E_MEMBER_PASSWORD!)

test('админ создаёт задачу, назначает исполнителя — и это переживает перезагрузку', async ({ page }) => {
  await admin(page)
  await page.goto('dashboard/tasks')
  await page.getByRole('button', { name: 'Новая задача' }).click()
  const dlg = page.getByRole('dialog')
  await dlg.getByLabel('Название').fill(title)
  if (memberOk) await dlg.getByLabel('Исполнитель').selectOption({ label: env.E2E_MEMBER_NAME! })
  await dlg.getByLabel('Приоритет').selectOption('high')
  await dlg.getByRole('button', { name: 'Создать задачу' }).click()
  await expect(page.getByTestId('col-todo').getByText(title)).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('col-todo').getByText(title)).toBeVisible()
})

test('смена статуса в карточке сохраняется и попадает в журнал', async ({ page }) => {
  await admin(page)
  await page.goto('dashboard/tasks')
  await page.getByRole('link', { name: title }).click()
  await page.getByLabel('Статус').selectOption('in_progress')
  await expect(page.getByTestId('activity')).toContainText('To Do → In Progress')
  await page.reload()
  await expect(page.getByLabel('Статус')).toHaveValue('in_progress')
})

test('перетаскивание между колонками меняет статус в БД @desktop-only', async ({ page }) => {
  await admin(page)
  await page.goto('dashboard/tasks')
  const card = page.getByTestId('col-in_progress').getByText(title)
  await card.scrollIntoViewIfNeeded()
  const from = await card.boundingBox()
  const to = await page.getByTestId('col-review').boundingBox()
  await page.mouse.move(from!.x + 10, from!.y + 5)
  await page.mouse.down()
  await page.mouse.move(from!.x + 30, from!.y + 20, { steps: 5 })
  await page.mouse.move(to!.x + to!.width / 2, to!.y + 60, { steps: 15 })
  await page.mouse.up()
  await expect(page.getByTestId('col-review').getByText(title)).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('col-review').getByText(title)).toBeVisible()
})

test('комментарий, ответ и файл в задаче', async ({ page }) => {
  await admin(page)
  await page.goto('dashboard/tasks')
  await page.getByRole('link', { name: title }).click()
  await page.getByLabel('Новый комментарий').fill('Первый комментарий из E2E')
  await page.getByRole('button', { name: 'Отправить' }).click()
  await expect(page.getByTestId('comments')).toContainText('Первый комментарий из E2E')

  await page.getByTestId('file-input').setInputFiles({ name: 'e2e-note.txt', mimeType: 'text/plain', buffer: Buffer.from('hello e2e') })
  await expect(page.getByTestId('files')).toContainText('e2e-note.txt')
  await expect(page.getByTestId('activity')).toContainText('e2e-note.txt')

  await page.reload()
  await expect(page.getByTestId('comments')).toContainText('Первый комментарий из E2E')
  await expect(page.getByTestId('files')).toContainText('e2e-note.txt')
})

test('member: видит уведомление, не может создавать и менять приоритет', async ({ page }) => {
  test.skip(!memberOk, 'нет E2E_MEMBER_*')
  await member(page)
  await page.goto('dashboard/notifications')
  await expect(page.getByTestId('notifications')).toContainText(title)

  await page.goto('dashboard/tasks')
  await expect(page.getByRole('button', { name: 'Новая задача' })).toHaveCount(0)

  await page.getByRole('link', { name: title }).click()
  await expect(page.getByLabel('Приоритет')).toBeDisabled()
  await expect(page.getByLabel('Исполнитель')).toBeDisabled()
  await expect(page.getByLabel('Статус')).toBeEnabled() // своя задача
})

test('поиск и фильтры реально сужают выборку', async ({ page }) => {
  await admin(page)
  await page.goto('dashboard/tasks?view=list')
  await page.getByLabel('Поиск по задачам').fill(title)
  await expect(page.getByRole('link', { name: title })).toBeVisible()
  await page.getByLabel('Приоритет').selectOption('low')
  await expect(page.getByRole('link', { name: title })).toHaveCount(0)
  await page.getByLabel('Приоритет').selectOption('high')
  await expect(page.getByRole('link', { name: title })).toBeVisible()

  await page.getByLabel('Глобальный поиск').fill(title)
  await expect(page).toHaveURL(/\/dashboard\/search/)
  await expect(page.getByRole('link', { name: title })).toBeVisible()
})

test('команда, профиль, приглашение', async ({ page }) => {
  await admin(page)
  await page.goto('dashboard/team')
  await page.getByRole('link', { name: 'E2E Admin' }).first().click()
  await expect(page.getByRole('heading', { name: 'E2E Admin' })).toBeVisible()

  await page.goto('dashboard/team')
  const email = `e2e-${Date.now()}@example.com`
  await page.getByRole('button', { name: 'Пригласить' }).click()
  await page.getByLabel('Имя').fill('E2E Приглашённый')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Создать приглашение' }).click()
  await expect(page.getByTestId('invite-link')).toHaveValue(/dashboard\/invite#[0-9a-f]{40,}/)
  await page.keyboard.press('Escape')
  await expect(page.getByTestId(`member-${email}`)).toContainText('Invited')
  page.once('dialog', d => d.accept())
  await page.getByTestId(`member-${email}`).getByRole('button', { name: 'Отозвать' }).click()
  await expect(page.getByTestId(`member-${email}`)).toHaveCount(0)
})

test('сообщения: отправка, непрочитанное у адресата', async ({ browser }) => {
  test.skip(!memberOk, 'нет E2E_MEMBER_*')
  const a = await browser.newPage({ baseURL: test.info().project.use.baseURL })
  const m = await browser.newPage({ baseURL: test.info().project.use.baseURL })
  await admin(a); await member(m)
  const text = `E2E сообщение ${Date.now()}`
  await a.goto('dashboard/messages')
  await a.getByRole('link', { name: /Общий/ }).click()
  await a.getByLabel('Сообщение').fill(text)
  await a.getByRole('button', { name: 'Отправить' }).click()
  await expect(a.getByTestId('thread')).toContainText(text)

  await m.goto('dashboard/messages')
  await expect(m.getByRole('link', { name: /Общий.*непрочитанных/ })).toBeVisible()
  await m.getByRole('link', { name: /Общий/ }).click()
  await expect(m.getByTestId('thread')).toContainText(text)
})

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

test('комментарий с файлами: ссылки «скрин-N» в тексте и предпросмотр', async ({ page }) => {
  await admin(page)
  await page.goto('dashboard/tasks')
  await page.getByRole('link', { name: title }).click()
  const box = page.getByLabel('Новый комментарий')
  await page.getByTestId('comment-file-input').setInputFiles([
    { name: 'shot-a.png', mimeType: 'image/png', buffer: PNG },
    { name: 'shot-b.png', mimeType: 'image/png', buffer: PNG },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('n') },
  ])
  // ссылки вставились в текст сразу, до отправки
  await expect(box).toHaveValue(/\[скрин-\d+\].*\[скрин-\d+\].*\[файл-\d+\]/)
  await box.fill(`Смотри ${await box.inputValue()}`)
  await page.getByRole('button', { name: 'Отправить' }).click()
  const link = page.getByTestId('comments').getByRole('link', { name: /^скрин-\d+$/ }).first()
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', /\/dashboard\/files\/[0-9a-f-]{36}$/)
  // и файлы лежат внизу списком, с подписями
  await expect(page.getByTestId('files')).toContainText('shot-a.png')
  await expect(page.getByTestId('files')).toContainText('notes.txt')
  await link.click()
  await expect(page.getByRole('heading', { name: /shot-[ab]\.png/ })).toBeVisible()
  await expect(page.locator('img[alt^="shot-"]')).toBeVisible()
})

test('несколько файлов сразу через «Прикрепить файлы» + превью', async ({ page }) => {
  await admin(page)
  await page.goto('dashboard/tasks')
  await page.getByRole('link', { name: title }).click()
  await expect(page.getByTestId('files')).toBeVisible()
  const before = await page.getByTestId('files').locator('li').count()
  await page.getByTestId('file-input').setInputFiles([
    { name: 'multi-1.png', mimeType: 'image/png', buffer: PNG },
    { name: 'multi-2.png', mimeType: 'image/png', buffer: PNG },
  ])
  await expect(page.getByTestId('files').locator('li')).toHaveCount(before + 2)
  await page.getByRole('button', { name: 'Просмотр multi-1.png' }).click()
  await expect(page.getByRole('dialog').locator('img')).toBeVisible()
})

test('чат: Markdown, группа и задача одним щелчком', async ({ browser }) => {
  test.skip(!memberOk, 'нет E2E_MEMBER_*')
  const a = await browser.newPage({ baseURL: test.info().project.use.baseURL })
  const m = await browser.newPage({ baseURL: test.info().project.use.baseURL })
  await admin(a); await member(m)
  const group = `Группа ${Date.now()}`
  await a.goto('dashboard/messages')
  await a.getByRole('button', { name: 'Новая группа' }).click()
  await a.getByRole('dialog').getByLabel('Название').fill(group)
  await a.getByRole('dialog').getByRole('checkbox', { name: /E2E Member/ }).check()
  await a.getByRole('button', { name: 'Создать группу' }).click()
  await expect(a.getByRole('heading', { name: group })).toBeVisible()

  await a.getByLabel('Сообщение').fill('это **жирный** текст')
  await a.getByRole('button', { name: 'Отправить' }).click()
  await expect(a.getByTestId('thread').locator('strong', { hasText: 'жирный' })).toBeVisible()

  await a.getByRole('button', { name: 'Прикрепить задачу' }).click()
  await a.getByLabel('Поиск задачи').fill(title)
  await a.getByRole('dialog').getByRole('button', { name: new RegExp(title) }).click()
  await a.getByRole('button', { name: 'Отправить' }).click()
  await expect(a.getByTestId('task-ref').filter({ hasText: title })).toBeVisible()

  // у участника группа появилась сама (без ручного обновления) и содержит карточку задачи
  await m.goto('dashboard/messages')
  await expect(m.getByRole('link', { name: new RegExp(group) })).toBeVisible({ timeout: 30_000 })
  await m.getByRole('link', { name: new RegExp(group) }).click()
  await expect(m.getByTestId('task-ref').filter({ hasText: title })).toBeVisible()
  await m.getByTestId('task-ref').first().click()
  await expect(m).toHaveURL(/\/dashboard\/tasks\//)
})

test('чат: личный диалог открывается сразу после создания', async ({ browser }) => {
  test.skip(!memberOk, 'нет E2E_MEMBER_*')
  const m = await browser.newPage({ baseURL: test.info().project.use.baseURL })
  await member(m)
  await m.goto('dashboard/messages')
  await m.getByLabel('Новый личный диалог').selectOption({ label: 'E2E Admin' })
  await expect(m.getByLabel('Сообщение')).toBeVisible()
  await expect(m.getByText('Диалог не найден')).toHaveCount(0)
})

test('автообновление: изменение одного пользователя видно другому без перезагрузки', async ({ browser }) => {
  test.skip(!memberOk, 'нет E2E_MEMBER_*')
  const a = await browser.newPage({ baseURL: test.info().project.use.baseURL })
  const m = await browser.newPage({ baseURL: test.info().project.use.baseURL })
  await admin(a); await member(m)
  await a.goto('dashboard/tasks'); await a.getByRole('link', { name: title }).click()
  await m.goto('dashboard/tasks'); await m.getByRole('link', { name: title }).click()
  await expect(m.getByLabel('Статус')).not.toHaveValue('done')
  await a.getByLabel('Статус').selectOption('done')
  await expect(m.getByLabel('Статус')).toHaveValue('done', { timeout: 30_000 })
  // и наоборот: комментарий участника появляется у админа
  await m.getByLabel('Новый комментарий').fill('живой комментарий')
  await m.getByRole('button', { name: 'Отправить' }).click()
  await expect(a.getByTestId('comments')).toContainText('живой комментарий', { timeout: 30_000 })
})

test('обзор показывает счётчики; мобильная вёрстка без горизонтальной прокрутки', async ({ page }) => {
  await admin(page)
  await expect(page.getByTestId('stat-total')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('уборка: задача архивируется', async ({ page }) => {
  await admin(page)
  await page.goto('dashboard/tasks')
  await page.getByRole('link', { name: title }).click()
  page.once('dialog', d => d.accept())
  await page.getByRole('button', { name: 'Архивировать' }).click()
  await expect(page).toHaveURL(/\/dashboard\/tasks$/)
  await expect(page.getByRole('link', { name: title })).toHaveCount(0)
})
