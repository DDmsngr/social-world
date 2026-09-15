import { useEffect, useRef, useState, type ReactElement } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, Search, Plus, Compass, User, Bookmark, Heart, MessageCircle, MapPin, Sparkles, Camera, Video, Zap, PenLine, Radio, CalendarDays } from 'lucide-react'
import SectionShell from './SectionShell'

const SCREENS = [
  { key: 'home',    label: 'Home',    caption: 'Лента города' },
  { key: 'discover', label: 'Discover', caption: 'Карта · рядом · сейчас' },
  { key: 'create',  label: 'Create',  caption: 'Один тап — любая форма' },
  { key: 'profile', label: 'Profile', caption: 'Репутация и Social Score' },
] as const

type ScreenKey = typeof SCREENS[number]['key']

const IMG = {
  city:     'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80&fit=crop',
  cafe:     'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80&fit=crop',
  concert:  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80&fit=crop',
  friends:  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80&fit=crop',
  avatar:   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80&fit=crop',
  girl:     'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&fit=crop',
  street:   'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=400&q=80&fit=crop',
  seaside:  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80&fit=crop',
  brunch:   'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80&fit=crop',
  night:    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80&fit=crop',
  skate:    'https://images.unsplash.com/photo-1531565637446-32307b194362?w=400&q=80&fit=crop',
  yoga:     'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80&fit=crop',
  book:     'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80&fit=crop',
  running:  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80&fit=crop',
}

