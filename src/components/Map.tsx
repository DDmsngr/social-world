import SectionShell from './SectionShell'

const districts = [
  { name: 'Центр',    pulse: 94, delta: '+18%', tone: 'clay' as const },
  { name: 'Адлер',    pulse: 81, delta: '+11%', tone: 'clay' as const },
  { name: 'Хоста',    pulse: 64, delta: '+4%',  tone: 'sage' as const },
  { name: 'Мамайка',  pulse: 52, delta: '−2%',  tone: 'muted' as const },
]

export default function Map() {
  return (
    <SectionShell id="map" index="04" label="Пульс города">
      <div className="mb-16 md:mb-24 grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-20 items-start">
        <h2 className="font-instrument text-white text-[52px] md:text-[92px] leading-[0.95] tracking-tight">
          Карта <span className="serif-italic text-sage">объединяет</span><br />
          людей, места<br />
          и активность.
        </h2>
        <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-lg pt-4">
          Обезличенные данные о геолокации превращаются в живой пульс города.
          Куда идут люди, где растёт активность, где рождаются локальные тренды —
          видно на одной карте. С соблюдением требований приватности.
        </p>
      </div>

      <div className="grid md:grid-cols-[1.4fr_1fr] gap-6 md:gap-10">
        {/* Map preview */}
        <div className="relative rounded-3xl overflow-hidden border-hair aspect-[4/3] md:aspect-auto md:min-h-[520px]">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 55% at 55% 45%, rgba(196,103,124,0.35) 0%, rgba(196,103,124,0.06) 45%, transparent 70%), radial-gradient(35% 40% at 25% 70%, rgba(196,103,124,0.20) 0%, transparent 60%), radial-gradient(30% 35% at 78% 65%, rgba(110,155,196,0.20) 0%, transparent 60%), #151417',
            }}
          />
          {/* streets */}
          <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 800 600" preserveAspectRatio="none">
            {[...Array(12)].map((_, i) => (
              <path
                key={`h${i}`}
                d={`M0 ${50 + i * 45} Q400 ${30 + i * 45 + Math.sin(i) * 20} 800 ${60 + i * 45}`}
                fill="none"
                stroke="rgba(236,231,222,0.15)"
                strokeWidth="0.8"
              />
            ))}
            {[...Array(10)].map((_, i) => (
              <path
                key={`v${i}`}
                d={`M${60 + i * 80} 0 Q${40 + i * 80 + Math.cos(i) * 20} 300 ${80 + i * 80} 600`}
                fill="none"
                stroke="rgba(236,231,222,0.12)"
                strokeWidth="0.6"
              />
            ))}
          </svg>
          {/* pins */}
          {[
            { x: '52%', y: '46%', tone: 'clay' },
            { x: '28%', y: '68%', tone: 'clay' },
            { x: '76%', y: '62%', tone: 'sage' },
            { x: '38%', y: '32%', tone: 'sage' },
            { x: '64%', y: '30%', tone: 'clay' },
            { x: '18%', y: '42%', tone: 'sage' },
            { x: '82%', y: '38%', tone: 'clay' },
          ].map((p, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: p.x, top: p.y }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="absolute inset-0 rounded-full opacity-40 animate-ping"
                  style={{ background: p.tone === 'clay' ? '#c4677c' : '#6e9bc4' }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ background: p.tone === 'clay' ? '#c4677c' : '#6e9bc4' }}
                />
              </span>
            </div>
          ))}
          {/* metric card overlay */}
          <div className="absolute left-6 top-6 rounded-2xl liquid-glass p-4 min-w-[180px]">
            <div className="section-label mb-1"><span>City pulse</span></div>
            <div className="font-mono text-4xl text-white">87<span className="text-lg text-white/40">%</span></div>
            <div className="text-[10px] text-white/50 tracking-widest uppercase mt-1">Активность города</div>
          </div>
          {/* legend */}
          <div className="absolute right-6 bottom-6 rounded-2xl liquid-glass px-4 py-3 flex items-center gap-4 text-[10px] tracking-widest uppercase text-white/60">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-clay" /> Люди</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-sage" /> Места</span>
          </div>
        </div>

        {/* Districts + business cards */}
        <div className="space-y-4">
          <div className="rounded-2xl border-hair p-6">
            <div className="section-label mb-6"><span>Разбивка по районам</span></div>
            <div className="space-y-4">
              {districts.map((d) => (
                <div key={d.name}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-white text-sm">{d.name}</span>
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-white text-lg">{d.pulse}<span className="text-white/40 text-xs">/100</span></span>
                      <span
                        className={
                          'font-mono text-xs ' +
                          (d.tone === 'clay' ? 'text-clay' : d.tone === 'sage' ? 'text-sage' : 'text-white/40')
                        }
                      >
                        {d.delta}
                      </span>
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.pulse}%`,
                        background:
                          d.tone === 'clay'
                            ? 'linear-gradient(90deg, #7a2436, #c4677c)'
                            : d.tone === 'sage'
                            ? 'linear-gradient(90deg, #4fa77a, #7fc9a3)'
                            : 'rgba(255,255,255,0.35)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-hair p-6">
            <div className="section-label mb-3"><span>Business layer</span></div>
            <p className="text-white/80 text-sm leading-relaxed">
              Профиль бизнеса, публикации, события, продвижение и аналитика встроены в карту.
              Реклама = <span className="text-clay">человек</span> + <span className="text-sage">место</span> + время + интерес.
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
