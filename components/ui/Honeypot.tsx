import type { UseFormRegisterReturn } from 'react-hook-form'

/**
 * Bot trap. Moved off-screen rather than `display:none`, because naive bots
 * skip hidden inputs but fill every field they can see in the markup. People
 * never reach it: it is aria-hidden, out of the tab order, and not
 * autofilled. The API routes treat a non-empty value as a bot submission and
 * answer with a silent success (lib/api-guard.ts: isHoneypotFilled).
 */
export default function Honeypot({ registration }: { registration: UseFormRegisterReturn<'website'> }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
      <label>
        Website
        <input {...registration} type="text" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}
