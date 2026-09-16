import { useEffect, useState } from 'react'

const links = [
  { href: '#idea',      label: 'Идея' },
  { href: '#product',   label: 'Продукт' },
  { href: '#map',       label: 'Карта' },
  { href: '#economy',   label: 'Экономика' },
  { href: '#roadmap',   label: 'Roadmap' },
  { href: '#ask',       label: 'Раунд' },
]

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(10, 6, 8, 0.72)' : 'transparent',
          backdropFilter: scrolled ? 'blur(18px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        <a href="#top" className="font-dancing text-white text-2xl md:text-3xl leading-none select-none">
          Social World
        </a>

        <div className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-inter text-white/80 hover:text-white text-sm tracking-wide transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <a
          href="#contact"
          className="hidden lg:inline-flex shrink-0 whitespace-nowrap bg-white text-black px-5 py-2.5 rounded-full font-medium text-[13px] tracking-wide hover:bg-white/90 transition-all duration-300"
        >
          Написать основателю
        </a>

        {/* Burger (mobile) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          className="lg:hidden relative w-8 h-8 flex items-center justify-center"
        >
          <span
            className="absolute block h-[1.5px] w-6 bg-white"
            style={{
              transform: open ? 'translateY(0) rotate(45deg)' : 'translateY(-9px) rotate(0)',
              transition: `transform 400ms ${EASE}`,
            }}
          />
          <span
            className="absolute block h-[1.5px] w-6 bg-white"
            style={{
              opacity: open ? 0 : 1,
              transform: open ? 'scale(0)' : 'scale(1)',
              transition: `opacity 300ms ${EASE}, transform 300ms ${EASE}`,
            }}
          />
          <span
            className="absolute block h-[1.5px] w-6 bg-white"
            style={{
              transform: open ? 'translateY(0) rotate(-45deg)' : 'translateY(9px) rotate(0)',
              transition: `transform 400ms ${EASE}`,
            }}
          />
        </button>
      </nav>

      {/* Mobile menu panel */}
      <div
        className="fixed inset-0 z-40 lg:hidden pointer-events-none"
        style={{ opacity: open ? 1 : 0, transition: `opacity 300ms ${EASE}` }}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-black/50"
          style={{ pointerEvents: open ? 'auto' : 'none' }}
          onClick={() => setOpen(false)}
        />
        <aside
          className="absolute top-0 right-0 h-full w-[85%] max-w-[340px] bg-[#151417]/95 backdrop-blur-xl border-l border-white/10 flex flex-col pt-24 px-8"
          style={{
            transform: open ? 'translateX(0)' : 'translateX(100%)',
            transition: `transform 500ms ${EASE}`,
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          <div className="flex flex-col gap-6">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-inter text-white text-2xl tracking-wide"
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateX(0)' : 'translateX(30px)',
                  transition: `opacity 500ms ${EASE} ${150 + i * 75}ms, transform 500ms ${EASE} ${150 + i * 75}ms`,
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="mt-auto mb-10 inline-flex justify-center bg-white text-black px-6 py-3.5 rounded-full font-medium text-sm tracking-wide"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(10px)',
              transition: `opacity 500ms ${EASE} 450ms, transform 500ms ${EASE} 450ms`,
            }}
          >
            Написать основателю
          </a>
        </aside>
      </div>
    </>
  )
}
