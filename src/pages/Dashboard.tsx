import { useMemo } from 'react'
import { CalendarDays, ReceiptText, TrendingUp, WalletCards } from 'lucide-react'
import { useTransactions } from '../hooks/useExpenses'
import { ExpenseList } from '../components/expenses/ExpenseList'
import { MinimalCarousel, type CarouselCard } from '../components/ui/minimal-carousel'

export function Dashboard() {
  const { transactions, loading } = useTransactions()

  const stats = useMemo(() => {
    const total = transactions.reduce((sum, transaction) => sum + getAmount(transaction.total_amount), 0)
    const now = new Date()
    const thisMonth = transactions.filter((t) => {
      const d = parseTransactionDate(t.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const monthTotal = thisMonth.reduce((sum, transaction) => sum + getAmount(transaction.total_amount), 0)
    const avgSpend = transactions.length > 0 ? total / transactions.length : 0
    const recent = transactions.slice(0, 5)
    return { total, monthTotal, avgSpend, transactionCount: transactions.length, recent }
  }, [transactions])

  const cards: CarouselCard[] = [
    {
      id: 'month',
      title: 'This Month',
      value: `PKR ${stats.monthTotal.toLocaleString()}`,
      color: 'bg-[#171717]',
      icon: CalendarDays,
    },
    {
      id: 'total',
      title: 'Total Spent',
      value: `PKR ${stats.total.toLocaleString()}`,
      color: 'bg-[#AD46FF]',
      icon: WalletCards,
    },
    {
      id: 'transactions',
      title: 'Transactions',
      value: `${stats.transactionCount}`,
      color: 'bg-[#00B8DB]',
      icon: ReceiptText,
    },
    {
      id: 'average',
      title: 'Average Spend',
      value: `PKR ${Math.round(stats.avgSpend).toLocaleString()}`,
      color: 'bg-[#2B7FFF]',
      icon: TrendingUp,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <MinimalCarousel
        cards={cards}
        onCopyClick={(card) => navigator.clipboard?.writeText(card.value)}
      />

      <div>
        <h2 className="mb-3 text-sm font-bold text-black">Recent Expenses</h2>
        <ExpenseList transactions={stats.recent} />
      </div>
    </div>
  )
}

function getAmount(value: number | string | null | undefined) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function parseTransactionDate(value: string) {
  const [year, month, day] = value.split('T')[0].split('-').map(Number)
  if (year && month && day) return new Date(year, month - 1, day)
  return new Date(value)
}
