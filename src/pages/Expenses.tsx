import { useMemo, useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { HiUserAdd } from 'react-icons/hi'
import { useTransactions, usePeople } from '../hooks/useExpenses'
import { ExpenseList } from '../components/expenses/ExpenseList'
import { MorphingButton } from '../components/ui/MorphingButton'
import { Calendar5, type DateRange } from '../components/ui/calendar-05'

export function Expenses() {
  const { transactions, loading, remove } = useTransactions()
  const { people, add: addPerson } = usePeople()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [showCalendar, setShowCalendar] = useState(false)

  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from) return transactions

    const from = startOfDay(dateRange.from)
    const to = endOfDay(dateRange.to || dateRange.from)

    return transactions.filter((transaction) => {
      const date = parseTransactionDate(transaction.date)
      return date >= from && date <= to
    })
  }, [transactions, dateRange])

  const filteredTotal = filteredTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.total_amount || 0),
    0
  )

  const rangeLabel = dateRange?.from
    ? `${formatShortDate(dateRange.from)}${dateRange.to ? ` - ${formatShortDate(dateRange.to)}` : ''}`
    : 'All dates'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{filteredTransactions.length} expenses</p>
        <MorphingButton
          buttonText="Add People"
          placeholder="Person name"
          inputType="text"
          onSubmit={addPerson}
          wrapperClassName="theme-injected flex items-center justify-center"
          icon={<HiUserAdd className="h-4 w-4 text-black" />}
          variant="soft"
          size="mini"
        />
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Filtered spending</p>
            <p className="text-2xl font-black text-black">PKR {filteredTotal.toLocaleString()}</p>
            <p className="mt-0.5 text-xs text-black/50">{rangeLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            {dateRange?.from && (
              <button
                type="button"
                onClick={() => setDateRange(undefined)}
                className="flex size-10 items-center justify-center rounded-full bg-black/5 text-black transition-colors hover:bg-black hover:text-white"
                aria-label="Clear date filter"
              >
                <X className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCalendar((current) => !current)}
              className="flex h-10 items-center gap-2 rounded-full bg-black px-4 text-sm font-bold text-white shadow-lg shadow-black/15 transition-colors hover:bg-zinc-800"
            >
              <CalendarDays className="size-4" />
              Date
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showCalendar && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <Calendar5 selectedDateRange={dateRange} onSelect={setDateRange} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ExpenseList transactions={filteredTransactions} onDelete={remove} />
    </div>
  )
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function parseTransactionDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return new Date(value)
  return new Date(year, month - 1, day)
}
