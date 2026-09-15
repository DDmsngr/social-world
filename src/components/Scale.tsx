import SectionShell from './SectionShell'

const steps = [
  { s: '1',    t: '1 city',      d: 'MVP · соцграф · карта' },
  { s: '10',   t: '10 cities',   d: 'Локальный бизнес · события · пульс' },
  { s: '100',  t: '100 cities',  d: 'Digital real estate · creator economy' },
  { s: '∞',    t: 'Global',      d: 'Virtual world · internal economy' },
]

export default function Scale() {
  return (
    <SectionShell id="scale" index="07" label="Масштаб">
      <div className="mb-16 md:mb-24 grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-20 items-start">
        <h2 className="font-instrument text-white text-[52px] md:text-[92px] leading-[0.95] tracking-tight">
          One City.<br />
          <span className="serif-italic text-sage">One Network.</span><br />
          One Digital World.
        </h2>
        <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-lg pt-4">
          Не строим сразу Facebook. Один город → 10 → 100 → мир. Реферальная
          экономика ускоряет рост в 3–5 раз против классических соцсетей.
          После миллиона пользователей запускается вторичный слой экономики.
        </p>
      </div>

      {/* Real → Digital → Virtual */}
      <div className="mb-16 md:mb-24">
        <div className="section-label mb-8"><span>Слои города</span></div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { l: 'Real city',    sub: 'улицы · здания · люди · места',           tone: 'sage' },
            { l: 'Digital city', sub: 'контент · события · сообщества',           tone: 'clay' },
            { l: 'Virtual city', sub: 'creator spaces · экономика · доверие',     tone: 'clay' },
          ].map((x, i) => (
            <div key={x.l} className="relative rounded-2xl border-hair p-8 min-h-[180px]">
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-xs text-white/40">L{i + 1}</span>
                <span
                  className={
                    'font-mono text-[10px] tracking-widest uppercase ' +
                    (x.tone === 'clay' ? 'text-clay' : 'text-sage')
                  }
                >
                  layer
                </span>
              </div>
              <div className="font-instrument text-white text-3xl md:text-4xl leading-tight">{x.l}</div>
              <div className="mt-3 text-white/50 text-sm">{x.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scale steps */}
      <div className="section-label mb-8"><span>Референс роста</span></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {steps.map((s, i) => (
          <div key={s.t} className="relative rounded-2xl border-hair p-7 overflow-hidden">
            <div className="font-mono text-clay text-xs mb-6">STEP·0{i + 1}</div>
            <div className="font-instrument text-white text-6xl md:text-7xl leading-none tracking-tight mb-4">
              {s.s}
            </div>
            <div className="text-white text-sm">{s.t}</div>
            <div className="text-white/45 text-xs mt-1 leading-relaxed">{s.d}</div>
          </div>
        ))}
      </div>

      {/* Referral flow */}
      <div className="mt-16 md:mt-20 rounded-3xl border-hair p-8 md:p-10">
        <div className="section-label mb-6"><span>Реферальная экономика</span></div>
        <div className="flex flex-wrap items-center gap-3 md:gap-5">
          {['USER', 'INVITE', 'NEW USER', 'ACTIVITY', 'REWARD'].map((n, i, arr) => (
            <div key={n} className="flex items-center gap-3 md:gap-5">
              <span
                className={
                  'font-mono text-xs tracking-[0.2em] px-4 py-2 rounded-full border-hair-strong ' +
                  (i === arr.length - 1 ? 'text-clay' : 'text-white/80')
                }
              >
                {n}
              </span>
              {i < arr.length - 1 && <span className="text-white/25">·</span>}
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
