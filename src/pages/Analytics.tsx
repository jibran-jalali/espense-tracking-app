import { useTransactions } from '../hooks/useExpenses'
import { Analytics as AnalyticsComponent } from '../components/analytics/Analytics'

export function AnalyticsPage() {
  const { transactions, loading } = useTransactions()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return <AnalyticsComponent transactions={transactions} />
}
