'use client'
import { useRef, useEffect } from 'react'
import { MapPin, Mountain, Castle, Building2, Church } from 'lucide-react'
import gsap from '@/lib/gsap'
import { ScrollTrigger } from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'

const HIGHLIGHTS = [
  { key: 'gerecse', icon: Mountain, color: '#c9a84c', dist: null },
  { key: 'tata', icon: Castle, color: '#b8d4a0', dist: '10 km' },
  { key: 'budapest', icon: Building2, color: '#a0c0d8', dist: '60 km' },
  { key: 'esztergom', icon: Church, color: '#d4a8c0', dist: '30 km' },
] as const

export default function Location() {
  const dict = useDict()
  const sectionRef = useRef<HTMLDivElement>(null)

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
      gsap.fromTo('.location-fade-left',
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', delay: 0.15,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
        }
      )
      gsap.fromTo('.location-fade-right',
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', delay: 0.25,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
        }
      )
      gsap.fromTo('.highlight-row',
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out', delay: 0.3,
          scrollTrigger: { trigger: '.location-fade-right', start: 'top 80%' }
        }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section id="location" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div
        className="absolute inset-0 opacity-15"
        style={{ backgroundImage: 'radial-gradient(ellipse at 60% 50%, rgba(26,71,49,0.3) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gsap-fade-up text-center mb-14 lg:mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-foreground/55" />
            <span className="text-foreground/55 text-xs font-sans uppercase tracking-[0.3em]">{dict.location.label}</span>
            <div className="h-px w-10 bg-foreground/55" />
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl mb-4">{dict.location.title}</h2>
          <div className="flex items-center justify-center gap-2 text-foreground/50 font-sans text-sm">
            <MapPin size={14} className="text-foreground/55" />
            <span>{dict.location.address}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="location-fade-left relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-foreground/[0.08]">
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=18.27%2C47.71%2C18.35%2C47.75&layer=mapnik&marker=47.730%2C18.314"
                width="100%"
                height="100%"
                style={{ border: 'none', filter: 'invert(85%) hue-rotate(165deg) brightness(0.8) contrast(0.9)' }}
                title="Szomód, Hungary location"
                loading="lazy"
                className="absolute inset-0"
              />
              <div className="absolute inset-0 pointer-events-none bg-background/10 rounded-2xl" />
            </div>

            <div className="absolute -bottom-4 left-4 right-4 bg-card/90 backdrop-blur-md border border-foreground/[0.12] rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-foreground/[0.08] border border-foreground/[0.12] flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-foreground" />
                </div>
                <div>
                  <div className="font-sans font-semibold text-sm text-foreground">Vityilló Vendégház</div>
                  <div className="font-sans text-xs text-foreground/50">{dict.location.address}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="location-fade-right">
            <h3 className="font-heading text-xl mb-6">{dict.location.nearby}</h3>

            <div className="space-y-4">
              {HIGHLIGHTS.map(({ key, icon: Icon, color, dist }) => (
                <div
                  key={key}
                  className="highlight-row flex items-center gap-4 p-4 bg-foreground/[0.03] border border-foreground/[0.06] rounded-xl
                             hover:border-foreground/10 hover:bg-foreground/[0.05] transition-all duration-200 group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18`, border: `1px solid ${color}25` }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-semibold text-sm text-foreground/85 group-hover:text-foreground transition-colors">
                      {dict.location[key as keyof typeof dict.location]}
                      {dist && (
                        <span className="ml-2 text-xs font-normal bg-foreground/[0.08] text-foreground/70 px-2 py-0.5 rounded-full">
                          {dist}
                        </span>
                      )}
                    </div>
                    <div className="font-sans text-xs text-foreground/40 mt-0.5">
                      {dict.location[`${key}desc` as keyof typeof dict.location] || dict.location[`${key}Desc` as keyof typeof dict.location]}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs font-sans text-foreground/30 leading-relaxed">
              * Autóval számított megközelítési idők / Driving distances
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
