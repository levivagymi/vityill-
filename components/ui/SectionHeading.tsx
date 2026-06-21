import { EmblemMark } from '@/components/brand/Logo'

/** Consistent, brand-accented section header used across the site. */
export default function SectionHeading({
  label,
  title,
  subtitle,
  center = true,
  emblem = true,
  className = '',
}: {
  label?: string
  title: string
  subtitle?: string
  center?: boolean
  emblem?: boolean
  className?: string
}) {
  return (
    <div className={`${center ? 'text-center' : ''} ${className}`}>
      {emblem && (
        <EmblemMark height={30} className={`mb-5 opacity-90 ${center ? 'justify-center w-full' : ''}`} />
      )}
      {label && (
        <div className={`flex items-center gap-3 mb-4 ${center ? 'justify-center' : ''}`}>
          <div className="h-px w-10 bg-foreground/40" />
          <span className="text-foreground/60 text-xs font-sans uppercase tracking-[0.3em]">{label}</span>
          <div className="h-px w-10 bg-foreground/40" />
        </div>
      )}
      <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4">{title}</h2>
      {subtitle && (
        <p className={`font-sans text-base text-foreground/55 ${center ? 'max-w-xl mx-auto' : 'max-w-xl'}`}>{subtitle}</p>
      )}
    </div>
  )
}
