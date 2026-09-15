import Navbar from './Navbar'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4'

export default function Hero() {
  return (
    <section id="top" className="relative h-screen w-full overflow-hidden">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20" />

      <Navbar />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center -mt-[120px] px-6 z-10">
        <h1 className="font-instrument text-white text-[36px] md:text-7xl lg:text-[110px] leading-[0.9] tracking-tight text-center text-glow">
          The network<br />that becomes a city.
        </h1>

        <p className="font-inter text-white/70 text-sm md:text-base text-center mt-5 md:mt-7 max-w-xl leading-relaxed">
          Люди, места, события и репутация — на живой карте города.
          Не лента постов, а цифровой слой реальной жизни здесь и сейчас.
        </p>

        <a
          href="#idea"
          className="mt-6 md:mt-9 inline-flex bg-white text-black px-8 py-3.5 rounded-full font-medium text-sm tracking-wide hover:bg-white/90 transition-all duration-300 button-glow"
        >
          Открыть концепцию
        </a>
      </div>

      {/* Sound indicator (desktop) */}
      <div className="hidden md:flex absolute bottom-8 left-8 items-center gap-3 z-10">
        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
          <span className="block h-[1.5px] w-3.5 bg-white/70" />
        </div>
        <div className="flex flex-col leading-tight text-white/60 text-xs">
          <span>Experience</span>
          <span>with sound</span>
        </div>
      </div>
    </section>
  )
}
