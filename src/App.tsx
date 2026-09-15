import Hero from './components/Hero'
import QuoteSection from './components/QuoteSection'
import Idea from './components/Idea'
import Differentiators from './components/Differentiators'
import Product from './components/Product'
import Map from './components/Map'
import Mvp from './components/Mvp'
import Economy from './components/Economy'
import Scale from './components/Scale'
import Roadmap from './components/Roadmap'
import Team from './components/Team'
import Ask from './components/Ask'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="bg-ink grain min-h-screen">
      <Hero />
      <QuoteSection />
      <Idea />
      <Differentiators />
      <Product />
      <Map />
      <Mvp />
      <Economy />
      <Scale />
      <Roadmap />
      <Team />
      <Ask />
      <Footer />
    </div>
  )
}
