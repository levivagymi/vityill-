'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Quote, Star } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import SectionHeading from '@/components/ui/SectionHeading'
import { STORY_IMAGES } from '@/lib/content'
import { allowAmbientMotion } from '@/lib/utils'
import type { Dictionary } from '@/lib/types'

type Story = Dictionary['testimonials']['stories'][number] & { image: string }

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < count ? 'fill-foreground text-foreground' : 'fill-foreground/15 text-foreground/15'}
        />
      ))}
    </div>
  )
}

function StoryCard({ story }: { story: Story }) {
  return (
    <figure
      data-cursor="view"
      className="group relative flex-shrink-0 w-[280px] sm:w-[320px] overflow-hidden rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03]
                 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5 hover:border-foreground/20
                 hover:shadow-[0_0_0_1px_var(--glow-ring),0_18px_40px_-18px_rgba(0,0,0,0.5)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={story.image}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          sizes="320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
      </div>
      <blockquote className="p-5">
        <Quote size={18} className="text-foreground/20 mb-2.5" aria-hidden />
        <p className="font-sans text-sm text-foreground/65 leading-[1.75] line-clamp-4">
          &ldquo;{story.quote}&rdquo;
        </p>
      </blockquote>
      <figcaption className="flex items-center justify-between px-5 pb-5">
        <div>
          <div className="font-sans font-semibold text-sm text-foreground/90">{story.name}</div>
          <div className="font-sans text-xs text-foreground/35">{story.country}</div>
        </div>
        <Stars count={story.rating} />
      </figcaption>
    </figure>
  )
}

/**
 * Immersive guest wall: two counter-drifting marquee rows of photo-backed
 * quotes (x-transform only, paused on hover / off-screen). Reduced-motion
 * and save-data visitors get the same cards as a static wrapped grid.
 */
export default function GuestStories() {
  const dict = useDict()
  const sectionRef = useRef<HTMLElement>(null)
  const rowARef = useRef<HTMLDivElement>(null)
  const rowBRef = useRef<HTMLDivElement>(null)
  const [marquee, setMarquee] = useState<boolean | null>(null)

  const stories: Story[] = dict.testimonials.stories.map((s, i) => ({
    ...s,
    image: STORY_IMAGES[i % STORY_IMAGES.length],
  }))
  const rowA = stories.filter((_, i) => i % 2 === 0)
  const rowB = stories.filter((_, i) => i % 2 === 1)

  useEffect(() => {
    // One-time hydration of a browser-only media-query/save-data check.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMarquee(allowAmbientMotion())
  }, [])

  useEffect(() => {
    if (!marquee) return
    const ctx = gsap.context(() => {
      const drift = (el: HTMLDivElement | null, dir: 1 | -1, seconds: number) => {
        if (!el) return
        const tween = gsap.fromTo(
          el,
          { xPercent: dir === 1 ? 0 : -50 },
          { xPercent: dir === 1 ? -50 : 0, ease: 'none', duration: seconds, repeat: -1, paused: true },
        )
        // Run only while on screen; hovering either row rests both.
        gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => (self.isActive ? tween.play() : tween.pause()),
          },
        })
        el.addEventListener('mouseenter', () => tween.pause())
        el.addEventListener('mouseleave', () => tween.play())
        return tween
      }
      drift(rowARef.current, 1, 48)
      drift(rowBRef.current, -1, 60)
    }, sectionRef)
    return () => ctx.revert()
  }, [marquee])

  return (
    <section id="testimonials" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(ellipse at 30% 60%, rgba(26,71,49,0.3) 0%, transparent 65%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 lg:mb-14">
        <SectionHeading
          label={dict.testimonials.label}
          title={dict.testimonials.wallTitle}
          subtitle={dict.testimonials.wallSubtitle}
        />
      </div>

      {marquee ? (
        <div className="relative flex flex-col gap-5" role="region" aria-label={dict.testimonials.wallTitle}>
          <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)' }}>
            <div ref={rowARef} className="flex w-max gap-5" style={{ willChange: 'transform' }}>
              {[...rowA, ...rowA].map((s, i) => (
                <StoryCard key={`${s.name}-${i}`} story={s} />
              ))}
            </div>
          </div>
          <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)' }}>
            <div ref={rowBRef} className="flex w-max gap-5" style={{ willChange: 'transform' }}>
              {[...rowB, ...rowB].map((s, i) => (
                <StoryCard key={`${s.name}-${i}`} story={s} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-5">
          {stories.slice(0, 6).map((s) => (
            <StoryCard key={s.name} story={s} />
          ))}
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-8 mt-14 pt-8 border-t border-foreground/[0.08]">
          <div className="text-center">
            <div className="font-heading text-3xl text-foreground font-semibold">5.0</div>
            <div className="flex justify-center mt-1">
              <Stars count={5} />
            </div>
            <div className="text-xs font-sans text-foreground/30 mt-1 uppercase tracking-wider">{dict.testimonials.avgLabel}</div>
          </div>
          <div className="w-px h-12 bg-foreground/[0.08]" />
          <div className="text-center">
            <div className="font-heading text-3xl text-foreground font-semibold">100%</div>
            <div className="text-xs font-sans text-foreground/30 mt-2 uppercase tracking-wider">{dict.testimonials.satisfiedLabel}</div>
          </div>
          <div className="w-px h-12 bg-foreground/[0.08]" />
          <div className="text-center">
            <div className="font-heading text-3xl text-foreground font-semibold">★★★★★</div>
            <div className="text-xs font-sans text-foreground/30 mt-2 uppercase tracking-wider">{dict.testimonials.starsLabel}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
