import { motion } from 'framer-motion'
import SectionShell from './SectionShell'

type Milestone = {
  year: string
  quarter: string
  phase: string
  title: string
  points: string[]
  status: 'now' | 'next' | 'future'
}

const milestones: Milestone[] = [
  {
    year: '2026',
    quarter: 'Q3',
    phase: 'Discovery',
    title: 'Прототип и питч',
    points: [
      'Финальная концепция и техническое задание',
      'Дизайн-система, ключевые экраны, интерактивные макеты',
      'Формирование core-команды',
    ],
    status: 'now',
  },
  {
    year: '2027',
    quarter: 'Q1–Q2',
    phase: 'MVP',
    title: 'Пилот — Сочи',
    points: [
      'Регистрация, профиль, лента, карта',
      'Места, события, базовая репутация',
      'Первые 10 000 пользователей и 1 000 мест',
    ],
    status: 'next',
  },
  {
    year: '2027',
    quarter: 'Q4',
    phase: 'Growth',
    title: 'Наращивание базы',
    points: [
      '100 000+ регистраций',
      '20 000+ DAU и D30 = 25%',
      'Первые рекламодатели и монетизация',
    ],
    status: 'next',
  },
  {
    year: '2028',
    quarter: 'Q2',
    phase: 'Expand',
    title: '10 городов',
    points: [
      'Развёртывание в городах-миллионниках РФ',
      'Локальный бизнес-слой и события',
      'Внутренняя экономика Social Score',
    ],
    status: 'future',
  },
  {
    year: '2029',
    quarter: '—',
    phase: 'Scale',
    title: '100 городов',
    points: [
      'Экспансия СНГ и MENA',
      'Digital real estate и creator economy',
      'Реферальная экономика на полной мощности',
    ],
    status: 'future',
  },
  {
    year: '2030+',
    quarter: '—',
    phase: 'Global',
    title: 'Виртуальный мир',
    points: [
      'Единый глобальный цифровой слой',
      'Полноценная валютная система, staking',
      'Партнёрства с городами и государствами',
    ],
    status: 'future',
  },
]

const dotColor = (s: Milestone['status']) =>
  s === 'now' ? '#e89bba' : s === 'next' ? '#75c9a5' : 'rgba(255,248,240,0.35)'

const statusLabel: Record<Milestone['status'], string> = {
  now: 'В работе',
  next: 'Ближайший релиз',
  future: 'На горизонте',
}

export default function Roadmap() {
  return (
    <SectionShell id="roadmap" index="08" label="Дорожная карта">
      <div className="mb-16 md:mb-24 grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-20 items-start">
        <h2 className="font-instrument text-white text-[52px] md:text-[92px] leading-[0.95] tracking-tight">
          От Сочи<br />
          <span className="serif-italic text-clay">до глобального</span><br />
          цифрового слоя.
        </h2>
        <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-lg pt-4">
          План на 4 года. Каждая веха отвечает на конкретный вопрос: работает ли
          модель, работает ли масштабирование, работает ли экономика.
          Идём короткими циклами и не открываем следующий город, пока предыдущий
          не подтвердил метрики.
        </p>
      </div>

      {/* Desktop / tablet: horizontal rail */}
      <div className="hidden md:block relative">
        {/* rail */}
        <div className="absolute left-0 right-0 top-[92px] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="grid grid-cols-6 gap-4">
          {milestones.map((m, i) => (
            <motion.div
              key={`${m.year}-${m.quarter}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-white/40 mb-2">
                {m.year} · {m.quarter}
              </div>
              <div className="font-instrument text-white text-2xl leading-tight mb-6">{m.phase}</div>
              {/* dot on rail */}
              <div
                className="relative w-3 h-3 rounded-full ring-4"
                style={{
                  background: dotColor(m.status),
                  boxShadow: m.status === 'now' ? '0 0 24px rgba(232,155,186,0.6)' : 'none',
                  // @ts-expect-error css var support
                  '--tw-ring-color': '#21151d',
                }}
              />
              <div className="mt-6 rounded-2xl border-hair p-5 w-full text-left min-h-[220px]">
                <div className="section-label mb-3">
                  <span
                    className={
                      m.status === 'now'
                        ? 'text-clay'
                        : m.status === 'next'
                        ? 'text-sage'
                        : 'text-white/45'
                    }
                  >
                    {statusLabel[m.status]}
                  </span>
                </div>
                <div className="font-instrument text-white text-xl leading-tight mb-4">{m.title}</div>
                <ul className="space-y-1.5 text-white/60 text-[13px] leading-relaxed">
                  {m.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="text-white/25 mt-1.5 shrink-0">·</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical timeline */}
      <div className="md:hidden relative pl-6">
        <div className="absolute left-1.5 top-2 bottom-2 w-px bg-white/10" />
        <div className="space-y-8">
          {milestones.map((m) => (
            <div key={`${m.year}-${m.quarter}-mob`} className="relative">
              <span
                className="absolute -left-[22px] top-2 block w-3 h-3 rounded-full"
                style={{
                  background: dotColor(m.status),
                  boxShadow: m.status === 'now' ? '0 0 20px rgba(232,155,186,0.6)' : 'none',
                }}
              />
              <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-white/40 mb-1">
                {m.year} · {m.quarter}
              </div>
              <div className="font-instrument text-white text-2xl leading-tight mb-3">
                {m.phase} — <span className="serif-italic text-clay/90">{m.title}</span>
              </div>
              <ul className="space-y-1.5 text-white/60 text-sm leading-relaxed">
                {m.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-white/25 mt-1.5 shrink-0">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
