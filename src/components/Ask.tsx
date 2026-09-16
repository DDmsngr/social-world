import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import SectionShell from './SectionShell'

const allocation = [
  { label: 'Разработка платформы', percent: 45, tone: 'clay' as const },
  { label: 'Команда и найм',       percent: 25, tone: 'clay' as const },
  { label: 'Пилот и рост в Сочи',  percent: 20, tone: 'sage' as const },
  { label: 'Операции и юридика',   percent: 10, tone: 'sage' as const },
]

export default function Ask() {
  return (
    <SectionShell id="ask" index="10" label="Инвестиционный запрос">
      <div className="mb-16 md:mb-24 grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-20 items-start">
        <h2 className="font-instrument text-white text-[52px] md:text-[92px] leading-[0.95] tracking-tight">
          Seed раунд —<br />
          <span className="serif-italic text-clay">18 месяцев</span><br />
          до пилота и метрик.
        </h2>
        <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-lg pt-4">
          Открыт разговор с фондами, ангелами и стратегическими партнёрами.
          Цель раунда — довести продукт до MVP в Сочи, подтвердить ключевые
          метрики и подготовить экспансию на второй город.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        {/* Big ask card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl border-hair-strong p-8 md:p-12 overflow-hidden"
          style={{
            background:
              'radial-gradient(80% 60% at 20% 0%, rgba(122,36,54,0.22), transparent 60%), radial-gradient(60% 60% at 100% 100%, rgba(79,167,122,0.10), transparent 60%), #151417',
          }}
        >
          <div className="flex items-baseline justify-between mb-10">
            <div className="section-label"><span>Round</span></div>
            <span className="font-mono text-[10px] tracking-[0.24em] uppercase text-white/40">
              Open · 2026
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-10 mb-12">
            <div>
              <div className="text-[10px] tracking-[0.28em] uppercase text-white/40 mb-3">Раунд</div>
              <div className="font-instrument text-white text-6xl md:text-7xl leading-none">
                $2.5M
              </div>
              <div className="text-white/45 text-sm mt-3">SAFE или equity, на 18 месяцев</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.28em] uppercase text-white/40 mb-3">Оценка</div>
              <div className="font-instrument text-white text-6xl md:text-7xl leading-none">
                <span className="serif-italic text-clay">$15M</span>
              </div>
              <div className="text-white/45 text-sm mt-3">pre-money, обсуждаемо</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
            {[
              { k: '18',      d: 'месяцев рантвея' },
              { k: '1 город', d: 'подтверждение метрик' },
              { k: '3+',      d: 'источника выручки' },
            ].map((x) => (
              <div key={x.d}>
                <div className="font-instrument text-white text-3xl leading-none">{x.k}</div>
                <div className="text-white/50 text-[11px] tracking-widest uppercase mt-2">{x.d}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Use of funds */}
        <div className="rounded-3xl border-hair p-8 md:p-10">
          <div className="section-label mb-8"><span>Использование средств</span></div>
          <div className="space-y-6">
            {allocation.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-white text-sm">{a.label}</span>
                  <span className="font-mono text-white text-lg">
                    {a.percent}<span className="text-white/40 text-xs">%</span>
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${a.percent}%` }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 1.1, delay: 0.25 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      background:
                        a.tone === 'clay'
                          ? 'linear-gradient(90deg, #7a2436, #c4677c)'
                          : 'linear-gradient(90deg, #4fa77a, #7fc9a3)',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <a
            href="#contact"
            className="mt-10 inline-flex items-center gap-3 bg-white text-black px-6 py-3.5 rounded-full font-medium text-sm tracking-wide hover:bg-white/90 transition-all duration-300"
          >
            Запросить питч-дек
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.6} />
          </a>
        </div>
      </div>
    </SectionShell>
  )
}
