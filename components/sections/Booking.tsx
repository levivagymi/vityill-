'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, AlertCircle } from 'lucide-react'
import gsap from '@/lib/gsap'
import { ScrollTrigger } from '@/lib/gsap'
import { useDict } from '@/components/providers/DictProvider'

const COUNTRIES = [
  'Magyarország', 'Ausztria', 'Németország', 'Szlovákia', 'Románia', 'Csehország',
  'Lengyelország', 'Horvátország', 'Szerbia', 'Ukrajna', 'Olaszország', 'Franciaország',
  'Egyesült Királyság', 'Spanyolország', 'Hollandia', 'Svájc', 'Belgium', 'Svédország',
  'Dánia', 'Norvégia', 'Finnország', 'Oroszország', 'USA', 'Kanada', 'Ausztrália',
  'Japán', 'Kína', 'India', 'Brazília', 'Argentína', 'Más / Other',
]

const buildSchema = (d: { requiredField: string; invalidEmail: string; minAdults: string; invalidYear: string }) =>
  z.object({
    name: z.string().min(1, d.requiredField),
    email: z.string().min(1, d.requiredField).email(d.invalidEmail),
    phone: z.string().min(1, d.requiredField),
    checkIn: z.string().min(1, d.requiredField),
    checkOut: z.string().min(1, d.requiredField),
    adults: z.number({ error: d.minAdults }).min(1, d.minAdults).max(10),
    children: z.number().min(0).max(10),
    childrenAges: z.string().optional(),
    nationality: z.string().min(1, d.requiredField),
    residence: z.string().min(1, d.requiredField),
    postalCode: z.string().min(1, d.requiredField),
    gender: z.enum(['male', 'female', 'other']),
    birthYear: z.number({ error: d.invalidYear }).min(1900, d.invalidYear).max(2010, d.invalidYear),
    room: z.enum(['room1', 'room2', 'both']),
    channel: z.enum(['direct', 'airbnb', 'booking', 'facebook', 'other']),
    requests: z.string().optional(),
  })

type BookingFormData = {
  name: string; email: string; phone: string; checkIn: string; checkOut: string;
  adults: number; children: number; childrenAges?: string; nationality: string;
  residence: string; postalCode: string; gender: 'male' | 'female' | 'other';
  birthYear: number; room: 'room1' | 'room2' | 'both';
  channel: 'direct' | 'airbnb' | 'booking' | 'facebook' | 'other'; requests?: string;
}

const inputClass =
  'w-full bg-foreground/[0.04] border border-foreground/[0.08] text-foreground placeholder-foreground/25 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-foreground/30 focus:bg-foreground/[0.06] transition-all duration-200'
const labelClass = 'block text-xs font-sans text-foreground/50 uppercase tracking-wider mb-1.5'
const errorClass = 'mt-1 text-xs font-sans text-red-400 flex items-center gap-1'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {error && (
        <p className={errorClass}>
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  )
}

