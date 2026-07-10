import { motion, AnimatePresence } from 'motion/react'
import { HiX, HiTrash } from 'react-icons/hi'
import { Person } from '../../types'
import { MorphingButton } from '../ui/MorphingButton'
import { smoothEase, smoothSpring } from '../../lib/motion'

interface ManagePeopleProps {
  people: Person[]
  onAdd: (name: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onClose: () => void
}

export function ManagePeople({ people, onAdd, onRemove, onClose }: ManagePeopleProps) {
  const handleAdd = async (name: string) => {
    if (!name.trim()) return
    await onAdd(name.trim())
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={smoothEase}
      className="fixed inset-0 z-[100] flex items-end bg-black/30"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={smoothSpring}
        className="keyboard-safe-sheet safe-bottom w-full transform-gpu rounded-t-3xl bg-white px-5 pt-5 will-change-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-black">Manage People</h2>
            <p className="text-xs text-black/45">
              {people.length === 0 ? 'No people added yet' : `${people.length} saved ${people.length === 1 ? 'person' : 'people'}`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full bg-black p-2 text-white">
            <HiX className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-black/10 bg-white">
          <MorphingButton
            buttonText="Add Person"
            placeholder="Person name"
            inputType="text"
            onSubmit={handleAdd}
            className="w-full"
          />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-2">
          <div className="mb-1 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-black/40">
            Existing People
          </div>

          {people.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-sm font-semibold text-black">No people yet</p>
              <p className="mt-1 text-xs text-black/45">Add a person above to use them in transactions.</p>
            </div>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              <AnimatePresence>
                {people.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={smoothEase}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-gray-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate text-sm font-medium text-black">{p.name}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete ${p.name}`}
                      onClick={() => onRemove(p.id)}
                      className="rounded-full p-2 text-black/30 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
