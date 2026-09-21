import { expect, test, type Page } from '@playwright/test'
import { cleanSandbox } from './sandbox'

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
test.beforeAll(async () => { await cleanSandbox() })

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
  // без ожидания ответа reload на быстром CI обрывает запрос сохранения, и в БД ничего не попадает
  const saved = page.waitForResponse(r => r.url().includes('/rest/v1/ws_tasks') && r.request().method() === 'PATCH')
  await page.mouse.up()
  expect((await saved).ok()).toBe(true)
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
  // «назначили задачу» — личное уведомление, в «Общих» его быть не должно
  await expect(page.getByRole('tab', { name: /Личные/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByTestId('notifications')).toContainText(title)
  await page.getByRole('tab', { name: /Общие/ }).click()
  await expect(page.getByTestId('notifications')).not.toContainText(`Вам назначили задачу «${title}»`)
  await page.getByRole('tab', { name: /Личные/ }).click()

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

test('свободная задача: участник берёт её одним щелчком, она закрепляется за ним', async ({ browser }) => {
  test.skip(!memberOk, 'нет E2E_MEMBER_*')
  const a = await browser.newPage({ baseURL: test.info().project.use.baseURL })
  const m = await browser.newPage({ baseURL: test.info().project.use.baseURL })
  await admin(a); await member(m)
  const free = `Свободная ${Date.now()}`

  // админ нарезает задачу, никого не назначая
  await a.goto('dashboard/tasks')
  await a.getByRole('button', { name: 'Новая задача' }).click()
  const dlg = a.getByRole('dialog')
  await dlg.getByLabel('Название').fill(free)
  await dlg.getByRole('button', { name: 'Создать задачу' }).click()
  await expect(a.getByTestId('col-todo').getByText(free)).toBeVisible()

  // участник видит её среди свободных на обзоре и берёт
  await m.goto('dashboard')
  const row = m.getByTestId('free-tasks').locator('li', { hasText: free })
  await expect(row).toBeVisible({ timeout: 30_000 })
  await row.getByRole('button', { name: 'Взять' }).click()
  await expect(row).toHaveCount(0)

  // на доске задача в «In Progress» и за участником; сохранилось после перезагрузки
  await m.goto('dashboard/tasks')
  await expect(m.getByTestId('col-in_progress').getByText(free)).toBeVisible()
  await m.getByRole('link', { name: free }).click()
  await expect(m.getByLabel('Исполнитель')).toHaveValue(/.+/)
  await expect(m.getByRole('button', { name: 'Отказаться от задачи' })).toBeVisible()
  await m.reload()
  await expect(m.getByLabel('Статус')).toHaveValue('in_progress')

  // админ (создатель) видит новое закрепление без перезагрузки, в журнале «взял(а) в работу»
  await a.getByRole('link', { name: free }).click()
  await expect(a.getByTestId('activity')).toContainText('взял(а) в работу', { timeout: 30_000 })
  await expect(a.getByLabel('Исполнитель')).not.toHaveValue('')

  // занятую задачу взять нельзя: кнопки «Взять» больше нет
  await expect(a.getByRole('button', { name: 'Взять' })).toHaveCount(0)

  // участник отказывается: задача снова свободна и уходит в To Do
  await m.getByRole('button', { name: 'Отказаться от задачи' }).click()
  await expect(m.getByLabel('Статус')).toHaveValue('todo')
  await expect(m.getByRole('button', { name: 'Взять' })).toBeVisible()

  // уборка
  a.once('dialog', d => d.accept())
  await a.getByRole('button', { name: 'Архивировать' }).click()
})

test('импорт JSON: свободные и назначенные, ошибки, дубликаты, права, экспорт', async ({ browser }) => {
  test.skip(!memberOk, 'нет E2E_MEMBER_*')
  test.setTimeout(120_000) // длинный сценарий: предпросмотр, создание, экспорт и уборка трёх задач
  const a = await browser.newPage({ baseURL: test.info().project.use.baseURL })
  const m = await browser.newPage({ baseURL: test.info().project.use.baseURL })
  await admin(a); await member(m)
  const t1 = `Импорт ${Date.now()} раз`, t2 = `Импорт ${Date.now()} два`, t3 = `Импорт ${Date.now()} три`
  const good = JSON.stringify({ format: 'social-world-tasks', version: 1, tasks: [
    { title: t1, priority: 'high', labels: ['импорт-тест'] },
    { title: t2 },
    { title: t3, assignee: 'E2E Member', description: '**жирно**', due: '2031-05-20' },
  ] })
  const file = (data: string) => ({ name: 'tasks.json', mimeType: 'application/json', buffer: Buffer.from(data) })

  await a.goto('dashboard/tasks')
  await a.getByRole('button', { name: 'Импорт', exact: true }).click()

  // 1. файл с ошибкой: неизвестный исполнитель → предпросмотр показывает, кнопка заблокирована
  await a.getByTestId('import-file').setInputFiles(file(JSON.stringify({ tasks: [{ title: 'Плохая', assignee: 'Иван Неизвестный' }] })))
  await expect(a.getByTestId('import-preview')).toContainText('нет в команде')
  await expect(a.getByRole('button', { name: /^Создать/ })).toBeDisabled()

  // 2. битый JSON
  await a.getByLabel('Или вставьте JSON сюда').fill('{oops')
  await expect(a.getByRole('alert')).toContainText('не корректный JSON')

  // 3. правильный файл: предпросмотр с раскладкой
  await a.getByTestId('import-file').setInputFiles(file(good))
  await expect(a.getByTestId('import-row')).toHaveCount(3)
  await expect(a.getByTestId('import-summary')).toContainText('свободных: 2, назначенных: 1')
  await expect(a.getByTestId('import-preview')).toContainText('E2E Member')
  await a.getByRole('button', { name: /^Создать 3/ }).click()
  await expect(a.getByRole('status').filter({ hasText: 'Создано задач: 3' })).toBeVisible()
  await a.getByRole('button', { name: 'Готово' }).click()

  // задачи на доске; свободные — без исполнителя (есть «Взять»), назначенная — нет
  await expect(a.getByTestId('col-todo').getByText(t1)).toBeVisible()
  await expect(a.getByTestId('col-todo').locator('li', { hasText: t1 }).getByRole('button', { name: 'Взять' })).toBeVisible()
  await expect(a.getByTestId('col-todo').locator('li', { hasText: t3 }).getByRole('button', { name: 'Взять' })).toHaveCount(0)

  // 4. повторная загрузка того же файла: дубликаты пропускаются, создавать нечего
  await a.getByRole('button', { name: 'Импорт', exact: true }).click()
  await a.getByTestId('import-file').setInputFiles(file(good))
  await expect(a.getByTestId('import-preview')).toContainText('уже есть — пропуск')
  await expect(a.getByRole('button', { name: /^Создать/ })).toBeDisabled()
  await a.getByRole('button', { name: 'Отмена' }).click()

  // 5. участник: свободные видны на «Обзоре», назначенная — в «Мои задачи»; кнопки «Импорт» нет
  await m.goto('dashboard')
  await expect(m.getByTestId('free-tasks')).toContainText(t1, { timeout: 30_000 })
  await expect(m.getByTestId('free-tasks')).toContainText(t2)
  await expect(m.getByTestId('free-tasks')).not.toContainText(t3)
  await expect(m.getByRole('region', { name: 'Мои задачи' })).toContainText(t3)
  await m.goto('dashboard/tasks')
  await expect(m.getByRole('button', { name: 'Импорт', exact: true })).toHaveCount(0)
  await expect(m.getByRole('button', { name: 'Экспорт', exact: true })).toBeVisible()

  // 6. экспорт: файл в том же формате и с нашими задачами
  const [dl] = await Promise.all([a.waitForEvent('download'), a.getByRole('button', { name: 'Экспорт', exact: true }).click()])
  const exported = JSON.parse(await (await import('node:fs/promises')).readFile(await dl.path(), 'utf8'))
  expect(exported.format).toBe('social-world-tasks')
  const titles = exported.tasks.map((t: { title: string }) => t.title)
  expect(titles).toEqual(expect.arrayContaining([t1, t2, t3]))
  expect(exported.tasks.find((t: { title: string }) => t.title === t3).assignee).toBe(env.E2E_MEMBER_EMAIL)

  // 7. справка открывается и описывает формат
  await a.getByRole('button', { name: 'Как работает импорт и экспорт' }).click()
  await expect(a.getByRole('dialog')).toContainText('всё или ничего')
  await expect(a.getByRole('dialog')).toContainText('assignee')
  await a.keyboard.press('Escape')

  // уборка
  for (const t of [t1, t2, t3]) {
    await a.goto('dashboard/tasks')
    await a.getByRole('link', { name: new RegExp(t) }).click()
    a.once('dialog', d => d.accept())
    await a.getByRole('button', { name: 'Архивировать' }).click()
    await expect(a).toHaveURL(/\/dashboard\/tasks$/)
  }
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
