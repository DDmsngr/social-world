import SectionShell from './SectionShell'

const streams = [
  { n: '01', title: 'Business advertising',  desc: 'Реклама, продвижение, размещение мест, события и аналитика.' },
  { n: '02', title: 'Creator economy',       desc: 'Аудитория, контент, подписки, цифровые пространства и продукты.' },
  { n: '03', title: 'Digital real estate',   desc: 'Коммерциализация цифровых территорий и премиум-размещений.' },
  { n: '04', title: 'Внутренняя экономика',  desc: 'Собственная валютная система Social World: баллы репутации → инструменты.' },
  { n: '05', title: 'Staking',               desc: 'Позднее — после формирования масштабной базы пользователей.' },
]

export default function Economy() {
  return (
    <SectionShell id="economy" index="06" label="Экономика">
      <div className="mb-16 md:mb-24 grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-20 items-start">
        <h2 className="font-instrument text-white text-[52px] md:text-[92px] leading-[0.95] tracking-tight">
          Экономика<br />
          <span className="serif-italic text-clay">поверх</span><br />
          социальной жизни.
        </h2>
        <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-lg pt-4">
          Реклама перестаёт быть баннером. «Вы рядом — сегодня скидка 20%»,
          «Событие в 500 м». Ценность растёт вместе с активностью пользователей,
          количеством мест и качеством локальных данных.
        </p>
      </div>

      <div className="divide-y divide-white/[0.08] border-t border-b border-white/[0.08]">
        {streams.map(({ n, title, desc }) => (
          <div
            key={n}
            className="group grid md:grid-cols-[80px_1.5fr_2fr_auto] items-center gap-6 py-6 md:py-8 px-2 md:px-4 hover:bg-white/[0.02] transition-colors duration-500"
          >
            <span className="font-mono text-clay text-sm">{n}</span>
            <div>
              <div className="text-[10px] tracking-widest uppercase text-white/40 mb-1">Stream</div>
              <div className="font-instrument text-white text-2xl md:text-3xl leading-tight">{title}</div>
            </div>
            <p className="text-white/60 text-sm md:text-base leading-relaxed">{desc}</p>
            <span className="hidden md:inline-block font-mono text-xs text-white/20 group-hover:text-white/50 transition-colors">
              →
            </span>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
