import { Users, Camera, MapPin, CalendarDays, Building2, TrendingUp } from 'lucide-react'
import SectionShell from './SectionShell'

const blocks = [
  { n: '01', Icon: Users,         title: 'People',   desc: 'Люди находят друг друга и формируют связи по интересам, репутации и расстоянию.' },
  { n: '02', Icon: Camera,        title: 'Content',  desc: 'Фото, видео, short, stories и посты — единая лента города, а не отдельная соцсеть.' },
  { n: '03', Icon: MapPin,        title: 'Places',   desc: 'Каждое место получает цифровую страницу: рейтинг, публикации, событие, активность.' },
  { n: '04', Icon: CalendarDays,  title: 'Events',   desc: 'Концерты, вечеринки, спорт, встречи. Городская жизнь становится видимой.' },
  { n: '05', Icon: Building2,     title: 'City',     desc: 'Карта показывает пульс районов, поток людей, точки активности в реальном времени.' },
  { n: '06', Icon: TrendingUp,    title: 'Business', desc: 'Реклама и аналитика встроены в среду. Предложение = человек + место + время.' },
]

export default function Idea() {
  return (
    <SectionShell id="idea" index="01" label="Что мы строим">
      <div className="grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-20 items-start mb-16 md:mb-24">
        <h2 className="font-instrument text-white text-[52px] md:text-[92px] leading-[0.95] tracking-tight">
          Соцсеть, которая<br />
          <span className="serif-italic text-clay">становится частью</span><br />
          жизни города.
        </h2>
        <div className="max-w-lg pt-4">
          <p className="text-white/70 text-base md:text-lg leading-relaxed">
            Сегодня пользователь переключается между семью приложениями:
            соцсеть, карты, мессенджер, Tinder, афиша, marketplace, такси.
            Social World собирает эти сценарии в одно пространство и привязывает
            их к реальному городу — здесь и сейчас.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border-hair p-5">
              <div className="section-label mb-3"><span>Старая модель</span></div>
              <p className="font-mono text-sm text-white/60 leading-relaxed">
                user → пост → лайк → пост
              </p>
            </div>
            <div className="rounded-xl border-hair p-5" style={{ background: 'rgba(196,103,124,0.05)' }}>
              <div className="section-label mb-3"><span className="text-clay/70">Новая модель</span></div>
              <p className="font-mono text-sm text-white leading-relaxed">
                user → люди → место →<br />событие → город
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {blocks.map(({ n, Icon, title, desc }) => (
          <article
            key={n}
            className="group relative rounded-2xl border-hair p-7 hover:border-hair-strong transition-colors duration-500"
          >
            <div className="flex items-start justify-between mb-8">
              <span className="font-mono text-xs text-white/40 tracking-widest">{n}</span>
              <Icon className="w-5 h-5 text-clay" strokeWidth={1.4} />
            </div>
            <h3 className="font-instrument text-3xl md:text-4xl text-white mb-3">{title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
            <div className="absolute inset-x-7 bottom-0 h-px bg-gradient-to-r from-transparent via-clay/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </article>
        ))}
      </div>
    </SectionShell>
  )
}
