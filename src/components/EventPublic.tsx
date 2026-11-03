import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, Download, MapPin, Smartphone, Users } from 'lucide-react'
import { isConfigured, supabase } from '../dashboard/supabase'

// Ссылка на событие из приложения: https://…/o/event/<id>
// (social-world-app/lib/core/links/deep_links.dart, DeepLinks.shareUri).
// Если приложение стоит, тот же адрес открывает его через intent-filter;
// сюда попадает тот, у кого его нет. Карточку отдаёт public_event_card
// (миграция 0116): только то, что и так видно в приложении любому, без
// событий «по приглашению».

type EventCard = {
  id: string
  title: string
  description: string
  starts_at: string
  ends_at: string | null
  place: string
  category: string | null
  price_rub: number
  cover_url: string | null
  join_mode: 'free' | 'request' | 'invite'
  max_participants: number | null
  participants: number
  author: string
}

type Manifest = { apkUrl: string; apkUrlArm64?: string }

const MANIFEST_URL =
  'https://api-socialworld.deepdrift.tech/storage/v1/object/public/app-releases/manifest.json'

const CATEGORY: Record<string, string> = {
  walks: 'Прогулка',
  food: 'Кофе и еда',
  music: 'Музыка',
  sport: 'Спорт',
  games: 'Игры',
  picnic: 'Пикник',
  hiking: 'Поход',
  other: 'Встреча',
}

function formatWhen(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt)
  const day = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })
  const time = (d: Date) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return endsAt ? `${day}, ${time(start)}–${time(new Date(endsAt))}` : `${day}, ${time(start)}`
}

export default function EventPublic() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<EventCard | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'failed'>('loading')
  const [apkUrl, setApkUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!id || !isConfigured) {
      setState('failed')
      return
    }
    supabase
      .rpc('public_event_card', { in_event: id })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setState('failed')
        else if (!data) setState('missing')
        else {
          setEvent(data as EventCard)
          setState('ready')
        }
      })
    fetch(MANIFEST_URL)
      .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : Promise.reject()))
      .then((m) => {
        if (!cancelled) setApkUrl(m.apkUrlArm64 ?? m.apkUrl)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (event) document.title = `${event.title} · ChaWo`
  }, [event])

  const appLink = id ? `socialworld://event/${id}` : undefined

  return (
    <div className="bg-ink grain min-h-screen flex items-center justify-center px-5 py-16">
      <div className="max-w-md w-full">
        <div className="section-label mb-6">
          <span>Событие в ChaWo</span>
        </div>

        {state === 'loading' && <p className="text-white/40 text-sm font-mono">Загружаем…</p>}
        {state === 'missing' && (
          <p className="text-white/60 text-base leading-relaxed">
            Такого события нет: его отменили или оно только для приглашённых.
          </p>
        )}
        {state === 'failed' && (
          <p className="text-white/60 text-base leading-relaxed">
            Не получилось загрузить событие. Обновите страницу чуть позже.
          </p>
        )}

        {event && (
          <article>
            {event.cover_url && (
              <img
                src={event.cover_url}
                alt=""
                className="w-full aspect-video object-cover rounded-2xl mb-6 border border-hair"
              />
            )}
            <h1 className="font-instrument text-white text-[38px] md:text-[48px] leading-[1] tracking-tight mb-5">
              {event.title}
            </h1>
            <ul className="space-y-3 text-white/75 text-[15px] mb-6">
              <li className="flex gap-3 items-start">
                <CalendarDays className="w-4 h-4 mt-1 shrink-0 text-clay" strokeWidth={1.8} />
                <span>{formatWhen(event.starts_at, event.ends_at)}</span>
              </li>
              {event.place && (
                <li className="flex gap-3 items-start">
                  <MapPin className="w-4 h-4 mt-1 shrink-0 text-clay" strokeWidth={1.8} />
                  <span>{event.place}</span>
                </li>
              )}
              <li className="flex gap-3 items-start">
                <Users className="w-4 h-4 mt-1 shrink-0 text-clay" strokeWidth={1.8} />
                <span>
                  {event.max_participants
                    ? `Идут ${event.participants} из ${event.max_participants}`
                    : `Идут ${event.participants}`}
                  {' · '}
                  {event.join_mode === 'request' ? 'по запросу организатору' : 'вход свободный'}
                </span>
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 mb-6 text-xs">
              <span className="px-3 py-1 rounded-full border border-hair text-white/70">
                {CATEGORY[event.category ?? 'other'] ?? 'Встреча'}
              </span>
              <span className="px-3 py-1 rounded-full border border-hair text-white/70">
                {event.price_rub > 0 ? `${event.price_rub} ₽` : 'Бесплатно'}
              </span>
              <span className="px-3 py-1 rounded-full border border-hair text-white/70">
                Организатор: {event.author}
              </span>
            </div>
            {event.description && (
              <p className="text-white/60 text-[15px] leading-relaxed whitespace-pre-line mb-8">
                {event.description}
              </p>
            )}
          </article>
        )}

        <div className="flex flex-col gap-3 mt-4">
          {appLink && (
            <a
              href={appLink}
              className="inline-flex items-center justify-center gap-3 bg-white text-black px-6 py-3.5 rounded-full font-medium text-sm tracking-wide hover:bg-white/90 transition-all duration-300"
            >
              <Smartphone className="w-4 h-4" strokeWidth={1.8} />
              Открыть в ChaWo
            </a>
          )}
          {apkUrl && (
            <a
              href={apkUrl}
              className="inline-flex items-center justify-center gap-3 border border-hair text-white px-6 py-3.5 rounded-full text-sm tracking-wide hover:bg-white/5 transition-all duration-300"
            >
              <Download className="w-4 h-4" strokeWidth={1.8} />
              Скачать ChaWo для Android
            </a>
          )}
          <p className="text-white/40 text-xs leading-relaxed mt-2">
            Записаться и написать участникам можно в приложении. ChaWo — живая карта
            города: события, места и люди рядом.
          </p>
        </div>
      </div>
    </div>
  )
}
