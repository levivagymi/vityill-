'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
import { CornerDownLeft, Search } from 'lucide-react'
import { useDict } from '@/components/providers/DictProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useLenis } from '@/components/engine/LenisProvider'
import { useCommand } from '@/components/command/command-context'
import { buildCommands, filterCommands, type Command, type CommandCtx, type CommandGroup } from './commands'
import type { Locale } from '@/lib/types'

const GROUP_ORDER: CommandGroup[] = ['nav', 'action', 'lang']

export default function CommandPalette() {
  const dict = useDict()
  const lenis = useLenis()
  const { open, setOpen } = useCommand()

  // Page scroll must not fight the palette while it is open.
  useEffect(() => {
    if (!open) return
    lenis?.stop()
    return () => lenis?.start()
  }, [open, lenis])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm
                     transition-opacity duration-300
                     data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
        />
        <Dialog.Popup
          aria-label={dict.command.title}
          className="fixed left-1/2 top-[16vh] z-[81] w-[min(92vw,600px)] -translate-x-1/2
                     rounded-2xl border border-foreground/12 bg-background/95 backdrop-blur-xl
                     shadow-2xl shadow-black/30 overflow-hidden
                     transition-[opacity,transform] duration-300 [transition-timing-function:var(--ease-cinematic)]
                     data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.97] data-[starting-style]:-translate-y-2
                     data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.97]"
        >
          <Dialog.Title className="sr-only">{dict.command.title}</Dialog.Title>
          {/* The popup unmounts when closed, so every open starts with fresh
              query/selection state — no reset effects needed. */}
          <PaletteSurface close={() => setOpen(false)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PaletteSurface({ close }: { close: () => void }) {
  const dict = useDict()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const lang = (params?.lang as Locale) ?? 'hu'
  const { toggle: toggleTheme } = useTheme()
  const lenis = useLenis()

  const [query, setQueryRaw] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const setQuery = (q: string) => {
    setQueryRaw(q)
    setActiveIdx(0)
  }

  const commands = useMemo(
    () => buildCommands(dict, lang, pathname),
    [dict, lang, pathname],
  )
  const results = useMemo(() => filterCommands(commands, query), [commands, query])

  const ctx: CommandCtx = useMemo(
    () => ({
      push: (target) => router.push(target),
      toggleTheme,
      jumpTo: (hash) => {
        const home = `/${lang}`
        if (pathname === home || pathname === `${home}/`) {
          lenis?.scrollTo(`#${hash}`, { offset: -70 })
        } else {
          router.push(`${home}#${hash}`)
        }
      },
    }),
    [router, toggleTheme, lang, pathname, lenis],
  )

  const runCommand = useCallback(
    (cmd: Command) => {
      close()
      cmd.run(ctx)
    },
    [ctx, close],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = results[activeIdx]
      if (cmd) runCommand(cmd)
    }
  }

  // Keep the active row in view while arrowing through the list.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const groupLabels: Record<CommandGroup, string> = {
    nav: dict.command.groupNav,
    action: dict.command.groupActions,
    lang: dict.command.groupLang,
  }

  // Preserve score order while searching; group only the browse view.
  const grouped: { group: CommandGroup; items: { cmd: Command; idx: number }[] }[] = query.trim()
    ? [{ group: 'nav', items: results.map((cmd, idx) => ({ cmd, idx })) }]
    : GROUP_ORDER.map((group) => ({
        group,
        items: results
          .map((cmd, idx) => ({ cmd, idx }))
          .filter(({ cmd }) => cmd.group === group),
      })).filter((g) => g.items.length > 0)

  return (
    <>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-foreground/[0.08]">
        <Search size={16} className="text-foreground/40 shrink-0" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={dict.command.placeholder}
          className="w-full bg-transparent font-sans text-sm text-foreground placeholder:text-foreground/35 outline-none"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-listbox"
          aria-activedescendant={results[activeIdx]?.id}
        />
        <kbd className="hidden sm:block shrink-0 font-sans text-[10px] uppercase tracking-wider text-foreground/35 border border-foreground/15 rounded-md px-1.5 py-0.5">
          Esc
        </kbd>
      </div>

      <div
        ref={listRef}
        id="command-listbox"
        role="listbox"
        aria-label={dict.command.title}
        className="max-h-[46vh] overflow-y-auto overscroll-contain py-2"
      >
        {results.length === 0 && (
          <p className="px-5 py-8 text-center font-sans text-sm text-foreground/40">
            {dict.command.empty}
          </p>
        )}
        {grouped.map(({ group, items }) => (
          <div key={group}>
            {!query.trim() && (
              <p className="px-5 pt-3 pb-1.5 font-sans text-[10px] uppercase tracking-[0.25em] text-foreground/35">
                {groupLabels[group]}
              </p>
            )}
            {items.map(({ cmd, idx }) => {
              const Icon = cmd.icon
              const active = idx === activeIdx
              return (
                <button
                  key={cmd.id}
                  id={cmd.id}
                  data-idx={idx}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => runCommand(cmd)}
                  onMouseMove={() => setActiveIdx(idx)}
                  data-cursor="view"
                  className={`flex w-full items-center gap-3 px-5 py-2.5 text-left font-sans text-sm transition-colors duration-150 cursor-pointer ${
                    active ? 'bg-foreground/[0.07] text-foreground' : 'text-foreground/65'
                  }`}
                  style={
                    active
                      ? { boxShadow: 'inset 2px 0 0 var(--glow), 0 0 24px -12px var(--glow-soft)' }
                      : undefined
                  }
                >
                  <Icon size={15} className={active ? 'text-foreground' : 'text-foreground/40'} aria-hidden />
                  <span className="flex-1 truncate">{cmd.label}</span>
                  {cmd.hint && (
                    <span className="text-[10px] uppercase tracking-wider text-foreground/30">{cmd.hint}</span>
                  )}
                  {active && <CornerDownLeft size={13} className="text-foreground/35" aria-hidden />}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 px-5 py-2.5 border-t border-foreground/[0.08] font-sans text-[10px] text-foreground/35">
        <span><kbd className="text-foreground/50">↑↓</kbd> {dict.command.hintNavigate}</span>
        <span><kbd className="text-foreground/50">↵</kbd> {dict.command.hintRun}</span>
        <span><kbd className="text-foreground/50">Esc</kbd> {dict.command.hintClose}</span>
      </div>
    </>
  )
}
