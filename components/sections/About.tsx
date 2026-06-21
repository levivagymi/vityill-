'use client'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { Trees, Users, MapPin } from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import { EmblemMark } from '@/components/brand/Logo'

export default function About() {
  const dict = useDict()
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.about-left', { opacity: 0, x: -60 }, {
        opacity: 1, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 78%' },
      })
      gsap.fromTo('.about-card', { opacity: 0, scale: 0.85, x: 20 }, {
        opacity: 1, scale: 1, x: 0, duration: 0.7, ease: 'power3.out', delay: 0.4,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 78%' },
      })
      gsap.utils.toArray<HTMLElement>('.about-right-el', sectionRef.current!).forEach((el, i) => {
        gsap.fromTo(el, { opacity: 0, y: 50 }, {
          opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: i * 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 76%' },
        })
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const badges = [
    { icon: Trees, label: dict.about.badge1 },
    { icon: Users, label: dict.about.badge2 },
    { icon: MapPin, label: dict.about.badge3 },
  ]

  return (
    <section id="rolunk" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-foreground/[0.06]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="about-left relative" style={{ opacity: 0 }}>
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80&fit=crop"
                alt="Vityilló cabin exterior surrounded by forest"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>
            <div
              className="about-card absolute -bottom-6 -right-4 lg:-right-8 bg-card/95 backdrop-blur-md border border-foreground/[0.15] rounded-xl p-4 lg:p-5 shadow-xl"
              style={{ opacity: 0 }}
            >
              <div className="text-3xl lg:text-4xl font-heading font-bold text-foreground leading-none">10</div>
              <div className="text-xs font-sans text-foreground/50 mt-1 uppercase tracking-wider">max. vendég</div>
              <div className="text-xs font-sans text-foreground/35 mt-0.5">Szomód, Gerecse</div>
            </div>
            <div className="absolute -top-4 -left-4 w-24 h-px bg-gradient-to-r from-foreground/30 to-transparent" />
            <div className="absolute -top-4 -left-4 w-px h-24 bg-gradient-to-b from-foreground/30 to-transparent" />
          </div>

          <div className="lg:pl-6">
            <EmblemMark height={30} className="about-right-el mb-4 opacity-90" />
            <div className="about-right-el flex items-center gap-3 mb-5" style={{ opacity: 0 }}>
              <div className="h-px w-10 bg-foreground/30" />
              <span className="text-foreground/60 text-xs font-sans uppercase tracking-[0.3em]">{dict.about.label}</span>
            </div>
            <h2 className="about-right-el font-heading text-3xl sm:text-4xl lg:text-5xl leading-tight mb-6" style={{ opacity: 0 }}>
              {dict.about.title}
            </h2>
            <p className="about-right-el font-sans leading-[1.85] text-base mb-5" style={{ opacity: 0 }}>
              {dict.about.p1}
            </p>
            <p className="about-right-el font-sans leading-[1.85] text-base mb-8" style={{ opacity: 0 }}>
              {dict.about.p2}
            </p>
            <div className="about-right-el flex flex-wrap gap-3" style={{ opacity: 0 }}>
              {badges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-foreground/[0.04] border border-foreground/10 rounded-full px-4 py-2">
                  <Icon size={14} className="text-foreground/70" />
                  <span className="text-sm font-sans text-foreground/65">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
