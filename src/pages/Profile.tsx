import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { useAuth } from '../hooks/useAuth'
import { HiCalendar, HiLogout, HiUser, HiUserGroup } from 'react-icons/hi'
import { BsShieldCheck } from 'react-icons/bs'
import { usePeople } from '../hooks/useExpenses'
import { ManagePeople } from '../components/expenses/ManagePeople'

export function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { people, add: addPerson, remove: removePerson } = usePeople()
  const [showPeople, setShowPeople] = useState(false)
  const adminEmails = ['wasi@gmail.com', 'k245620@nu.edu.pk']
  const canAssignWork = user?.is_admin || user?.features?.assign_work_to_jibran || adminEmails.includes(user?.email?.toLowerCase() || '')

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-6">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-black text-3xl font-bold text-white shadow-lg shadow-black/15">
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <p className="text-lg font-bold text-gray-900">{user?.name || 'User'}</p>
        <p className="text-sm text-gray-400">{user?.email}</p>
      </div>

      {canAssignWork && (
        <button
          type="button"
          onClick={() => navigate('/assign-work-to-jibran')}
          className="w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-400 p-5 text-left text-white shadow-xl shadow-fuchsia-500/20 active:scale-[0.98]"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <HiCalendar className="h-6 w-6 text-white" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Admin Task</p>
          <p className="mt-1 text-2xl font-black">Add Task</p>
          <p className="mt-2 text-sm font-semibold text-white/75">Assign work to Jibran in Google Calendar</p>
        </button>
      )}

      <div className="space-y-1 rounded-2xl bg-gray-50 p-1">
        <div className="flex items-center gap-3 rounded-xl px-4 py-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-black/10">
            <HiUser className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Default Currency</p>
            <p className="text-sm font-semibold text-gray-900">PKR - Pakistani Rupee</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl px-4 py-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black">
            <BsShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Account</p>
            <p className="text-sm font-semibold text-gray-900">Synced via Supabase</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPeople(true)}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-white"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-black/10">
            <HiUserGroup className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-xs text-gray-400">People</p>
            <p className="text-sm font-semibold text-gray-900">Manage People</p>
          </div>
        </button>

        {canAssignWork && (
          <button
            type="button"
            onClick={() => navigate('/assign-work-to-jibran')}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-white"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black">
              <HiCalendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Admin</p>
              <p className="text-sm font-semibold text-gray-900">Add Task / Assign Work</p>
            </div>
          </button>
        )}
      </div>

      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-6 py-3.5 text-sm font-bold text-red-600 transition-all active:scale-[0.98]"
      >
        <HiLogout className="h-4 w-4" /> Sign Out
      </button>

      <AnimatePresence>
        {showPeople && (
          <ManagePeople
            people={people}
            onAdd={addPerson}
            onRemove={removePerson}
            onClose={() => setShowPeople(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
