import { motion } from 'framer-motion'
import { Compass, Code2, LineChart, PenTool } from 'lucide-react'
import SectionShell from './SectionShell'

const roles = [
  {
    Icon: Compass,
    role: 'Product & Vision',
    person: 'Согомонян Левон',
    note: 'Основатель, автор концепции. Отвечает за продукт, партнёрства и стратегию городов.',
    filled: true,
  },
  {
    Icon: Code2,
    role: 'CTO',
    person: 'В поиске',
    note: 'Опыт в highload и геосервисах. Строит платформу: карта, реалтайм, приватность.',
    filled: false,
  },
  {
    Icon: PenTool,
    role: 'Design Lead',
    person: 'В поиске',
    note: 'Отвечает за дизайн-систему и то, чтобы продукт ощущался как часть города.',
    filled: false,
  },
  {
    Icon: LineChart,
    role: 'Growth',
    person: 'В поиске',
    note: 'Реферальная экономика, локальные партнёрства, метрики MVP по Сочи.',
    filled: false,
  },
]

export default function Team() {
  return (
    <SectionShell id="team" index="09" label="Команда">
      <div className="mb-16 md:mb-24 grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-20 items-start">
        <h2 className="font-instrument text-white text-[52px] md:text-[92px] leading-[0.95] tracking-tight">
          Небольшая команда,<br />
          <span className="serif-italic text-sage">короткие циклы,</span><br />
          понятные роли.
        </h2>
        <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-lg pt-4">
          На старте — четыре роли, каждая закрывает конкретный риск. Продукт,
          технологии, дизайн и рост. Дальше — фокус на пилот и найм под метрики,
          а не под общий рост штата.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map(({ Icon, role, person, note, filled }, i) => (
          <motion.article
            key={role}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border-hair p-7 relative overflow-hidden group"
          >
            <div className="flex items-start justify-between mb-10">
              <Icon className="w-5 h-5 text-clay" strokeWidth={1.4} />
              <span
                className={
                  'font-mono text-[10px] tracking-[0.24em] uppercase ' +
                  (filled ? 'text-sage' : 'text-white/40')
                }
              >
                {filled ? 'Активна' : 'Открыта'}
              </span>
            </div>
            <div className="text-[10px] tracking-[0.28em] uppercase text-white/40 mb-2">{role}</div>
            <div className="font-instrument text-white text-2xl leading-tight mb-4">{person}</div>
            <p className="text-white/55 text-sm leading-relaxed">{note}</p>
            <div className="absolute inset-x-7 bottom-0 h-px bg-gradient-to-r from-transparent via-clay/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </motion.article>
        ))}
      </div>
    </SectionShell>
  )
}
