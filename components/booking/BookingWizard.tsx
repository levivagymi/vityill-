'use client'
import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CalendarDays, Users, ClipboardCheck, ArrowLeft, ArrowRight,
  CheckCircle, AlertCircle, Check, RotateCcw, Loader2,
} from 'lucide-react'
import gsap from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'
import { href } from '@/lib/nav'
import {
  BOOKING_ENABLED, COUNTRIES, MAX_GUESTS, MIN_NIGHTS,
  MIN_BIRTH_YEAR, MAX_BIRTH_YEAR, todayISO,
  nightsBetween, calculateStayPrice, formatHUF,
} from '@/lib/booking'
import type { Locale } from '@/lib/types'

type FormData = {
  checkIn: string; checkOut: string
  adults: number; childrenUnder4: number; childrenOver4: number
  name: string; email: string; phone: string
  gender: 'male' | 'female' | 'other'; birthYear: number
  nationality: string; residence: string; postalCode: string
  channel: 'direct' | 'airbnb' | 'booking' | 'facebook' | 'other'
  requests?: string; agree: true
}

const inputClass =
  'w-full bg-foreground/[0.04] border border-foreground/[0.10] text-foreground placeholder-foreground/25 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 focus:bg-foreground/[0.06] transition-all duration-200'
const labelClass = 'block text-xs font-sans text-foreground/50 uppercase tracking-wider mb-1.5'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      {/* Wrapping label gives the control an accessible name without id plumbing */}
      <label className="block">
        <span className={labelClass}>{label}</span>
        {children}
      </label>
      {error && (
        <p role="alert" className="mt-1 text-xs font-sans text-red-400 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

export default function BookingWizard() {
  const dict = useDict()
  const d = dict.booking
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'

  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const panelRef = useRef<HTMLDivElement>(null)

  const schema = z
    .object({
      checkIn: z.string().min(1, d.requiredField),
      checkOut: z.string().min(1, d.requiredField),
      adults: z.number({ error: d.minAdults }).min(1, d.minAdults).max(MAX_GUESTS),
      childrenUnder4: z.number().min(0).max(MAX_GUESTS),
      childrenOver4: z.number().min(0).max(MAX_GUESTS),
      name: z.string().min(1, d.requiredField),
      email: z.string().min(1, d.requiredField).pipe(z.email(d.invalidEmail)),
      phone: z.string().min(3, d.invalidPhone),
      gender: z.enum(['male', 'female', 'other'], { error: d.requiredField }),
      birthYear: z.number({ error: d.invalidYear }).min(MIN_BIRTH_YEAR, d.invalidYear).max(MAX_BIRTH_YEAR, d.invalidYear),
      nationality: z.string().min(1, d.requiredField),
      residence: z.string().min(1, d.requiredField),
      postalCode: z.string().min(1, d.requiredField),
      channel: z.enum(['direct', 'airbnb', 'booking', 'facebook', 'other'], { error: d.requiredField }),
      requests: z.string().optional(),
      agree: z.literal(true, { error: d.agreeError }),
    })
    .superRefine((v, ctx) => {
      const n = nightsBetween(v.checkIn, v.checkOut)
      if (n <= 0) {
        ctx.addIssue({ code: 'custom', message: d.datesError, path: ['checkOut'] })
      } else if (n < MIN_NIGHTS) {
        ctx.addIssue({ code: 'custom', message: d.minNightsError, path: ['checkOut'] })
      }
    })
    .refine((v) => v.adults + v.childrenUnder4 + v.childrenOver4 <= MAX_GUESTS, { message: d.tooManyGuests, path: ['adults'] })

  const {
    register, handleSubmit, watch, trigger, setError, getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    mode: 'onTouched',
    defaultValues: { adults: 2, childrenUnder4: 0, childrenOver4: 0 },
  })

  const checkIn = watch('checkIn')
  const checkOut = watch('checkOut')
  const adults = watch('adults') ?? 0
  const childrenUnder4 = watch('childrenUnder4') ?? 0
  const childrenOver4 = watch('childrenOver4') ?? 0
  const nights = nightsBetween(checkIn, checkOut)
  const estimate = calculateStayPrice({ checkIn, checkOut, adults, childrenUnder4, childrenOver4 })
  const minCheckOut = checkIn
    ? new Date(new Date(checkIn).getTime() + MIN_NIGHTS * 86_400_000).toISOString().slice(0, 10)
    : todayISO()

  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(panelRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
    }
  }, [step, status])

  const steps = [
    { icon: CalendarDays, label: d.stepStay, fields: ['checkIn', 'checkOut', 'adults', 'childrenUnder4', 'childrenOver4'] as const },
    { icon: Users, label: d.stepGuest, fields: ['name', 'email', 'phone', 'gender', 'birthYear', 'nationality', 'residence', 'postalCode'] as const },
    { icon: ClipboardCheck, label: d.stepReview, fields: ['channel', 'agree'] as const },
  ]

  const goNext = async () => {
    const ok = await trigger(steps[step].fields as never)
    if (step === 0 && nights <= 0) {
      setError('checkOut', { message: d.datesError })
      return
    }
    if (step === 0 && nights > 0 && nights < MIN_NIGHTS) {
      setError('checkOut', { message: d.minNightsError })
      return
    }
    // Cross-field refine errors aren't reliably surfaced by trigger() when
    // called with a subset of field names (a known react-hook-form +
    // zodResolver limitation) - checked explicitly here, same as the dates
    // check above. The schema-level refine still guards handleSubmit() on
    // final submit, and bookingServerSchema guards the server independently.
    if (step === 0 && adults + childrenUnder4 + childrenOver4 > MAX_GUESTS) {
      setError('adults', { message: d.tooManyGuests })
      return
    }
    if (ok) setStep((s) => Math.min(s + 1, steps.length - 1))
  }
  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  const onSubmit = async (data: FormData) => {
    setStatus('submitting')
    try {
      const { agree: _agree, ...rest } = data
      void _agree
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rest, locale: lang }),
      })
      if (!res.ok) throw new Error('request failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const fmt = (n: number) => formatHUF(n, lang)

  if (status === 'success') {
    return (
      <div ref={panelRef} className="bg-foreground/[0.03] border border-foreground/[0.12] rounded-2xl p-10 text-center max-w-2xl mx-auto">
        <CheckCircle size={56} className="text-foreground mx-auto mb-5" />
        <h3 className="font-heading text-2xl mb-3">{d.successTitle}</h3>
        <p className="font-sans text-foreground/60 text-sm leading-relaxed mb-6">{d.successMsg}</p>
        <button
          onClick={() => { setStatus('idle'); setStep(0) }}
          className="inline-flex items-center gap-2 border border-foreground/25 hover:border-foreground/50 text-foreground/80 hover:text-foreground font-sans text-sm px-5 py-2.5 rounded-full transition-colors cursor-pointer"
        >
          <RotateCcw size={14} /> {d.newBooking}
        </button>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">
      {/* Form column */}
      <div className="lg:col-span-3">
        {/* Stepper */}
        <ol className="flex items-center justify-between mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon
            const active = i === step
            const done = i < step
            return (
              <li key={i} aria-current={active ? 'step' : undefined} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    active ? 'bg-foreground text-background border-foreground'
                      : done ? 'bg-foreground/15 text-foreground border-foreground/30'
                      : 'bg-foreground/[0.04] text-foreground/40 border-foreground/15'
                  }`}>
                    {done ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <span className={`text-[11px] font-sans uppercase tracking-wider text-center ${active ? 'text-foreground' : 'text-foreground/40'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-2 mt-[-18px] transition-colors duration-300 ${i < step ? 'bg-foreground/40' : 'bg-foreground/12'}`} />
                )}
              </li>
            )
          })}
        </ol>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-foreground/[0.03] border border-foreground/[0.07] rounded-2xl p-6 sm:p-8">
          <div ref={panelRef}>
            {step === 0 && (
              <div className="space-y-5">
                <p className="text-foreground/40 text-xs font-sans uppercase tracking-[0.2em]">01 — {d.stepStay}</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={d.checkIn} error={errors.checkIn?.message}>
                    <input {...register('checkIn')} type="date" min={todayISO()} className={inputClass} />
                  </Field>
                  <Field label={d.checkOut} error={errors.checkOut?.message}>
                    <input {...register('checkOut')} type="date" min={minCheckOut} className={inputClass} />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label={d.adults} error={errors.adults?.message}>
                    <input {...register('adults', { valueAsNumber: true })} type="number" min={1} max={MAX_GUESTS} className={inputClass} />
                  </Field>
                  <Field label={d.childrenUnder4} error={errors.childrenUnder4?.message}>
                    <input {...register('childrenUnder4', { valueAsNumber: true })} type="number" min={0} max={MAX_GUESTS} className={inputClass} />
                  </Field>
                  <Field label={d.childrenOver4} error={errors.childrenOver4?.message}>
                    <input {...register('childrenOver4', { valueAsNumber: true })} type="number" min={0} max={MAX_GUESTS} className={inputClass} />
                  </Field>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <p className="text-foreground/40 text-xs font-sans uppercase tracking-[0.2em]">02 — {d.stepGuest}</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={d.name} error={errors.name?.message}>
                    <input {...register('name')} type="text" placeholder="Kovács János" className={inputClass} autoComplete="name" />
                  </Field>
                  <Field label={d.email} error={errors.email?.message}>
                    <input {...register('email')} type="email" placeholder="email@pelda.hu" className={inputClass} autoComplete="email" />
                  </Field>
                  <Field label={d.phone} error={errors.phone?.message}>
                    <input {...register('phone')} type="tel" placeholder="+36 30 123 4567" className={inputClass} autoComplete="tel" />
                  </Field>
                  <Field label={d.birthYear} error={errors.birthYear?.message}>
                    <input {...register('birthYear', { valueAsNumber: true })} type="number" min={MIN_BIRTH_YEAR} max={MAX_BIRTH_YEAR} placeholder="1985" className={inputClass} />
                  </Field>
                  <Field label={d.gender} error={errors.gender?.message}>
                    <select {...register('gender')} className={inputClass} defaultValue="">
                      <option value="" disabled className="bg-background">{d.selectGender}</option>
                      <option value="male" className="bg-background">{d.genderMale}</option>
                      <option value="female" className="bg-background">{d.genderFemale}</option>
                      <option value="other" className="bg-background">{d.genderOther}</option>
                    </select>
                  </Field>
                  <Field label={d.postalCode} error={errors.postalCode?.message}>
                    <input {...register('postalCode')} type="text" placeholder="1234" className={inputClass} autoComplete="postal-code" />
                  </Field>
                  <Field label={d.nationality} error={errors.nationality?.message}>
                    <select {...register('nationality')} className={inputClass} defaultValue="">
                      <option value="" disabled className="bg-background">{d.selectCountry}</option>
                      {COUNTRIES.map((c) => <option key={c} value={c} className="bg-background">{c}</option>)}
                    </select>
                  </Field>
                  <Field label={d.residence} error={errors.residence?.message}>
                    <select {...register('residence')} className={inputClass} defaultValue="">
                      <option value="" disabled className="bg-background">{d.selectCountry}</option>
                      {COUNTRIES.map((c) => <option key={c} value={c} className="bg-background">{c}</option>)}
                    </select>
                  </Field>
                </div>
                <p className="text-xs font-sans text-foreground/40 leading-relaxed flex items-start gap-2 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 mt-1.5 shrink-0" />
                  {d.ntak}
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <p className="text-foreground/40 text-xs font-sans uppercase tracking-[0.2em]">03 — {d.stepReview}</p>

                <div className="rounded-xl border border-foreground/[0.1] divide-y divide-foreground/[0.06]">
                  {[
                    { label: d.summaryStay, value: nights > 0 ? `${checkIn} → ${checkOut} · ${nights} ${d.nights}` : '—' },
                    { label: d.summaryGuests, value: `${adults} + ${childrenUnder4 + childrenOver4}` },
                    { label: d.summaryContact, value: `${getValues('name') || '—'} · ${getValues('email') || ''}` },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between gap-4 px-4 py-3">
                      <span className="text-xs font-sans uppercase tracking-wider text-foreground/45">{r.label}</span>
                      <span className="text-sm font-sans text-foreground/80 text-right">{r.value}</span>
                    </div>
                  ))}
                </div>

                <Field label={d.channel} error={errors.channel?.message}>
                  <select {...register('channel')} className={inputClass} defaultValue="">
                    <option value="" disabled className="bg-background">{d.selectChannel}</option>
                    <option value="direct" className="bg-background">{d.channelDirect}</option>
                    <option value="airbnb" className="bg-background">{d.channelAirbnb}</option>
                    <option value="booking" className="bg-background">{d.channelBooking}</option>
                    <option value="facebook" className="bg-background">{d.channelFacebook}</option>
                    <option value="other" className="bg-background">{d.channelOther}</option>
                  </select>
                </Field>

                <Field label={d.requests} error={errors.requests?.message}>
                  <textarea {...register('requests')} rows={3} placeholder="..." className={`${inputClass} resize-none`} />
                </Field>

                <div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input {...register('agree')} type="checkbox" className="mt-0.5 w-4 h-4 accent-[color:var(--foreground)] cursor-pointer" />
                    <span className="text-sm font-sans text-foreground/65 leading-snug">
                      {d.agree}{' '}
                      <Link href={href(lang, 'terms')} target="_blank" className="underline underline-offset-2 hover:text-foreground">{dict.footer.terms}</Link>
                      {' · '}
                      <Link href={href(lang, 'privacy')} target="_blank" className="underline underline-offset-2 hover:text-foreground">{dict.footer.privacy}</Link>
                    </span>
                  </label>
                  {errors.agree && (
                    <p role="alert" className="mt-1 text-xs font-sans text-red-400 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.agree.message as string}
                    </p>
                  )}
                </div>

                {!BOOKING_ENABLED && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-sm font-sans text-amber-300 font-semibold flex items-center gap-2">
                      <AlertCircle size={14} /> {d.disabledNotice ?? 'Foglalás jelenleg nem aktív – ez egy bemutató verzió.'}
                    </p>
                  </div>
                )}

                {status === 'error' && (
                  <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-4">
                    <p className="text-sm font-sans text-red-300 font-semibold mb-1 flex items-center gap-2">
                      <AlertCircle size={14} /> {d.errorTitle}
                    </p>
                    <p className="text-xs font-sans text-red-200/80">{d.errorMsg}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-3 mt-7 pt-6 border-t border-foreground/[0.07]">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="inline-flex items-center gap-2 text-sm font-sans text-foreground/60 hover:text-foreground disabled:opacity-0 transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} /> {d.back}
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background font-sans font-semibold text-sm px-6 py-3 rounded-full transition-all hover:scale-[1.02] cursor-pointer"
              >
                {d.next} <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={status === 'submitting' || !BOOKING_ENABLED}
                title={!BOOKING_ENABLED ? (d.disabledNotice ?? 'Foglalás jelenleg nem aktív – bemutató verzió') : undefined}
                className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed text-background font-sans font-semibold text-sm px-6 py-3 rounded-full transition-all hover:scale-[1.02] cursor-pointer"
              >
                {status === 'submitting' && <Loader2 size={15} className="animate-spin" aria-hidden />}
                {status === 'submitting' ? d.submitting : d.confirm}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Summary column */}
      <aside className="lg:col-span-2 lg:sticky lg:top-28">
        <div className="bg-foreground/[0.04] border border-foreground/[0.1] rounded-2xl p-6">
          <h3 className="font-heading text-xl mb-5">{d.summaryTitle}</h3>

          <div className="space-y-3 text-sm font-sans">
            <div className="flex items-center justify-between">
              <span className="text-foreground/55">{d.summaryStay}</span>
              <span className="text-foreground/85 text-right">{nights > 0 ? `${nights} ${d.nights}` : '—'}</span>
            </div>
            {estimate.breakdown.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-sans uppercase tracking-wider text-foreground/40">{d.breakdownTitle}</p>
                {estimate.breakdown.map((g) => (
                  <div key={g.type} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-foreground/55">
                      {g.type === 'weekend' ? d.weekendLabel : d.weekdayLabel} · {g.nights} {g.nights === 1 ? d.nightLabelShort : d.nights} × {fmt(g.ratePerPerson)}/{d.ratePerPersonPerNight} × {g.guestCount}
                    </span>
                    <span className="text-foreground/80 shrink-0">{fmt(g.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-foreground/[0.1]">
              <span className="font-semibold text-foreground">{d.estimatedTotal}</span>
              <span className="font-heading text-2xl font-semibold text-foreground">{fmt(estimate.total)}</span>
            </div>
          </div>

          <p className="text-[11px] font-sans text-foreground/40 leading-relaxed mt-5 pt-4 border-t border-foreground/[0.06]">
            {d.taxNote}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 border border-foreground/15 rounded-full px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
            <span className="text-[10px] font-sans text-foreground/55 tracking-wider uppercase">{dict.footer.ntak}</span>
          </div>
        </div>
      </aside>
    </div>
  )
}
