import { useEffect, useRef } from 'react'

const clamp = (min: number, max: number, v: number) =>
  Math.max(min, Math.min(max, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export default function QuoteSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const glowRef = useRef<HTMLDivElement | null>(null)
  const quoteRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let raf = 0
    const state = { glowY: 40, quoteY: 40 }

    const tick = () => {
      const section = sectionRef.current
      if (!section) { raf = requestAnimationFrame(tick); return }

      const rect = section.getBoundingClientRect()
      const winH = window.innerHeight
      const progress = clamp(0, 1, (winH - rect.top) / (winH + rect.height))

      const glowTarget  = 40 + (-40 - 40) * progress
      const quoteTarget = 30 + (-30 - 30) * progress

      state.glowY  = lerp(state.glowY,  glowTarget,  0.06)
      state.quoteY = lerp(state.quoteY, quoteTarget, 0.08)

      if (glowRef.current)
        glowRef.current.style.transform = `translate3d(-50%, ${state.glowY}px, 0)`
      if (quoteRef.current)
        quoteRef.current.style.transform = `translate3d(0, ${state.quoteY}px, 0)`

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-6 md:px-12"
      style={{ background: 'radial-gradient(120% 80% at 50% 50%, #302029 0%, #21151d 60%)' }}
    >
      {/* subtle horizontal hairlines top / bottom of the section */}
      <div className="absolute top-24 left-0 right-0 divider-x" />
      <div className="absolute bottom-24 left-0 right-0 divider-x" />

      {/* clay glow behind quote */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[900px] rounded-full will-change-transform"
        style={{
          background: 'radial-gradient(closest-side, rgba(232,155,186,0.18), rgba(232,155,186,0) 70%)',
          transform: 'translate3d(-50%, 40px, 0)',
          filter: 'blur(20px)',
        }}
      />

      {/* faint co-ordinate grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(closest-side at 50% 50%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(closest-side at 50% 50%, black 20%, transparent 70%)',
        }}
      />

      <div
        ref={quoteRef}
        className="relative z-10 max-w-5xl mx-auto text-center will-change-transform"
      >
        <div className="section-label justify-center mx-auto mb-10 md:mb-14">
          <span className="font-mono text-clay">00</span>
          <span>Манифест</span>
        </div>

        <blockquote className="font-instrument text-white text-3xl sm:text-5xl md:text-6xl lg:text-[76px] leading-[1.08] tracking-tight">
          <span className="serif-italic text-clay">«</span>Мы не строим<br className="hidden md:block" />
          <span className="serif-italic"> ещё одну соцсеть</span>.<br />
          Мы делаем цифровой<br className="hidden md:block" />
          слой реального города<span className="serif-italic text-clay">»</span>
        </blockquote>

        <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
          <span className="font-dancing text-white text-3xl md:text-4xl leading-none">
            Согомонян Левон
          </span>
          <span className="hidden md:inline h-4 w-px bg-white/20" />
          <span className="font-mono text-[11px] tracking-[0.28em] uppercase text-white/50">
            Founder · 2026
          </span>
        </div>
      </div>
    </section>
  )
}