export default function Booking() {
  const dict = useDict()
  const [submitted, setSubmitted] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const schema = buildSchema({
    requiredField: dict.booking.requiredField,
    invalidEmail: dict.booking.invalidEmail,
    minAdults: dict.booking.minAdults,
    invalidYear: dict.booking.invalidYear,
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { adults: 2, children: 0 },
  })

  const watchChildren = watch('children', 0)

  const onSubmit = async (_data: BookingFormData) => {
    await new Promise((r) => setTimeout(r, 1000))
    setSubmitted(true)
  }

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
      gsap.fromTo('.booking-fade-left',
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
        }
      )
      gsap.fromTo('.booking-fade-right',
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', delay: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
        }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (submitted && successRef.current) {
      gsap.fromTo(
        successRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }
      )
    }
  }, [submitted])

  return (
    <section id="booking" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gsap-fade-up text-center mb-14 lg:mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-foreground/55" />
            <span className="text-foreground/55 text-xs font-sans uppercase tracking-[0.3em]">{dict.booking.label}</span>
            <div className="h-px w-10 bg-foreground/55" />
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl mb-4">{dict.booking.title}</h2>
          <p className="font-sans text-base max-w-xl mx-auto">{dict.booking.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          <div className="booking-fade-left hidden lg:block lg:col-span-2">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden sticky top-24">
              <Image
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&fit=crop"
                alt="Gerecse hills panorama"
                fill
                className="object-cover"
                sizes="40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-foreground/[0.03] backdrop-blur-md border border-foreground/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                    <span className="text-foreground/60 text-xs font-sans uppercase tracking-wider">NTAK</span>
                  </div>
                  <p className="text-xs font-sans text-foreground/50 leading-relaxed">{dict.booking.ntak}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="booking-fade-right lg:col-span-3">
            {submitted ? (
              <div
                ref={successRef}
                className="bg-foreground/[0.03] border border-foreground/[0.12] rounded-2xl p-10 text-center"
              >
                <CheckCircle size={52} className="text-foreground mx-auto mb-5" />
                <h3 className="font-heading text-2xl mb-3">{dict.booking.successTitle}</h3>
                <p className="font-sans text-foreground/60 text-sm leading-relaxed">{dict.booking.successMsg}</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="bg-foreground/[0.03] border border-foreground/[0.07] rounded-2xl p-6 sm:p-8 space-y-5"
              >
                <div className="pb-2 border-b border-foreground/[0.06]">
                  <p className="text-foreground/40 text-xs font-sans uppercase tracking-[0.2em] mb-4">
                    01 — Személyes adatok
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label={dict.booking.name} error={errors.name?.message}>
                      <input {...register('name')} type="text" placeholder="Kovács János" className={inputClass} autoComplete="name" />
                    </Field>
                    <Field label={dict.booking.email} error={errors.email?.message}>
                      <input {...register('email')} type="email" placeholder="email@pelda.hu" className={inputClass} autoComplete="email" />
                    </Field>
                    <Field label={dict.booking.phone} error={errors.phone?.message}>
                      <input {...register('phone')} type="tel" placeholder="+36 30 123 4567" className={inputClass} autoComplete="tel" />
                    </Field>
                    <Field label={dict.booking.birthYear} error={errors.birthYear?.message}>
                      <input {...register('birthYear', { valueAsNumber: true })} type="number" min={1900} max={2010} placeholder="1985" className={inputClass} />
                    </Field>
                    <Field label={dict.booking.gender} error={errors.gender?.message}>
                      <select {...register('gender')} className={inputClass} defaultValue="">
                        <option value="" disabled className="bg-background">{dict.booking.selectGender}</option>
                        <option value="male" className="bg-background">{dict.booking.genderMale}</option>
                        <option value="female" className="bg-background">{dict.booking.genderFemale}</option>
                        <option value="other" className="bg-background">{dict.booking.genderOther}</option>
                      </select>
                    </Field>
                    <Field label={dict.booking.nationality} error={errors.nationality?.message}>
                      <select {...register('nationality')} className={inputClass} defaultValue="">
                        <option value="" disabled className="bg-background">{dict.booking.selectCountry}</option>
                        {COUNTRIES.map((c) => <option key={c} value={c} className="bg-background">{c}</option>)}
                      </select>
                    </Field>
                    <Field label={dict.booking.residence} error={errors.residence?.message}>
                      <select {...register('residence')} className={inputClass} defaultValue="">
                        <option value="" disabled className="bg-background">{dict.booking.selectCountry}</option>
                        {COUNTRIES.map((c) => <option key={c} value={c} className="bg-background">{c}</option>)}
                      </select>
                    </Field>
                    <Field label={dict.booking.postalCode} error={errors.postalCode?.message}>
                      <input {...register('postalCode')} type="text" placeholder="1234" className={inputClass} autoComplete="postal-code" />
                    </Field>
                  </div>
                </div>

                <div className="pb-2 border-b border-foreground/[0.06]">
                  <p className="text-foreground/40 text-xs font-sans uppercase tracking-[0.2em] mb-4">
                    02 — Tartózkodás adatai
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label={dict.booking.checkIn} error={errors.checkIn?.message}>
                      <input {...register('checkIn')} type="date" className={inputClass} />
                    </Field>
                    <Field label={dict.booking.checkOut} error={errors.checkOut?.message}>
                      <input {...register('checkOut')} type="date" className={inputClass} />
                    </Field>
                    <Field label={dict.booking.adults} error={errors.adults?.message}>
                      <input {...register('adults', { valueAsNumber: true })} type="number" min={1} max={10} className={inputClass} />
                    </Field>
                    <Field label={dict.booking.children} error={errors.children?.message}>
                      <input {...register('children', { valueAsNumber: true })} type="number" min={0} max={10} className={inputClass} />
                    </Field>
                    {watchChildren > 0 && (
                      <div className="sm:col-span-2">
                        <Field label={dict.booking.childrenAges} error={errors.childrenAges?.message}>
                          <input {...register('childrenAges')} type="text" placeholder="5, 8, 12" className={inputClass} />
                        </Field>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pb-2 border-b border-foreground/[0.06]">
                  <p className="text-foreground/40 text-xs font-sans uppercase tracking-[0.2em] mb-4">
                    03 — Preferenciák
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label={dict.booking.room} error={errors.room?.message}>
                      <select {...register('room')} className={inputClass} defaultValue="">
                        <option value="" disabled className="bg-background">{dict.booking.selectRoom}</option>
                        <option value="room1" className="bg-background">{dict.booking.room1Label}</option>
                        <option value="room2" className="bg-background">{dict.booking.room2Label}</option>
                        <option value="both" className="bg-background">{dict.booking.bothLabel}</option>
                      </select>
                    </Field>
                    <Field label={dict.booking.channel} error={errors.channel?.message}>
                      <select {...register('channel')} className={inputClass} defaultValue="">
                        <option value="" disabled className="bg-background">{dict.booking.selectChannel}</option>
                        <option value="direct" className="bg-background">{dict.booking.channelDirect}</option>
                        <option value="airbnb" className="bg-background">{dict.booking.channelAirbnb}</option>
                        <option value="booking" className="bg-background">{dict.booking.channelBooking}</option>
                        <option value="facebook" className="bg-background">{dict.booking.channelFacebook}</option>
                        <option value="other" className="bg-background">{dict.booking.channelOther}</option>
                      </select>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label={dict.booking.requests} error={errors.requests?.message}>
                        <textarea {...register('requests')} rows={3} placeholder="..." className={`${inputClass} resize-none`} />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="lg:hidden p-4 bg-foreground/[0.03] border border-foreground/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                    <span className="text-foreground/60 text-xs font-sans uppercase tracking-wider">NTAK</span>
                  </div>
                  <p className="text-xs font-sans text-foreground/50 leading-relaxed">{dict.booking.ntak}</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-foreground hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed
                             text-background font-sans font-semibold text-base py-4 rounded-xl
                             transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {isSubmitting ? dict.booking.submitting : dict.booking.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
