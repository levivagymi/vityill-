import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from './dictionaries'
import CinematicStoryLazy from '@/components/sections/CinematicStoryLazy'
import About from '@/components/sections/About'
import Amenities from '@/components/sections/Amenities'
import Rooms from '@/components/sections/Rooms'
import Gallery from '@/components/sections/Gallery'
import GuestStoriesLazy from '@/components/sections/GuestStoriesLazy'
import Location from '@/components/sections/Location'
import AvailabilityStrip from '@/components/availability/AvailabilityStrip'
import BookingCta from '@/components/sections/BookingCta'
import CinematicSkipPrompt from '@/components/engine/CinematicSkipPrompt'

export default async function LangPage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <>
      <CinematicSkipPrompt />
      <main>
        {/* The cinematic hero is aria-hidden, so the page heading lives here. */}
        <h1 className="sr-only">{dict.cinematic.srTitle}</h1>
        <CinematicStoryLazy />
        <About />
        <Amenities />
        <Rooms />
        <Gallery limit={8} />
        <GuestStoriesLazy />
        <Location />
        <AvailabilityStrip />
        <BookingCta />
      </main>
    </>
  )
}
