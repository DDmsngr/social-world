import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  id?: string
  index: string
  label: string
  children: ReactNode
  className?: string
}

export default function SectionShell({ id, index, label, children, className = '' }: Props) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      id={id}
      className={`relative px-6 md:px-12 lg:px-20 py-24 md:py-32 ${className}`}
    >
      <div className="mx-auto max-w-7xl">
        <div
          className="mb-10 md:mb-16 flex items-baseline justify-between gap-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 700ms cubic-bezier(0.22,1,0.36,1), transform 700ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <span className="section-label">
            <span className="font-mono text-clay">{index}</span>
            <span>{label}</span>
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-white/25 hidden md:inline">
            SOCIAL·WORLD / v0.1
          </span>
        </div>

        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 900ms cubic-bezier(0.22,1,0.36,1) 120ms, transform 900ms cubic-bezier(0.22,1,0.36,1) 120ms',
          }}
        >
          {children}
        </div>
      </div>
    </section>
  )
}
