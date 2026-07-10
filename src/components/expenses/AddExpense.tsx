import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { HiX, HiPlus, HiTrash, HiCheckCircle } from 'react-icons/hi'
import { BsReceipt } from 'react-icons/bs'
import { Person, Category, OCRResult } from '../../types'
import { OCRUpload } from './OCRUpload'
import { Combobox1 } from '../ui/combobox-01'
import { smoothEase } from '../../lib/motion'

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
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle')
  const [formKey, setFormKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [scanMessage, setScanMessage] = useState<string | null>(null)

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

  const resetForm = () => {
    setPersonId('')
    setMerchant('')
    setDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setItems([{ categoryId: '', description: '', amount: 0 }])
    setError(null)
    setScanMessage(null)
    setFormKey((key) => key + 1)
  }

  const handleOCRResult = (result: OCRResult) => {
    const scannedItems = Array.isArray(result.items) ? result.items : []
    const validItems = scannedItems
      .map((item) => ({
        description: item.description?.trim() || 'Receipt item',
        amount: Number(item.amount || 0),
        category: item.category,
      }))
      .filter((item) => Number.isFinite(item.amount) && item.amount > 0)
    const receiptTotal = Number(result.total_amount || 0)

    setMerchant(result.merchant?.trim() || 'Receipt')
    if (result.date) setDate(result.date)

    const mappedItems = validItems.map((item) => ({
      categoryId: matchCategory(item.category, item.description, categories)?.id || categories[0]?.id || '',
      description: item.description,
      amount: item.amount,
    }))

    const detectedTotal = mappedItems.reduce((sum, item) => sum + item.amount, 0)
    if (receiptTotal > 0 && mappedItems.length === 0) {
      mappedItems.push({
        categoryId: matchCategory(undefined, result.merchant || 'Receipt total', categories)?.id || categories[0]?.id || '',
        description: result.merchant ? `${result.merchant} receipt` : 'Receipt total',
        amount: receiptTotal,
      })
    } else if (receiptTotal > detectedTotal + 1) {
      mappedItems.push({
        categoryId: categories.find((category) => category.name.toLowerCase() === 'other')?.id || categories[0]?.id || '',
        description: 'Receipt balance / tax',
        amount: Number((receiptTotal - detectedTotal).toFixed(2)),
      })
    }

    if (mappedItems.length > 0) setItems(mappedItems)
    setScanMessage(`Receipt scanned: ${mappedItems.length || validItems.length} item${(mappedItems.length || validItems.length) === 1 ? '' : 's'} filled`)
    setShowOCR(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    setError(null)
    setSaveState('saving')

    if (items.length === 0 || items.every((i) => !i.amount)) {
      setError('Add at least one item with an amount')
      setSaveState('idle')
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
      setSaveState('success')
      playSuccessSound()
      window.setTimeout(() => {
        resetForm()
        setSaveState('idle')
      }, 850)
    } catch {
      setError('Failed to save. Try again.')
      setSaveState('idle')
    }
    setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-end bg-black/30"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="keyboard-safe-sheet safe-bottom relative w-full transform-gpu rounded-t-3xl bg-white px-5 pt-5 shadow-2xl shadow-black/20 will-change-transform"
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
          <motion.form
            key={formKey}
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={smoothEase}
            className="space-y-4"
          >
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
                  searchable={false}
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
            {scanMessage && !error && (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
                {scanMessage}
              </p>
            )}

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
                disabled={submitting || saveState === 'success'}
                className="flex-1 rounded-2xl bg-black px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
              >
                {saveState === 'success' ? 'Added' : submitting ? 'Adding...' : `Save PKR ${totalAmount.toLocaleString()}`}
              </button>
            </div>
          </motion.form>
        )}

        <AnimatePresence>
          {saveState !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={smoothEase}
              className="pointer-events-none absolute inset-x-5 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-20 rounded-[2rem] border border-black/10 bg-white p-4 shadow-2xl shadow-black/20"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={saveState === 'saving' ? { rotate: 360 } : { rotate: 0, scale: [1, 1.12, 1] }}
                  transition={saveState === 'saving' ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0.38 }}
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${saveState === 'success' ? 'bg-emerald-500' : 'bg-black'}`}
                >
                  {saveState === 'success' ? <HiCheckCircle className="h-7 w-7 text-white" /> : <BsReceipt className="h-6 w-6 text-white" />}
                </motion.div>
                <div>
                  <p className="text-sm font-black text-black">{saveState === 'success' ? 'Expense added' : 'Adding expense'}</p>
                  <p className="text-xs font-semibold text-black/45">
                    {saveState === 'success' ? 'Ready for the next expense' : 'Saving your transaction now'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

function playSuccessSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const now = context.currentTime
    const gain = context.createGain()
    gain.connect(context.destination)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)

    const first = context.createOscillator()
    first.type = 'sine'
    first.frequency.setValueAtTime(660, now)
    first.connect(gain)
    first.start(now)
    first.stop(now + 0.12)

    const second = context.createOscillator()
    second.type = 'sine'
    second.frequency.setValueAtTime(880, now + 0.09)
    second.connect(gain)
    second.start(now + 0.09)
    second.stop(now + 0.28)

    window.setTimeout(() => context.close(), 450)
  } catch {}
}

function normalizeText(value?: string) {
  return (value || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function matchCategory(categoryName: string | undefined, description: string, categories: Category[]) {
  const categoryText = normalizeText(categoryName)
  const descriptionText = normalizeText(description)
  const combined = `${categoryText} ${descriptionText}`.trim()

  const exact = categories.find((category) => normalizeText(category.name) === categoryText)
  if (exact) return exact

  const includes = categories.find((category) => {
    const name = normalizeText(category.name)
    return categoryText.includes(name) || name.includes(categoryText) || descriptionText.includes(name)
  })
  if (includes) return includes

  const rules: Record<string, string[]> = {
    'Food & Dining': ['restaurant', 'food', 'cafe', 'coffee', 'pizza', 'burger', 'tea', 'meal', 'dining', 'bakery', 'kfc', 'mcdonald', 'domino'],
    Groceries: ['grocery', 'supermarket', 'milk', 'bread', 'egg', 'rice', 'flour', 'fruit', 'vegetable', 'mart', 'store'],
    Transportation: ['fuel', 'petrol', 'diesel', 'uber', 'careem', 'taxi', 'bus', 'train', 'parking', 'transport'],
    Shopping: ['clothes', 'shirt', 'shoes', 'shopping', 'retail', 'mall', 'garment'],
    'Bills & Utilities': ['bill', 'electric', 'gas', 'water', 'internet', 'phone', 'utility', 'wifi'],
    Healthcare: ['pharmacy', 'medical', 'doctor', 'hospital', 'medicine', 'clinic'],
    Entertainment: ['cinema', 'movie', 'game', 'netflix', 'spotify', 'entertainment'],
    Education: ['book', 'school', 'college', 'university', 'course', 'stationery'],
    Rent: ['rent'],
  }

  for (const [category, words] of Object.entries(rules)) {
    if (words.some((word) => combined.includes(word))) {
      const match = categories.find((item) => item.name.toLowerCase() === category.toLowerCase())
      if (match) return match
    }
  }

  return categories.find((category) => category.name.toLowerCase() === 'other') || categories[0]
}
