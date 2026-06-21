import { notFound } from 'next/navigation'
import { hasLocale } from './dictionaries'
import CinematicStory from '@/components/sections/CinematicStory'
import About from '@/components/sections/About'
import Amenities from '@/components/sections/Amenities'
import Rooms from '@/components/sections/Rooms'
import Gallery from '@/components/sections/Gallery'
import Testimonials from '@/components/sections/Testimonials'
import Location from '@/components/sections/Location'
import BookingCta from '@/components/sections/BookingCta'
import CinematicSkipPrompt from '@/components/engine/CinematicSkipPrompt'

export default async function LangPage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  return (
    <>
      <CinematicSkipPrompt />
      <main>
        <CinematicStory />
        <About />
        <Amenities />
        <Rooms />
        <Gallery limit={8} />
        <Testimonials />
        <Location />
        <BookingCta />
      </main>
    </>
  )
}
