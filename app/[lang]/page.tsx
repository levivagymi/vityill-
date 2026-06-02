import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from './dictionaries'
import { DictProvider } from '@/components/providers/DictProvider'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/sections/Hero'
import CinematicStory from '@/components/sections/CinematicStory'
import About from '@/components/sections/About'
import Amenities from '@/components/sections/Amenities'
import Rooms from '@/components/sections/Rooms'
import Gallery from '@/components/sections/Gallery'
import Booking from '@/components/sections/Booking'
import Location from '@/components/sections/Location'
import Testimonials from '@/components/sections/Testimonials'

export default async function LangPage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <DictProvider dict={dict}>
      <Navbar />
      <main>
        <Hero />
        <CinematicStory />
        <About />
        <Amenities />
        <Rooms />
        <Gallery />
        <Booking />
        <Location />
        <Testimonials />
      </main>
      <Footer />
    </DictProvider>
  )
}
