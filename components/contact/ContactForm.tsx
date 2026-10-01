'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, AlertCircle, Loader2, RotateCcw } from 'lucide-react'
import { useDict } from '@/components/providers/DictProvider'
import FormField from '@/components/ui/FormField'
import Honeypot from '@/components/ui/Honeypot'
import { href } from '@/lib/nav'
import { CONTACT_ENABLED } from '@/lib/site'
import type { Locale } from '@/lib/types'

type FormData = { name: string; email: string; phone?: string; subject?: string; message: string; website?: string }

const inputClass =
  'w-full bg-foreground/[0.04] border border-foreground/[0.10] text-foreground placeholder-foreground/25 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 focus:bg-foreground/[0.06] transition-all duration-200'

export default function ContactForm() {
  const dict = useDict()
  const c = dict.contact
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const schema = z.object({
    name: z.string().min(1, dict.booking.requiredField),
    email: z.string().min(1, dict.booking.requiredField).pipe(z.email(dict.booking.invalidEmail)),
    phone: z.string().optional(),
    subject: z.string().optional(),
    message: z.string().min(1, dict.booking.requiredField),
    website: z.string().optional(),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
  })

  const onSubmit = async (data: FormData) => {
    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, locale: lang }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
      reset()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-card border border-foreground/[0.12] rounded-2xl p-10 text-center">
        <CheckCircle size={48} className="text-foreground mx-auto mb-4" />
        <h3 className="font-heading text-xl mb-2">{c.successTitle}</h3>
        <p className="font-sans text-muted-foreground text-sm mb-6">{c.successMsg}</p>
        <button
          onClick={() => setStatus('idle')}
          className="inline-flex items-center gap-2 border border-foreground/25 hover:border-foreground/50 text-foreground hover:text-foreground font-sans text-sm px-5 py-2.5 rounded-full transition-colors cursor-pointer"
        >
          <RotateCcw size={14} /> {c.newMessage}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative bg-card border border-foreground/[0.07] rounded-2xl p-6 sm:p-8 space-y-5">
      <h3 className="font-heading text-xl mb-1">{c.formTitle}</h3>

      {!CONTACT_ENABLED && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-sans text-foreground font-semibold flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden /> {c.disabledNotice}
          </p>
          <p className="mt-2 pl-[22px] text-sm font-sans flex flex-wrap gap-x-4 gap-y-1">
            <a href={`tel:${dict.footer.phone.replace(/\s/g, '')}`} className="text-foreground underline underline-offset-2">
              {dict.footer.phone}
            </a>
            <a href={`mailto:${dict.footer.email}`} className="text-foreground underline underline-offset-2">
              {dict.footer.email}
            </a>
          </p>
        </div>
      )}

      {/* A disabled fieldset disables every control inside it at once and takes
          them out of the tab order; the notice above says why. */}
      <fieldset disabled={!CONTACT_ENABLED} className="min-w-0 space-y-5 disabled:opacity-60">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label={c.name} error={errors.name?.message} required>
            {(a) => <input {...register('name')} {...a} className={inputClass} autoComplete="name" />}
          </FormField>
          <FormField label={c.email} error={errors.email?.message} required>
            {(a) => <input {...register('email')} {...a} type="email" className={inputClass} autoComplete="email" />}
          </FormField>
          <FormField label={c.phone}>
            {(a) => <input {...register('phone')} {...a} type="tel" className={inputClass} autoComplete="tel" />}
          </FormField>
          <FormField label={c.subject}>
            {(a) => <input {...register('subject')} {...a} className={inputClass} />}
          </FormField>
        </div>
        <FormField label={c.message} error={errors.message?.message} required>
          {(a) => <textarea {...register('message')} {...a} rows={5} className={`${inputClass} resize-none`} />}
        </FormField>
        <Honeypot registration={register('website')} />

        {status === 'error' && (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-sans text-destructive flex items-center gap-2">
            <AlertCircle size={14} aria-hidden /> {dict.booking.errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full inline-flex items-center justify-center gap-2 bg-foreground hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed text-background font-sans font-semibold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
        >
          {status === 'submitting' && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {status === 'submitting' ? c.sending : c.send}
        </button>
      </fieldset>

      {/* GDPR art. 13 notice at the point of collection. No consent checkbox:
          answering an enquiry rests on art. 6(1)(b)/(f), and asking for
          consent would wrongly make the reply withdrawable. */}
      <p className="text-xs font-sans text-muted-foreground leading-relaxed">
        {c.privacyNotice}{' '}
        <Link href={href(lang, 'privacy')} className="text-foreground underline underline-offset-2">
          {dict.footer.privacy}
        </Link>
      </p>
    </form>
  )
}
