import { motion } from 'framer-motion'
import SectionShell from './SectionShell'

type Row = {
  feature: string
  us: string
  instagram: string
  vk: string
  maps: string
  dating: string
}

const rows: Row[] = [
  {
    feature: 'Лента постов',
    us: 'да, и она привязана к месту',
    instagram: 'да',
    vk: 'да',
    maps: 'нет',
    dating: 'нет',
  },
  {
    feature: 'Живая карта города',
    us: 'да, ядро продукта',
    instagram: 'нет',
    vk: 'нет',
    maps: 'частично',
    dating: 'нет',
  },
  {
    feature: 'Знакомства по интересам рядом',
    us: 'да, встроено',
    instagram: 'нет',
    vk: 'частично',
    maps: 'нет',
    dating: 'да',
  },
  {
    feature: 'События и афиша',
    us: 'да, с картой и людьми',
    instagram: 'нет',
    vk: 'частично',
    maps: 'частично',
    dating: 'нет',
  },
  {
    feature: 'Профили мест и бизнеса',
    us: 'да, живой цифровой слой',
    instagram: 'бизнес-аккаунт',
    vk: 'бизнес-паблик',
    maps: 'справочник',
    dating: 'нет',
  },
  {
    feature: 'Репутация пользователя',
    us: 'да, единый Social Score',
    instagram: 'нет',
    vk: 'нет',
    maps: 'частично',
    dating: 'нет',
  },
  {
    feature: 'Реклама = человек+место+время',
    us: 'да, ядро экономики',
    instagram: 'таргет по интересам',
    vk: 'таргет по интересам',
    maps: 'по геолокации',
    dating: 'нет',
  },
]

const cellStyle = (value: string) => {
  if (value.startsWith('да')) return 'text-white'
  if (value.startsWith('нет')) return 'text-white/25'
  return 'text-white/55'
}

export default function Differentiators() {
  return (
    <SectionShell id="different" index="02" label="Что делает нас другими">
      <div className="mb-14 md:mb-20 grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-20 items-start">
        <h2 className="font-instrument text-white text-[52px] md:text-[92px] leading-[0.95] tracking-tight">
          Ни одна платформа<br />
          <span className="serif-italic text-clay">не объединяет</span><br />
          все сценарии.
        </h2>
        <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-lg pt-4">
          Instagram про контент. VK про сообщества. Яндекс Карты про поиск.
          Tinder про знакомства. Social World — это единый цифровой слой города,
          в котором все сценарии переплетены и завязаны на реальную геолокацию.
        </p>
      </div>

      {/* Comparison table (desktop) */}
      <div className="hidden md:block rounded-3xl border-hair overflow-hidden">
        <div className="grid grid-cols-[1.7fr_1.2fr_1fr_1fr_1fr_1fr] px-8 py-5 border-b border-white/[0.08] bg-white/[0.015]">
          <div className="text-[10px] tracking-[0.28em] uppercase text-white/40">Сценарий</div>
          <div className="text-[10px] tracking-[0.28em] uppercase text-clay">Social World</div>
          <div className="text-[10px] tracking-[0.28em] uppercase text-white/40">Instagram</div>
          <div className="text-[10px] tracking-[0.28em] uppercase text-white/40">VK</div>
          <div className="text-[10px] tracking-[0.28em] uppercase text-white/40">Яндекс Карты</div>
          <div className="text-[10px] tracking-[0.28em] uppercase text-white/40">Tinder</div>
        </div>
        {rows.map((r, i) => (
          <motion.div
            key={r.feature}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-[1.7fr_1.2fr_1fr_1fr_1fr_1fr] px-8 py-5 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors duration-500"
          >
            <div className="font-instrument text-white text-lg">{r.feature}</div>
            <div className={`text-sm ${cellStyle(r.us)}`} style={{ color: r.us.startsWith('да') ? '#f0a37e' : undefined }}>
              {r.us}
            </div>
            <div className={`text-sm ${cellStyle(r.instagram)}`}>{r.instagram}</div>
            <div className={`text-sm ${cellStyle(r.vk)}`}>{r.vk}</div>
            <div className={`text-sm ${cellStyle(r.maps)}`}>{r.maps}</div>
            <div className={`text-sm ${cellStyle(r.dating)}`}>{r.dating}</div>
          </motion.div>
        ))}
      </div>

      {/* Mobile stacked */}
      <div className="md:hidden space-y-3">
        {rows.map((r) => (
          <div key={r.feature} className="rounded-2xl border-hair p-5">
            <div className="font-instrument text-white text-xl mb-4">{r.feature}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="text-clay">Social World</div>
              <div className={cellStyle(r.us)}>{r.us}</div>
              <div className="text-white/40">Instagram</div>
              <div className={cellStyle(r.instagram)}>{r.instagram}</div>
              <div className="text-white/40">VK</div>
              <div className={cellStyle(r.vk)}>{r.vk}</div>
              <div className="text-white/40">Я.Карты</div>
              <div className={cellStyle(r.maps)}>{r.maps}</div>
              <div className="text-white/40">Tinder</div>
              <div className={cellStyle(r.dating)}>{r.dating}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom callout */}
      <div className="mt-14 md:mt-20 grid md:grid-cols-3 gap-4">
        {[
          { k: '7', t: 'приложений заменяет', s: 'соцсеть, карты, афиша, знакомства, мессенджер, marketplace, аналитика' },
          { k: '1', t: 'карта — 1 профиль', s: 'человек, место, событие и бизнес живут в одном пространстве' },
          { k: '∞', t: 'сценариев города', s: 'модель растёт вместе с активностью, без переработки продукта' },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border-hair p-7">
            <div className="font-instrument text-clay text-6xl leading-none mb-4">{x.k}</div>
            <div className="text-white text-sm mb-2">{x.t}</div>
            <div className="text-white/50 text-sm leading-relaxed">{x.s}</div>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
