import SectionShell from './SectionShell'

const hypotheses = [
  { h: 'H1', text: 'Людям интересно видеть людей и активность рядом.' },
  { h: 'H2', text: 'Люди готовы участвовать в реальных квестах и задачах.' },
  { h: 'H3', text: 'После первого взаимодействия хочется продолжать общение.' },
  { h: 'H4', text: 'Репутация помогает формировать доверие в городе.' },
]

const kpis = [
  { k: '100 000+',  d: 'регистраций'    },
  { k: '20 000+',   d: 'DAU'             },
  { k: '25%+',      d: 'D30'             },
  { k: '30%',       d: 'создают контент' },
  { k: '15 мин',    d: 'на сессию'       },
  { k: '10 000+',   d: 'мест'            },
]

export default function Mvp() {
  return (
    <SectionShell id="mvp" index="05" label="MVP">
      <div className="mb-16 md:mb-24 grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-20 items-start">
        <h2 className="font-instrument text-white text-[52px] md:text-[92px] leading-[0.95] tracking-tight">
          Доказать главное<br />
          <span className="serif-italic text-clay">поведение</span><br />
          пользователя.
        </h2>
        <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-lg pt-4">
          Первый пилот — один город. Сочи. Регистрация, профиль, лента,
          карта, места, события, базовая репутация. Без токенов, без AI, без
          «мне нужно электрика». Проверяем, идут ли люди в эту схему в принципе.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {hypotheses.map(({ h, text }, i) => (
          <div key={h} className="rounded-2xl border-hair p-6 relative overflow-hidden">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-mono text-clay text-sm">{h}</span>
              <span className="font-mono text-white/25 text-xs">гипотеза</span>
            </div>
            <p className="font-instrument text-2xl md:text-[26px] text-white leading-snug">{text}</p>
            <span className="absolute right-6 bottom-4 font-mono text-white/10 text-6xl leading-none">
              0{i + 1}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border-hair p-8 md:p-12">
        <div className="flex items-baseline justify-between mb-8">
          <div className="section-label"><span>Целевые метрики MVP</span></div>
          <span className="font-mono text-xs text-white/30">SOCHI · 12 MO</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
          {kpis.map((x) => (
            <div key={x.d}>
              <div className="font-instrument text-white text-4xl md:text-5xl leading-none">{x.k}</div>
              <div className="mt-2 text-[10px] tracking-widest uppercase text-white/50">{x.d}</div>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
