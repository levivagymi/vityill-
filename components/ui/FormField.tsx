'use client'
import { useId, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

/** Props the field hands to its control: the label association plus the
 *  error wiring screen readers need - `aria-invalid` flags the control and
 *  `aria-describedby` makes the error text part of what is announced on
 *  focus, not just a one-off live-region blip. */
export type FieldControlProps = {
  id: string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
  'aria-required': true | undefined
}

const labelClass = 'block text-xs font-sans text-muted-foreground uppercase tracking-wider mb-1.5'

export default function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: (control: FieldControlProps) => ReactNode
}) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
        'aria-required': required ? true : undefined,
      })}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-sans text-destructive flex items-center gap-1">
          <AlertCircle size={11} aria-hidden /> {error}
        </p>
      )}
    </div>
  )
}
