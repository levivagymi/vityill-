'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useDict } from '@/components/providers/DictProvider'
import type { Locale } from '@/lib/types'

type FormData = { name: string; email: string; phone?: string; subject?: string; message: string }

const inputClass =
  'w-full bg-foreground/[0.04] border border-foreground/[0.10] text-foreground placeholder-foreground/25 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 focus:bg-foreground/[0.06] transition-all duration-200'
const labelClass = 'block text-xs font-sans text-foreground/50 uppercase tracking-wider mb-1.5'

export default function ContactForm() {
  const dict = useDict()
  const c = dict.contact
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const schema = z.object({
    name: z.string().min(1, dict.booking.requiredField),
    email: z.string().min(1, dict.booking.requiredField).email(dict.booking.invalidEmail),
    phone: z.string().optional(),
    subject: z.string().optional(),
    message: z.string().min(1, dict.booking.requiredField),
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
      <div className="bg-foreground/[0.03] border border-foreground/[0.12] rounded-2xl p-10 text-center">
        <CheckCircle size={48} className="text-foreground mx-auto mb-4" />
        <h3 className="font-heading text-xl mb-2">{c.successTitle}</h3>
        <p className="font-sans text-foreground/60 text-sm">{c.successMsg}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-foreground/[0.03] border border-foreground/[0.07] rounded-2xl p-6 sm:p-8 space-y-5">
      <h3 className="font-heading text-xl mb-1">{c.formTitle}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{c.name}</label>
          <input {...register('name')} className={inputClass} autoComplete="name" />
          {errors.name && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>{c.email}</label>
          <input {...register('email')} type="email" className={inputClass} autoComplete="email" />
          {errors.email && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelClass}>{c.phone}</label>
          <input {...register('phone')} type="tel" className={inputClass} autoComplete="tel" />
        </div>
        <div>
          <label className={labelClass}>{c.subject}</label>
          <input {...register('subject')} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>{c.message}</label>
        <textarea {...register('message')} rows={5} className={`${inputClass} resize-none`} />
        {errors.message && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{errors.message.message}</p>}
      </div>

      {status === 'error' && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-sans text-red-300 flex items-center gap-2">
          <AlertCircle size={14} /> {dict.booking.errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-foreground hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed text-background font-sans font-semibold text-base py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
      >
        {status === 'submitting' ? c.sending : c.send}
      </button>
    </form>
  )
}
