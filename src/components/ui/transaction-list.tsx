import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, CalendarDays, Clock, ReceiptText, Trash2, User, X } from 'lucide-react'
import { smoothEase } from '../../lib/motion'

export interface TransactionListItem {
  id: string
  icon: React.ReactNode
  name: string
  category: string
  accentColor?: string
  amount: string
  date: string
  time: string
  transactionId: string
  paymentMethod: string
  cardNumber: string
  cardType: string
  details?: { label: string; value: string }[]
  lineItems?: { label: string; amount: string; category?: string; categoryColor?: string }[]
}

const defaultAccentColor = '#6366f1'

export function TransactionList({
  transactions,
  title = 'Transactions',
  onDelete,
}: {
  transactions: TransactionListItem[]
  title?: string
  onDelete?: (id: string) => void
}) {
  const [open, setOpen] = useState<string | null>(null)

  const selected = transactions.find((t) => t.id === open) ?? null

  return (
    <div className="theme-injected bg-muted border-border w-full overflow-hidden rounded-2xl border shadow-sm">
      <div className="p-3">
        <AnimatePresence mode="wait" initial={false}>
          {!open && (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={smoothEase}
              className="flex w-full flex-col gap-2"
            >
              <span className="text-muted-foreground font-medium">{title}</span>

              {transactions.map((item) => (
                <TransactionItem
                  key={item.id}
                  data={item}
                  onClick={() => setOpen(item.id)}
                />
              ))}

              <button className="text-foreground flex items-center justify-center gap-1 rounded-sm py-1">
                <p className="text-sm">Tap a transaction for details</p>
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {selected && (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={smoothEase}
            >
              <TransactionItemExpanded
                data={selected}
                onClose={() => setOpen(null)}
                onDelete={onDelete ? () => {
                  onDelete(selected.id)
                  setOpen(null)
                } : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function TransactionItem({
  data,
  onClick,
}: {
  data: TransactionListItem
  onClick: () => void
}) {
  const accentColor = data.accentColor || defaultAccentColor

  return (
    <div className="flex w-full cursor-pointer gap-2 rounded-xl p-1 transition-colors hover:bg-background/70" onClick={onClick}>
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm"
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex items-center justify-center">{data.icon}</div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center text-xs">
        <p className="text-foreground truncate font-semibold">
          {data.name}
        </p>

        <p className="text-muted-foreground truncate">
          {data.category}
        </p>
      </div>

      <p className="text-muted-foreground flex items-center text-xs">
        {data.amount}
      </p>
    </div>
  )
}

function TransactionItemExpanded({
  data,
  onClose,
  onDelete,
}: {
  data: TransactionListItem
  onClose: () => void
  onDelete?: () => void
}) {
  const accentColor = data.accentColor || defaultAccentColor
  const person = data.details?.find((detail) => detail.label === 'Person')?.value
  const notes = data.details?.find((detail) => detail.label === 'Notes')?.value

  return (
    <div className="rounded-2xl bg-background p-4 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Transaction</p>
          <h3 className="mt-1 truncate text-xl font-black text-foreground">{data.name}</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">{data.category}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onDelete && (
            <button
              className="flex size-9 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors active:bg-red-100"
              onClick={onDelete}
              type="button"
              aria-label="Delete transaction"
            >
              <Trash2 className="size-4" />
            </button>
          )}
          <button
            className="flex size-9 items-center justify-center rounded-full bg-black/5 text-foreground transition-colors active:bg-black/10"
            onClick={onClose}
            type="button"
            aria-label="Close transaction details"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-black/10 bg-black px-4 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Total</p>
        <p className="mt-1 text-3xl font-black tracking-tight">{data.amount}</p>
        <p className="mt-2 text-xs font-medium text-white/50">#{data.transactionId}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        <DetailRow icon={<CalendarDays className="size-4" />} label="Date" value={data.date} />
        <DetailRow icon={<Clock className="size-4" />} label="Time" value={data.time} />
        {person && <DetailRow icon={<User className="size-4" />} label="Person" value={person} />}
        <DetailRow icon={<ReceiptText className="size-4" />} label="Source" value={data.paymentMethod} />
      </div>

      {data.lineItems && data.lineItems.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Items</p>
          <div className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10">
            {data.lineItems.map((item, index) => (
              <div className="flex items-start justify-between gap-3 bg-white px-3 py-3" key={`${item.label}-${index}`}>
                <div className="flex min-w-0 gap-2">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.categoryColor || accentColor }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{item.label}</p>
                    {item.category && <p className="truncate text-xs text-muted-foreground">{item.category}</p>}
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold text-foreground">{item.amount}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {notes && (
        <div className="mt-5 rounded-2xl bg-black/5 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="mt-1 text-sm font-medium text-foreground">{notes}</p>
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/5 px-3 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="min-w-0 truncate text-right text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
