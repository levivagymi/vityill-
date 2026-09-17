import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Magnetic from '@/components/ui/Magnetic'
import type { ExperienceScrollItem } from '@/components/sections/ExperiencesScroll'

export default function ExperienceRow({
  item, reversed, exploreLabel, bookNowLabel, bookHref,
}: {
  item: ExperienceScrollItem
  reversed: boolean
  exploreLabel: string
  bookNowLabel: string
  bookHref: string
}) {
  return (
    <>
      <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden ${reversed ? 'lg:order-2' : ''}`}>
        <Image src={item.image} alt={item.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
      </div>
      <div className={reversed ? 'lg:order-1' : ''}>
        <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center mb-5">{item.icon}</div>
        <p className="font-sans uppercase tracking-[0.3em] text-muted-foreground text-xs mb-3">{item.eyebrow}</p>
        <h2 className="font-heading text-2xl sm:text-3xl mb-4">{item.title}</h2>
        <p className="font-sans text-muted-foreground leading-[1.85] text-base mb-6">{item.detail}</p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href={item.exploreHref}
            className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-foreground border border-foreground/25 hover:border-foreground/60 px-5 py-2.5 rounded-full transition-all cursor-pointer"
            data-cursor="view"
          >
            {exploreLabel} <ArrowRight size={15} />
          </Link>
          <Magnetic>
            <Link
              href={bookHref}
              className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background font-sans font-semibold text-sm px-7 py-3.5 rounded-full transition-colors duration-200 cursor-pointer"
              data-cursor="view"
            >
              {bookNowLabel} <ArrowRight size={15} />
            </Link>
          </Magnetic>
        </div>
      </div>
    </>
  )
}