function HomeScreen() {
  return (
    <div className="absolute inset-0 flex flex-col text-white">
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <div className="font-instrument text-lg">Сочи</div>
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-white/70" strokeWidth={1.6} />
          <Heart className="w-4 h-4 text-white/70" strokeWidth={1.6} />
        </div>
      </div>
      {/* stories row */}
      <div className="px-5 mb-3 flex gap-2.5 overflow-hidden">
        {[IMG.girl, IMG.avatar, IMG.friends, IMG.cafe, IMG.city].map((src, i) => (
          <div key={i} className="shrink-0 w-11 h-11 rounded-full border border-clay/60 p-[2px]">
            <img src={src} alt="" className="w-full h-full rounded-full object-cover" />
          </div>
        ))}
      </div>
      {/* feed */}
      <div className="flex-1 overflow-hidden px-3">
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-3">
          <div className="relative h-40">
            <img src={IMG.seaside} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-widest uppercase text-white/70">Сейчас · 800 м</div>
                <div className="text-white text-sm font-medium">Роза Хутор — закат</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-clay text-black font-medium">HOT</span>
            </div>
          </div>
          <div className="px-3 py-2 flex items-center justify-between text-[11px] text-white/60">
            <div className="flex items-center gap-1.5"><Heart className="w-3 h-3" strokeWidth={1.6} />342</div>
            <div className="flex items-center gap-1.5"><MessageCircle className="w-3 h-3" strokeWidth={1.6} />47</div>
            <div className="flex items-center gap-1.5"><Bookmark className="w-3 h-3" strokeWidth={1.6} /></div>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <div className="relative h-24">
            <img src={IMG.concert} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3">
              <div className="text-[10px] tracking-widest uppercase text-clay">Событие · сегодня 21:00</div>
              <div className="text-white text-sm">Открытая сцена в порту</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DiscoverScreen() {
  return (
    <div className="absolute inset-0 flex flex-col text-white">
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <div className="font-instrument text-lg">Discover</div>
        <MapPin className="w-4 h-4 text-clay" strokeWidth={1.8} />
      </div>
      <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10">
        <Search className="w-3.5 h-3.5 text-white/60" strokeWidth={1.6} />
        <span className="text-[11px] text-white/60">Люди, места, события</span>
      </div>
      <div className="relative flex-1 mx-3 rounded-2xl overflow-hidden border border-white/10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 60% at 55% 45%, rgba(217,119,87,0.5) 0%, rgba(217,119,87,0.06) 45%, transparent 70%), radial-gradient(35% 45% at 20% 75%, rgba(217,119,87,0.35) 0%, transparent 60%), radial-gradient(30% 40% at 78% 65%, rgba(168,184,156,0.35) 0%, transparent 60%), #0e0709',
          }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 300 400" preserveAspectRatio="none">
          {[...Array(10)].map((_, i) => (
            <path key={`h${i}`} d={`M0 ${30 + i * 35} Q150 ${20 + i * 35 + Math.sin(i) * 10} 300 ${40 + i * 35}`} fill="none" stroke="rgba(236,231,222,0.2)" strokeWidth="0.6" />
          ))}
          {[...Array(7)].map((_, i) => (
            <path key={`v${i}`} d={`M${40 + i * 40} 0 Q${30 + i * 40 + Math.cos(i) * 15} 200 ${50 + i * 40} 400`} fill="none" stroke="rgba(236,231,222,0.15)" strokeWidth="0.5" />
          ))}
        </svg>
        {[
          { x: '48%', y: '38%', tone: 'clay', big: true },
          { x: '25%', y: '62%', tone: 'clay' },
          { x: '72%', y: '58%', tone: 'sage' },
          { x: '35%', y: '25%', tone: 'sage' },
          { x: '60%', y: '22%', tone: 'clay' },
          { x: '82%', y: '75%', tone: 'clay' },
          { x: '18%', y: '80%', tone: 'sage' },
        ].map((p, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y }}>
            <span className={`relative flex ${p.big ? 'h-3 w-3' : 'h-2 w-2'}`}>
              <span className="absolute inset-0 rounded-full opacity-40 animate-ping" style={{ background: p.tone === 'clay' ? '#D97757' : '#A8B89C' }} />
              <span className={`relative inline-flex rounded-full ${p.big ? 'h-3 w-3' : 'h-2 w-2'}`} style={{ background: p.tone === 'clay' ? '#D97757' : '#A8B89C' }} />
            </span>
          </div>
        ))}
        <div className="absolute left-2.5 top-2.5 rounded-xl px-3 py-2 bg-black/45 backdrop-blur border border-white/10">
          <div className="text-[8px] tracking-widest uppercase text-white/50">Пульс</div>
          <div className="font-mono text-white text-lg leading-none">87<span className="text-white/40 text-[10px]">%</span></div>
        </div>
        <div className="absolute right-2.5 bottom-16 rounded-xl bg-black/55 backdrop-blur border border-white/15 px-3 py-2 flex items-center gap-2">
          <img src={IMG.girl} alt="" className="w-6 h-6 rounded-full object-cover" />
          <div>
            <div className="text-[10px] text-white leading-tight">Аня — в 500 м</div>
            <div className="text-[9px] text-clay">Ищет напарника на скейт</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateScreen() {
  return (
    <div className="absolute inset-0 flex flex-col text-white">
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <div className="font-instrument text-lg">Create</div>
        <span className="text-[10px] text-white/50 tracking-widest uppercase">Сочи · сейчас</span>
      </div>
      <div className="px-4 mb-3">
        <div className="rounded-xl border border-white/10 p-3 flex items-center gap-3 bg-white/[0.02]">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-clay/20">
            <Sparkles className="w-4 h-4 text-clay" strokeWidth={1.6} />
          </div>
          <div>
            <div className="text-xs text-white">Идея на сегодня</div>
            <div className="text-[10px] text-white/50">Прогулка вдоль набережной перед закатом</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 flex-1 pb-16">
        {[
          { l: 'Фото',    Icon: Camera,      img: IMG.brunch,  tone: 'clay' },
          { l: 'Видео',   Icon: Video,       img: IMG.street,  tone: 'sage' },
          { l: 'Short',   Icon: Zap,         img: IMG.skate,   tone: 'clay' },
          { l: 'Пост',    Icon: PenLine,     img: IMG.book,    tone: 'sage' },
          { l: 'Live',    Icon: Radio,       img: IMG.night,   tone: 'clay' },
          { l: 'Событие', Icon: CalendarDays,img: IMG.yoga,    tone: 'sage' },
        ].map((x) => (
          <div key={x.l} className="relative rounded-xl overflow-hidden border border-white/10 aspect-[4/5]">
            <img src={x.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-2 left-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur ${x.tone === 'clay' ? 'bg-clay/30' : 'bg-white/15'}`}>
                <x.Icon className="w-3 h-3 text-white" strokeWidth={1.7} />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 text-[11px] text-white font-medium">{x.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileScreen() {
  return (
    <div className="absolute inset-0 flex flex-col text-white">
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <div className="font-instrument text-lg">Profile</div>
        <span className="text-[10px] tracking-widest uppercase text-white/50">@levon</span>
      </div>
      <div className="px-5 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-clay/40">
          <img src={IMG.avatar} alt="" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="font-instrument text-xl leading-tight">Левон</div>
          <div className="text-[10px] text-white/50">Сочи · Центр</div>
        </div>
      </div>
      <div className="px-5 mt-4 grid grid-cols-3 gap-1 text-center">
        {[
          { k: '128',  d: 'постов' },
          { k: '2.4K', d: 'подписчиков' },
          { k: '94',   d: 'Social Score' },
        ].map((s) => (
          <div key={s.d}>
            <div className="font-mono text-white text-base leading-none">{s.k}</div>
            <div className="text-[8px] tracking-widest uppercase text-white/40 mt-1">{s.d}</div>
          </div>
        ))}
      </div>
      <div className="px-5 mt-3">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-[94%] rounded-full" style={{ background: 'linear-gradient(90deg, #d97757, #f0a37e)' }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[8px] tracking-widest uppercase text-white/40">
          <span>Репутация</span><span className="text-clay">94 / 100</span>
        </div>
      </div>
      <div className="mt-4 px-3 grid grid-cols-3 gap-1 flex-1 pb-16 overflow-hidden">
        {[IMG.city, IMG.brunch, IMG.street, IMG.skate, IMG.night, IMG.seaside, IMG.book, IMG.friends, IMG.running].map((src, i) => (
          <div key={i} className="aspect-square rounded-md overflow-hidden bg-white/5">
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}

const SCREEN_COMPONENTS: Record<ScreenKey, () => ReactElement> = {
  home: HomeScreen,
  discover: DiscoverScreen,
  create: CreateScreen,
  profile: ProfileScreen,
}

export default function Product() {
  const [active, setActive] = useState<number>(0)
  const [hover, setHover] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (hover) return
    timerRef.current = window.setTimeout(() => {
      setActive((v) => (v + 1) % SCREENS.length)
    }, 4500)
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current) }
  }, [active, hover])

  const Screen = SCREEN_COMPONENTS[SCREENS[active].key]

  return (
    <SectionShell id="product" index="03" label="Основной продукт">
      <div className="mb-14 md:mb-20 grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-20 items-start">
        <h2 className="font-instrument text-white text-[52px] md:text-[92px] leading-[0.95] tracking-tight">
          Один продукт —<br />
          <span className="serif-italic text-sage">четыре естественных</span><br />
          сценария.
        </h2>
        <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-lg pt-4">
          HOME, DISCOVER, CREATE, PROFILE — четыре раздела, связанных одной картой.
          Без вложенных приложений: контент, знакомства, места и события —
          единая архитектура. Тапни по экрану — экран сменится.
        </p>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 md:gap-16 items-center">
        {/* Phone */}
        <div
          className="flex justify-center order-2 md:order-1"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <button
            type="button"
            aria-label="Показать следующий экран"
            onClick={() => setActive((v) => (v + 1) % SCREENS.length)}
            className="relative group focus:outline-none"
          >
            {/* clay glow */}
            <div className="absolute -inset-16 pointer-events-none" aria-hidden>
              <div className="w-full h-full rounded-full"
                   style={{ background: 'radial-gradient(closest-side, rgba(217,119,87,0.25), transparent 70%)' }} />
            </div>

            <div className="relative w-[300px] h-[620px] rounded-[52px] border-hair-strong bg-ink2 p-3 shadow-[0_60px_120px_-40px_rgba(217,119,87,0.35)]">
              {/* notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black z-30" />

              <div className="relative w-full h-full rounded-[42px] overflow-hidden liquid-glass">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={SCREENS[active].key}
                    initial={{ opacity: 0, scale: 0.98, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -8 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <Screen />
                  </motion.div>
                </AnimatePresence>

                {/* bottom tab bar */}
                <div className="absolute bottom-0 inset-x-0 h-14 flex items-center justify-around border-t border-white/10 bg-black/50 backdrop-blur z-10">
                  {[
                    { Icon: Home,    idx: 0 },
                    { Icon: Compass, idx: 1 },
                    { Icon: Plus,    idx: 2 },
                    { Icon: User,    idx: 3 },
                  ].map(({ Icon, idx }) => (
                    <span
                      key={idx}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        active === idx ? 'bg-clay/25' : ''
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${active === idx ? 'text-clay' : 'text-white/45'}`}
                        strokeWidth={active === idx ? 1.9 : 1.5}
                      />
                    </span>
                  ))}
                </div>
              </div>

              {/* tap hint */}
              <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.28em] uppercase text-white/30 group-hover:text-white/60 transition-colors">
                Тап · чтобы переключить
              </div>
            </div>
          </button>
        </div>

        {/* Screen legend */}
        <div className="order-1 md:order-2 space-y-3">
          {SCREENS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => setActive(i)}
              className={`w-full text-left rounded-2xl border p-5 md:p-6 transition-all duration-500 ${
                active === i
                  ? 'border-white/25 bg-white/[0.03]'
                  : 'border-white/[0.08] hover:border-white/15'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-[11px] tracking-[0.28em] uppercase text-white/40">
                  0{i + 1} · {s.label}
                </span>
                <span
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    active === i ? 'bg-clay' : 'bg-white/20'
                  }`}
                />
              </div>
              <div
                className={`font-instrument text-2xl md:text-3xl leading-tight transition-colors duration-500 ${
                  active === i ? 'text-white' : 'text-white/45'
                }`}
              >
                {s.caption}
              </div>
              {active === i && (
                <motion.div
                  layoutId="screen-progress"
                  className="mt-4 h-[2px] rounded-full bg-white/10 overflow-hidden"
                >
                  <motion.div
                    key={`${i}-${active}`}
                    initial={{ width: 0 }}
                    animate={{ width: hover ? '20%' : '100%' }}
                    transition={{ duration: hover ? 0.4 : 4.4, ease: 'linear' }}
                    className="h-full bg-clay"
                  />
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
