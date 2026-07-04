'use client'
import dynamic from 'next/dynamic'
import LazyMount from '@/components/util/LazyMount'

// Below-the-fold wall: the chunk is only requested when the section
// approaches the viewport.
const GuestStories = dynamic(() => import('./GuestStories'), { ssr: false })

export default function GuestStoriesLazy() {
  return (
    <LazyMount minHeight={720} rootMargin="600px">
      <GuestStories />
    </LazyMount>
  )
}
