import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { HiX, HiPlus, HiTrash } from 'react-icons/hi'
import { BsReceipt } from 'react-icons/bs'
import { Person, Category, OCRResult } from '../../types'
import { OCRUpload } from './OCRUpload'
import { Combobox1 } from '../ui/combobox-01'

interface AddExpenseProps {
  people: Person[]
  categories: Category[]
  onSubmit: (data: {
    person_id?: string
    merchant?: string
    date: string
    total_amount: number
    notes?: string
    items: { category_id: string; description: string; amount: number }[]
  }) => Promise<void>
  onClose: () => void
}

export function AddExpense({ people, categories, onSubmit, onClose }: AddExpenseProps) {
  const [personId, setPersonId] = useState('')
  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ categoryId: '', description: '', amount: 0 }])
  const [showOCR, setShowOCR] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0)
  const personOptions = people.map((person) => ({
    value: person.id,
    label: person.name,
  }))
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: `${category.icon || ''} ${category.name}`.trim(),
    helper: 'Category',
  }))

  const addItem = () => {
    setItems([...items, { categoryId: '', description: '', amount: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleOCRResult = (result: OCRResult) => {
    setMerchant(result.merchant)
    if (result.date) setDate(result.date)
    if (result.items.length > 0) {
      const mappedItems = result.items.map((item) => {
        const matchedCat = categories.find(
          (c) => item.category && c.name.toLowerCase().includes(item.category!.toLowerCase())
        )
        return {
          categoryId: matchedCat?.id || categories[0]?.id || '',
          description: item.description,
          amount: item.amount,
        }
      })
      setItems(mappedItems)
    }
    setShowOCR(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (items.length === 0 || items.every((i) => !i.amount)) {
      setError('Add at least one item with an amount')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        person_id: personId || undefined,
        merchant: merchant || undefined,
        date,
        total_amount: totalAmount,
        notes: notes || undefined,
        items: items
          .filter((i) => i.amount > 0)
          .map((i) => ({
            category_id: i.categoryId || categories[0]?.id || '',
            description: i.description,
            amount: i.amount,
          })),
      })
      onClose()
    } catch {
      setError('Failed to save. Try again.')
    }
    setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end bg-black/30"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="keyboard-safe-sheet safe-bottom w-full rounded-t-3xl bg-white px-5 pt-5 shadow-2xl shadow-black/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">Add Expense</h2>
          <button onClick={onClose} className="rounded-full bg-black p-2 text-white">
            <HiX className="h-5 w-5" />
          </button>
        </div>

        {showOCR ? (
          <OCRUpload onResult={handleOCRResult} onBack={() => setShowOCR(false)} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Person</label>
                <Combobox1
                  options={personOptions}
                  value={personId}
                  onChange={setPersonId}
                  placeholder="Select person..."
                  searchPlaceholder="Search people..."
                  emptyText="No person found. Add people first."
                  ariaLabel="Person combobox"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Merchant / Store</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Superstore"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs font-semibold text-black"
                >
                  <HiPlus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>

              <div className="max-h-[18rem] space-y-3 overflow-y-auto pr-1">
                {items.map((item, i) => (
                  <div key={i} className="space-y-2 rounded-xl border border-black/10 bg-gray-50 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</p>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                          <HiTrash className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <Combobox1
                      options={categoryOptions}
                      value={item.categoryId}
                      onChange={(value) => updateItem(i, 'categoryId', value)}
                      placeholder="Select category..."
                      searchPlaceholder="Search categories..."
                      emptyText="No category found."
                      ariaLabel={`Category combobox item ${i + 1}`}
                    />

                    <div className="grid grid-cols-[1fr_6rem] gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(i, 'description', e.target.value)}
                        placeholder="Item name"
                        className="min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount || ''}
                        onChange={(e) => updateItem(i, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <BsReceipt className="h-5 w-5 text-black" />
                <span className="text-sm font-medium text-black">Total</span>
              </div>
              <span className="text-lg font-bold text-black">PKR {totalAmount.toLocaleString()}</span>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {error && <p className="text-center text-sm font-medium text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOCR(true)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3.5 text-sm font-bold text-black transition-all active:scale-[0.98]"
              >
                <BsReceipt className="h-4 w-4" /> Scan Receipt
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-2xl bg-black px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? 'Saving...' : `Save PKR ${totalAmount.toLocaleString()}`}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
