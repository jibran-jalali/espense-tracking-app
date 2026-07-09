import { HiDotsHorizontal } from 'react-icons/hi'
import { ReceiptText } from 'lucide-react'
import { Transaction } from '../../types'
import { TransactionList, type TransactionListItem } from '../ui/transaction-list'

interface ExpenseListProps {
  transactions: Transaction[]
  onDelete?: (id: string) => void
}

export function ExpenseList({ transactions, onDelete }: ExpenseListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 rounded-full bg-gray-100 p-6">
          <HiDotsHorizontal className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-400">No expenses yet</p>
        <p className="text-xs text-gray-300">Tap + to add your first expense</p>
      </div>
    )
  }

  const formattedTransactions: TransactionListItem[] = transactions.map((tx) => {
    const createdAt = tx.created_at ? new Date(tx.created_at) : new Date(tx.date)
    const categories = tx.items
      ?.map((item) => item.category?.name)
      .filter(Boolean) as string[] | undefined
    const uniqueCategories = [...new Set(categories || [])]
    const personName = tx.person?.name || 'No person selected'
    const accentColor = tx.items?.find((item) => item.category?.color)?.category?.color || '#6366f1'

    return {
      id: tx.id,
      icon: <ReceiptText className="h-5 w-5 text-background" />,
      name: tx.merchant || 'Expense',
      category: uniqueCategories.length > 0 ? uniqueCategories.join(', ') : 'Uncategorized',
      accentColor,
      amount: `PKR ${Number(tx.total_amount).toLocaleString()}`,
      date: new Date(tx.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      time: createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      transactionId: tx.id.slice(0, 8).toUpperCase(),
      paymentMethod: 'Manual Entry',
      cardNumber: tx.currency || 'PKR',
      cardType: tx.currency || 'PKR',
      details: [
        { label: 'Person', value: personName },
        ...(tx.merchant ? [{ label: 'Merchant', value: tx.merchant }] : []),
        ...(tx.notes ? [{ label: 'Notes', value: tx.notes }] : []),
      ],
      lineItems: tx.items?.map((item) => ({
        label: item.description || 'Item',
        amount: `PKR ${Number(item.amount).toLocaleString()}`,
        category: item.category?.name || 'Uncategorized',
        categoryColor: item.category?.color,
      })),
    }
  })

  return (
    <TransactionList
      title="View Transactions"
      transactions={formattedTransactions}
      onDelete={onDelete}
    />
  )
}
