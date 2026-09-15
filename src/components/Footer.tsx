export default function Footer() {
  return (
    <footer id="contact" className="relative px-6 md:px-12 lg:px-20 py-24 md:py-32 border-t border-white/[0.08]">
      <div className="mx-auto max-w-7xl grid md:grid-cols-[1.4fr_1fr] gap-16 md:gap-20">
        <div>
          <div className="section-label mb-10"><span>Контакт</span></div>
          <h2 className="font-instrument text-white text-[64px] md:text-[128px] leading-[0.9] tracking-tight">
            Social<br />
            <span className="serif-italic text-clay">World</span>
          </h2>
          <p className="mt-8 text-white/60 text-base md:text-lg max-w-md leading-relaxed">
            The social network that becomes a city.<br />
            Люди, места, события, город, бизнес и цифровая экономика —
            в одной платформе.
          </p>
        </div>

        <div className="flex flex-col justify-end">
          <div className="section-label mb-6"><span>Основатель</span></div>
          <div className="font-dancing text-white text-5xl md:text-6xl leading-none mb-4">
            Согомонян Левон
          </div>
          <div className="mt-6 space-y-2">
            <a
              href="mailto:Levon.habez@bk.ru"
              className="block font-mono text-sm text-white/80 hover-underline w-fit"
            >
              Levon.habez@bk.ru
            </a>
            <a
              href="tel:+79898575755"
              className="block font-mono text-sm text-white/80 hover-underline w-fit"
            >
              +7 989 857-57-55
            </a>
          </div>

          <div className="mt-12 flex items-center gap-3 text-[10px] font-mono tracking-[0.24em] uppercase text-white/30">
            <span>Sochi · Russia</span>
            <span>·</span>
            <span>2026</span>
            <span>·</span>
            <span>v0.1</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
