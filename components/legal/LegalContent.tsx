import PageHero from '@/components/ui/PageHero'
import Reveal from '@/components/ui/Reveal'
import { HERO_BANNER } from '@/lib/content'

type Section = { heading: string; body: string }

export default function LegalContent({
  title,
  intro,
  sections,
  updatedLabel,
  updatedDate,
  crumbs,
}: {
  title: string
  intro: string
  sections: Section[]
  updatedLabel: string
  updatedDate: string
  crumbs: { label: string; href?: string }[]
}) {
  return (
    <>
      <PageHero title={title} subtitle={intro} image={HERO_BANNER} imageAlt={title} crumbs={crumbs} emblem />
      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <p className="text-xs font-sans uppercase tracking-wider text-foreground/40 mb-10">
          {updatedLabel}: {updatedDate}
        </p>
        <div className="space-y-10">
          {sections.map((s, i) => (
            <Reveal key={i} y={24}>
              <h2 className="font-heading text-xl sm:text-2xl mb-3">{s.heading}</h2>
              <p className="font-sans text-foreground/60 leading-[1.85] text-base whitespace-pre-line">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </main>
    </>
  )
}
