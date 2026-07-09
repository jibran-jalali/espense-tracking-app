import { useState } from 'react'
import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Transition,
} from 'motion/react'
import { ArrowRight, Trash2, X } from 'lucide-react'
import useMeasure from 'react-use-measure'

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

function colorWithAlpha(color: string | undefined, alpha: number) {
  const fallback = defaultAccentColor
  const hex = color?.trim().replace('#', '') || fallback.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return fallback

  const red = parseInt(hex.slice(0, 2), 16)
  const green = parseInt(hex.slice(2, 4), 16)
  const blue = parseInt(hex.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const springConfig: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.6,
}

const opacityConfig: Transition = {
  duration: 0.4,
  ease: [0.19, 1, 0.22, 1],
}

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
  const [ref, bounds] = useMeasure()

  const selected = transactions.find((t) => t.id === open) ?? null

  return (
    <MotionConfig transition={springConfig}>
      <motion.div
        className="theme-injected bg-muted border-border w-full overflow-hidden rounded-2xl border shadow-sm"
        animate={{ height: bounds.height > 0 ? bounds.height : 'auto' }}
      >
        <div className="p-3" ref={ref}>
          <AnimatePresence mode="popLayout">
            {!open && (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={opacityConfig}
                className="flex w-full flex-col gap-2"
              >
                <span className="text-muted-foreground font-medium">
                  {title}
                </span>

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
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {selected && (
              <motion.div exit={{ opacity: 0, transition: { duration: 0.1 } }}>
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
      </motion.div>
    </MotionConfig>
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
      <motion.div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm"
        style={{ backgroundColor: accentColor }}
        layoutId={`icon-${data.id}`}
        layout="position"
      >
        <div className="flex items-center justify-center">{data.icon}</div>
      </motion.div>

      <div className="flex min-w-0 flex-1 flex-col justify-center text-xs">
        <motion.p
          className="text-foreground truncate font-semibold"
          layoutId={`name-${data.id}`}
          layout="position"
        >
          {data.name}
        </motion.p>

        <motion.p
          className="text-muted-foreground truncate"
          layoutId={`category-${data.id}`}
          layout="position"
        >
          {data.category}
        </motion.p>
      </div>

      <motion.p
        className="text-muted-foreground flex items-center text-xs"
        layoutId={`amount-${data.id}`}
        layout="position"
      >
        {data.amount}
      </motion.p>
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

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className="rounded-2xl border p-3"
        style={{
          borderColor: colorWithAlpha(accentColor, 0.22),
          background: `linear-gradient(135deg, ${colorWithAlpha(accentColor, 0.18)}, ${colorWithAlpha(accentColor, 0.04)})`,
        }}
      >
        <div className="flex justify-between">
          <motion.div
            className="flex size-11 items-center justify-center rounded-xl shadow-sm"
            style={{ backgroundColor: accentColor }}
            layoutId={`icon-${data.id}`}
            layout="position"
          >
            {data.icon}
          </motion.div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                className="flex cursor-pointer items-center justify-center self-start rounded-full bg-red-50 p-2 text-red-500 shadow-sm"
                onClick={onDelete}
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            )}
            <button
              className="flex cursor-pointer items-center justify-center self-start rounded-full bg-white/85 p-2 shadow-sm"
              onClick={onClose}
              type="button"
            >
              <X className="text-foreground size-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-between gap-4">
          <div className="min-w-0">
            <motion.p
              className="text-foreground truncate font-semibold"
              layoutId={`name-${data.id}`}
              layout="position"
            >
              {data.name}
            </motion.p>

            <motion.p
              className="text-muted-foreground text-sm"
              layoutId={`category-${data.id}`}
              layout="position"
            >
              {data.category}
            </motion.p>
          </div>

          <motion.p
            layoutId={`amount-${data.id}`}
            className="shrink-0 rounded-full bg-white px-3 py-1.5 font-bold text-foreground shadow-sm"
            layout="position"
          >
            {data.amount}
          </motion.p>
        </div>
      </div>

      <motion.div
        className="flex flex-col gap-2 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          ...opacityConfig,
          delay: 0.1,
        }}
      >
        <div className="border-border border border-dashed" />

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'ID', value: `#${data.transactionId}` },
            { label: 'Date', value: data.date },
            { label: 'Time', value: data.time },
          ].map((item) => (
            <div
              className="rounded-xl border p-2"
              style={{
                borderColor: colorWithAlpha(accentColor, 0.16),
                backgroundColor: colorWithAlpha(accentColor, 0.08),
              }}
              key={item.label}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-1 truncate font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        {data.details?.map((detail) => (
          <p className="text-muted-foreground" key={detail.label}>
            {detail.label}: <span className="text-foreground font-medium">{detail.value}</span>
          </p>
        ))}

        {data.lineItems && data.lineItems.length > 0 && (
          <div className="space-y-2 rounded-xl bg-background/70 p-2">
            {data.lineItems.map((item, index) => (
              <div className="flex items-start justify-between gap-3" key={`${item.label}-${index}`}>
                <div className="flex min-w-0 gap-2">
                  <span
                    className="mt-1 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.categoryColor || accentColor }}
                  />
                  <div className="min-w-0">
                  <p className="text-foreground truncate font-medium">{item.label}</p>
                  {item.category && <p className="text-muted-foreground">{item.category}</p>}
                  </div>
                </div>
                <p className="text-foreground shrink-0 font-semibold">{item.amount}</p>
              </div>
            ))}
          </div>
        )}

        <div className="border-border border border-dashed" />
        <p className="text-muted-foreground">Paid Via {data.paymentMethod}</p>
        <p className="text-muted-foreground">
          {data.cardNumber}{' '}
          <span className="text-foreground font-bold uppercase italic">
            {data.cardType}
          </span>
        </p>
      </motion.div>
    </div>
  )
}
