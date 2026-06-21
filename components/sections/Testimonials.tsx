'use client'
import { useRef, useState, useEffect } from 'react'
import { Star, Quote } from 'lucide-react'
import gsap from '@/lib/gsap'
import { ScrollTrigger } from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import SectionHeading from '@/components/ui/SectionHeading'

const REVIEWS = [
  {
    name: 'Kovács Eszter',
    location: 'Budapest, HU',
    text: 'Csodálatos hely! A szauna és a kültéri medence tökéletes volt. A természetes erdős környezet lenyűgöző, reggel ébredve hallani a madarak énekét.',
    rating: 5,
    flag: '🇭🇺',
  },
  {
    name: 'Thomas Müller',
    location: 'Wien, AT',
    text: 'Ein wunderschöner Ort zum Entspannen. Die Sauna und der Pool waren fantastisch, und die Umgebung im Gerecse-Gebirge ist atemberaubend schön.',
    rating: 5,
    flag: '🇦🇹',
  },
  {
    name: 'Sarah Johnson',
    location: 'London, UK',
    text: "Absolutely stunning retreat. The private forest setting is magical and the amenities are truly top-notch. We didn't want to leave!",
    rating: 5,
    flag: '🇬🇧',
  },
  {
    name: 'Nagy Balázs & Zsuzsa',
    location: 'Győr, HU',
    text: 'Tökéletes romantikus hétvége! A bográcsos esti grillezés feledhetetlen élmény volt. A ház felszereltsége modern és igényes. Feltétlenül visszatérünk!',
    rating: 5,
    flag: '🇭🇺',
  },
  {
    name: 'Markus Schmidt',
    location: 'München, DE',
    text: 'Luxus und Natur in perfekter Harmonie. Der Ausblick am Morgen über die Gerecse-Hügel ist unbeschreiblich schön. Absolute Empfehlung!',
    rating: 5,
    flag: '🇩🇪',
  },
]

function Star5({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < count ? 'fill-foreground text-foreground' : 'fill-foreground/15 text-foreground/15'}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review, isActive }: { review: typeof REVIEWS[0]; isActive: boolean }) {
  return (
    <div
      className={`flex-shrink-0 w-full sm:w-[380px] lg:w-[420px] bg-foreground/[0.03] border rounded-2xl p-6 lg:p-7 transition-all duration-500 ${
        isActive
          ? 'border-foreground/20 shadow-xl shadow-black/10'
          : 'border-foreground/[0.07] opacity-50 scale-95'
      }`}
    >
      <Quote size={24} className="text-foreground/20 mb-4" />
      <p className="font-sans text-sm text-foreground/60 leading-[1.8] mb-5 line-clamp-4">
        &ldquo;{review.text}&rdquo;
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-foreground/[0.08] border border-foreground/[0.12] flex items-center justify-center text-base">
            {review.flag}
          </div>
          <div>
            <div className="font-sans font-semibold text-sm text-foreground/90">{review.name}</div>
            <div className="font-sans text-xs text-foreground/35">{review.location}</div>
          </div>
        </div>
        <Star5 count={review.rating} />
      </div>
    </div>
  )
}

export default function Testimonials() {
  const dict = useDict()
  const [active, setActive] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((a) => (a + 1) % REVIEWS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    void ScrollTrigger
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.gsap-fade-up', sectionRef.current!).forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: i * 0.12,
            scrollTrigger: { trigger: el, start: 'top 82%' }
          }
        )
      })
      if (carouselRef.current) {
        gsap.fromTo(carouselRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.8, delay: 0.3,
            scrollTrigger: { trigger: carouselRef.current, start: 'top 82%' }
          }
        )
      }
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="testimonials" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(ellipse at 30% 60%, rgba(26,71,49,0.3) 0%, transparent 65%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gsap-fade-up mb-14 lg:mb-16">
          <SectionHeading label={dict.testimonials.label} title={dict.testimonials.title} />
        </div>

        <div ref={carouselRef} className="overflow-hidden">
          <div
            className="flex gap-4 lg:gap-5 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(calc(-${active * (100 / REVIEWS.length)}% - ${active * 16}px + 50% - 210px))` }}
          >
            {REVIEWS.map((review, i) => (
              <ReviewCard key={i} review={review} isActive={i === active} />
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                i === active
                  ? 'w-8 h-2 bg-foreground'
                  : 'w-2 h-2 bg-foreground/15 hover:bg-foreground/35'
              }`}
              aria-label={`Review ${i + 1}`}
            />
          ))}
        </div>

        <div className="gsap-fade-up flex items-center justify-center gap-8 mt-12 pt-8 border-t border-foreground/[0.08]">
          <div className="text-center">
            <div className="font-heading text-3xl text-foreground font-semibold">5.0</div>
            <div className="flex justify-center mt-1">
              <Star5 count={5} />
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
