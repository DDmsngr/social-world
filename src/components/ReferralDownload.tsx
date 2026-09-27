import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download } from 'lucide-react'

// Реферальный QR у места (кафе, магазин): человек без приложения сканирует
// код у кассы, попадает сюда, ставит приложение. Награду (кофе) кассир
// выдаёт на глаз, как по бумажному купону, — код на этой странице нужен
// только для статистики «сколько установок принесло это место»
// (record_referral_signup, миграция 0025 в social-world-app).
//
// Если приложение уже стоит, тот же адрес открывает его напрямую через
// intent-filter (pathPrefix /social-world/o) — сюда попадают только те,
// у кого его ещё нет.

type Manifest = { apkUrl: string; apkUrlArm64?: string }

const MANIFEST_URL =
  'https://api-socialworld.deepdrift.tech/storage/v1/object/public/app-releases/manifest.json'

export default function ReferralDownload() {
  const { code } = useParams<{ code: string }>()
  const [apkUrl, setApkUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(MANIFEST_URL)
      .then((response) => (response.ok ? (response.json() as Promise<Manifest>) : Promise.reject()))
      .then((manifest) => {
        if (!cancelled) setApkUrl(manifest.apkUrlArm64 ?? manifest.apkUrl)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="bg-ink grain min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center">
        <div className="section-label justify-center mb-8">
          <span>Приглашение</span>
        </div>
        <h1 className="font-instrument text-white text-[44px] md:text-[56px] leading-[0.95] tracking-tight mb-6">
          Вас позвали
          <br />
          <span className="serif-italic text-clay">в ChaWo</span>
        </h1>
        <p className="text-white/60 text-base leading-relaxed mb-10">
          Живая карта города: квесты, места и люди рядом. Установите
          приложение — код ниже уже привязан к этому месту.
        </p>

        {apkUrl && (
          <a
            href={apkUrl}
            className="inline-flex items-center gap-3 bg-white text-black px-6 py-3.5 rounded-full font-medium text-sm tracking-wide hover:bg-white/90 transition-all duration-300"
          >
            <Download className="w-4 h-4" strokeWidth={1.8} />
            Скачать ChaWo
          </a>
        )}
        {failed && (
          <p className="text-white/50 text-sm">
            Не удалось получить ссылку на приложение. Попробуйте обновить
            страницу чуть позже.
          </p>
        )}
        {!apkUrl && !failed && (
          <p className="text-white/40 text-sm font-mono">Готовим ссылку…</p>
        )}

        {code && (
          <div className="mt-14 pt-10 border-t border-hair">
            <div className="text-[10px] tracking-[0.28em] uppercase text-white/40 mb-3">
              Код места
            </div>
            <div className="font-mono text-3xl text-white tracking-[0.3em]">{code}</div>
            <p className="text-white/40 text-xs mt-4 max-w-xs mx-auto leading-relaxed">
              После установки: профиль → «Ввести код места» и впишите его.
            </p>
            <a
              href={`socialworld://ref/${code}`}
              className="block mt-6 text-white/40 text-xs hover-underline w-fit mx-auto"
            >
              Уже установили — открыть в приложении
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
