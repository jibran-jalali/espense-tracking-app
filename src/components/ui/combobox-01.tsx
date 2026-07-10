import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from 'lucide-react'

export type ComboboxOption = {
  value: string
  label: string
  helper?: string
}

type Combobox1Props = {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  ariaLabel?: string
  className?: string
  searchable?: boolean
}

export function Combobox1({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No option found.',
  ariaLabel = 'Combobox',
  className = '',
  searchable = true,
}: Combobox1Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 192 })

  const selected = options.find((option) => option.value === value)
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!searchable || !normalizedQuery) return options
    return options.filter((option) =>
      `${option.label} ${option.helper || ''}`.toLowerCase().includes(normalizedQuery)
    )
  }, [options, query, searchable])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return

    const viewport = window.visualViewport
    const viewportTop = viewport?.offsetTop || 0
    const viewportHeight = viewport?.height || window.innerHeight
    const viewportBottom = viewportTop + viewportHeight
    const gap = 6
    const preferredHeight = 236
    const spaceBelow = viewportBottom - rect.bottom - gap - 12
    const spaceAbove = rect.top - viewportTop - gap - 12
    const opensAbove = spaceBelow < 180 && spaceAbove > spaceBelow
    const maxHeight = Math.max(140, Math.min(preferredHeight, opensAbove ? spaceAbove : spaceBelow))

    setPosition({
      top: opensAbove ? rect.top - gap - maxHeight : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight,
    })
  }

  useEffect(() => {
    if (!open) return

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.visualViewport?.addEventListener('resize', updatePosition)
    window.visualViewport?.addEventListener('scroll', updatePosition)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      window.visualViewport?.removeEventListener('resize', updatePosition)
      window.visualViewport?.removeEventListener('scroll', updatePosition)
    }
  }, [open])

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          updatePosition()
          setOpen((current) => !current)
        }}
        className="flex h-10 w-full touch-manipulation items-center justify-between rounded-xl border border-border/60 bg-background px-3 text-left text-sm shadow-xs outline-none transition-colors hover:bg-accent/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className={selected ? 'truncate text-foreground' : 'truncate text-muted-foreground'}>
          {selected?.label || placeholder}
        </span>
        <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close combobox"
            className="fixed inset-0 z-[55] cursor-default bg-transparent"
            onClick={close}
            tabIndex={-1}
          />
          <div
            className="fixed z-[60] overflow-hidden rounded-xl border border-border/60 bg-white shadow-xl shadow-black/10"
            style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}
          >
            {searchable && (
              <div className="flex h-9 items-center gap-2 border-b border-black/10 px-3">
                <SearchIcon className="size-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            )}

            <div className="overflow-y-auto p-1" style={{ maxHeight: Math.max(96, position.maxHeight - (searchable ? 36 : 0)) }}>
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground">{emptyText}</div>
              ) : (
                filteredOptions.map((option) => {
                  const checked = option.value === value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      data-checked={checked}
                      onClick={() => {
                        onChange(checked ? '' : option.value)
                        close()
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted data-[checked=true]:bg-black data-[checked=true]:text-white"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{option.label}</span>
                        {option.helper && (
                          <span className="block truncate text-xs opacity-60">{option.helper}</span>
                        )}
                      </span>
                      {checked && <CheckIcon className="size-4 shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Combobox1
