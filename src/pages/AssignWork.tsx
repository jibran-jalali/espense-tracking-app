import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HiArrowLeft, HiCalendar, HiCheckCircle, HiClock, HiSparkles, HiTrash } from 'react-icons/hi'
import { HiMiniCalendarDays } from 'react-icons/hi2'
import { InlineAction } from '../components/ui/inline-action'
import { adminApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

type CalendarStatus = {
  connected: boolean
  connected_email: string | null
  calendar_id: string
  owner_email: string
  role: 'owner' | 'assigner' | 'none'
  can_sync_calendar: boolean
  can_manage_availability: boolean
  can_assign_tasks: boolean
  google_configured?: boolean
}

type Slot = {
  id?: string
  start: string
  end: string
  available: boolean
}

function toDateInputValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

function formatSlotTime(start: string, end?: string) {
  const formatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
  if (!end) return formatter.format(new Date(start))
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`
}

function dateTimeToIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}

function normalizeSlot(slot: any): Slot {
  return {
    id: slot.id,
    start: new Date(slot.start || slot.start_time).toISOString(),
    end: new Date(slot.end || slot.end_time).toISOString(),
    available: slot.available ?? true,
  }
}

function sortSlots(slots: Slot[]) {
  return [...slots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

export function AssignWork() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState<CalendarStatus | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()))
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [availabilityStart, setAvailabilityStart] = useState('09:00')
  const [availabilityEnd, setAvailabilityEnd] = useState('10:00')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const userEmail = user?.email?.toLowerCase() || ''
  const fallbackRole: CalendarStatus['role'] = userEmail === 'k245620@nu.edu.pk'
    ? 'owner'
    : userEmail === 'wasi@gmail.com'
      ? 'assigner'
      : 'none'
  const effectiveStatus = status || {
    connected: false,
    connected_email: null,
    calendar_id: 'primary',
    owner_email: 'k245620@nu.edu.pk',
    role: fallbackRole,
    can_sync_calendar: fallbackRole === 'owner',
    can_manage_availability: fallbackRole === 'owner',
    can_assign_tasks: fallbackRole === 'assigner',
    google_configured: false,
  }
  const isOwner = effectiveStatus.role === 'owner'
  const isAssigner = effectiveStatus.role === 'assigner'

  const calendarMessage = useMemo(() => {
    const value = searchParams.get('calendar')
    if (value === 'connected') return 'Google Calendar connected to the NU account.'
    if (value === 'error') return 'Google Calendar connection failed. Try again.'
    if (value === 'missing_code') return 'Google Calendar did not return a code. Try again.'
    return null
  }, [searchParams])

  const loadCalendar = useCallback(async () => {
    setLoading(true)
    const fallbackStatus: CalendarStatus = {
      connected: false,
      connected_email: null,
      calendar_id: 'primary',
      owner_email: 'k245620@nu.edu.pk',
      role: fallbackRole,
      can_sync_calendar: fallbackRole === 'owner',
      can_manage_availability: fallbackRole === 'owner',
      can_assign_tasks: fallbackRole === 'assigner',
      google_configured: false,
    }

    const [statusResult, timesResult] = await Promise.allSettled([
      adminApi.googleStatus(),
      adminApi.availableTimes(selectedDate),
    ])

    if (statusResult.status === 'fulfilled') {
      setStatus(statusResult.value)
    } else {
      setStatus(fallbackStatus)
    }

    if (timesResult.status === 'fulfilled') {
      setSlots(sortSlots((timesResult.value.slots || []).map(normalizeSlot)))
      setSelectedSlot(null)
    } else {
      setMessage(
        timesResult.reason?.message ||
          (statusResult.status === 'rejected'
            ? 'API route not available. Restart the backend or redeploy the latest API.'
            : 'Failed to load availability')
      )
    }

    setLoading(false)
  }, [fallbackRole, selectedDate])

  useEffect(() => {
    loadCalendar()
  }, [loadCalendar])

  const syncCalendar = async () => {
    setMessage(null)
    try {
      if (!effectiveStatus.connected) {
        if (!effectiveStatus.google_configured) {
          throw new Error('Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the backend environment first.')
        }
        const data = await adminApi.googleAuthUrl()
        window.location.href = data.url
        return
      }

      await loadCalendar()
      setMessage('Calendar events synced for the selected date.')
    } catch (error: any) {
      setMessage(error.message || 'Google Calendar is not configured yet.')
      throw error
    }
  }

  const addAvailability = async () => {
    const startIso = dateTimeToIso(selectedDate, availabilityStart)
    const endIso = dateTimeToIso(selectedDate, availabilityEnd)
    if (new Date(startIso) >= new Date(endIso)) {
      setMessage('End time must be after start time.')
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const data = await adminApi.addAvailability({
        start_time: startIso,
        end_time: endIso,
      })
      if (data?.slot) setSlots((current) => sortSlots([...current, normalizeSlot(data.slot)]))
      setMessage('Availability added for k245620@nu.edu.pk.')
      await loadCalendar()
    } catch (error: any) {
      setMessage(error.message || 'Failed to add availability')
    } finally {
      setSaving(false)
    }
  }

  const removeAvailability = async (slot: Slot) => {
    if (!slot.id) return
    setSaving(true)
    setMessage(null)
    try {
      await adminApi.removeAvailability(slot.id)
      setSlots((current) => current.filter((item) => item.id !== slot.id))
      if (selectedSlot?.id === slot.id) setSelectedSlot(null)
      setMessage('Availability removed.')
      await loadCalendar()
    } catch (error: any) {
      setMessage(error.message || 'Failed to remove availability')
    } finally {
      setSaving(false)
    }
  }

  const assignTask = async () => {
    if (!selectedSlot || !title.trim()) {
      setMessage('Choose an available time and add a task title.')
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      await adminApi.createTask({
        assignee: 'Jibran',
        title: title.trim(),
        notes: notes.trim(),
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
      })
      setTitle('')
      setNotes('')
      setSelectedSlot(null)
      setMessage('Task assigned and added to k245620@nu.edu.pk Google Calendar.')
      await loadCalendar()
    } catch (error: any) {
      setMessage(error.message || 'Failed to assign task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="keyboard-safe-page space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700"
          aria-label="Go back"
        >
          <HiArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Admin Task</p>
          <h1 className="text-2xl font-black text-gray-950">Add Task</h1>
        </div>
      </div>

      {(calendarMessage || message) && (
        <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm font-semibold text-gray-800 shadow-sm">
          {calendarMessage || message}
        </div>
      )}

      <section className="rounded-[2rem] bg-black p-5 text-white shadow-xl shadow-black/15">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <HiSparkles className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
              {isOwner ? 'Your calendar' : 'Jibran availability'}
            </p>
            <h2 className="mt-1 text-2xl font-black">
              {isOwner ? 'Set your available times' : 'Assign at available times'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              {isOwner
                ? 'Sync your Google Calendar and add time slots that Wasi can use for task assignment.'
                : 'Wasi can pick from the NU account availability and the task is added to that Google Calendar.'}
            </p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">
            {effectiveStatus.connected ? 'Synced' : 'Setup'}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <label className="block text-sm font-black text-gray-950" htmlFor="work-date">
          Date
        </label>
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
          <HiCalendar className="h-5 w-5 text-gray-400" />
          <input
            id="work-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-gray-900 outline-none"
          />
        </div>
      </section>

      {isOwner && (
        <section className="space-y-4 rounded-3xl bg-gray-50 p-4">
          <InlineAction
            label="Calendar"
            icon={<HiMiniCalendarDays size={24} />}
            actionText={effectiveStatus.connected ? 'Sync Events' : 'Connect'}
            onAction={syncCalendar}
          />
          {!effectiveStatus.google_configured && (
            <div className="rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-700">
              Google auth is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the backend environment to connect Calendar.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-gray-500" htmlFor="availability-start">Start</label>
              <input
                id="availability-start"
                type="time"
                value={availabilityStart}
                onChange={(event) => setAvailabilityStart(event.target.value)}
                className="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-950 outline-none ring-1 ring-black/5"
              />
            </div>
            <div>
              <label className="text-xs font-black text-gray-500" htmlFor="availability-end">End</label>
              <input
                id="availability-end"
                type="time"
                value={availabilityEnd}
                onChange={(event) => setAvailabilityEnd(event.target.value)}
                className="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-950 outline-none ring-1 ring-black/5"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addAvailability}
            disabled={saving}
            className="w-full rounded-2xl bg-black px-5 py-4 text-sm font-black text-white transition-all active:scale-[0.98] disabled:bg-gray-300"
          >
            {saving ? 'Saving...' : 'Add Available Time'}
          </button>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-950">{isOwner ? 'My Available Times' : 'Available times'}</h2>
          <span className="text-xs font-semibold text-gray-400">{isOwner ? 'Tap red icon to delete' : 'From k245620@nu.edu.pk'}</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {loading ? (
            <div className="rounded-2xl bg-gray-50 p-4 text-center text-sm font-semibold text-gray-400">Loading times...</div>
          ) : slots.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-4 text-center text-sm font-semibold text-gray-400">
              No availability added for this date.
            </div>
          ) : (
            slots.map((slot) => {
              const selected = selectedSlot?.start === slot.start
              return (
                <div
                  key={slot.id || slot.start}
                  className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                    selected
                      ? 'border-black bg-black text-white shadow-lg shadow-black/15'
                      : slot.available
                        ? 'border-black/5 bg-white text-gray-950 shadow-sm'
                        : 'border-gray-100 bg-gray-50 text-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    disabled={!isAssigner || !slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                  >
                    <HiClock className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{formatSlotTime(slot.start, slot.end)}</p>
                      <p className="mt-1 text-xs font-semibold opacity-60">{slot.available ? 'Available' : 'Busy in Google Calendar'}</p>
                    </div>
                  </button>
                  {isOwner && slot.id && (
                    <button
                      type="button"
                      onClick={() => removeAvailability(slot)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500"
                      aria-label="Remove availability"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      {isAssigner && (
        <section className="space-y-3 rounded-3xl bg-gray-50 p-4">
          <div>
            <label className="text-sm font-black text-gray-950" htmlFor="task-title">Task title</label>
            <input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What should Jibran do?"
              className="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-950 outline-none ring-1 ring-black/5 focus:ring-black/20"
            />
          </div>
          <div>
            <label className="text-sm font-black text-gray-950" htmlFor="task-notes">Notes</label>
            <textarea
              id="task-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional details"
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-950 outline-none ring-1 ring-black/5 focus:ring-black/20"
            />
          </div>
          <button
            type="button"
            disabled={saving || !selectedSlot || !title.trim() || !effectiveStatus.connected}
            onClick={assignTask}
            className="w-full rounded-2xl bg-black px-5 py-4 text-sm font-black text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? 'Assigning...' : 'Assign to Jibran'}
          </button>
          {!effectiveStatus.connected && (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-700">
              <HiCheckCircle className="h-4 w-4" /> k245620@nu.edu.pk needs to connect Google Calendar first.
            </div>
          )}
        </section>
      )}
    </div>
  )
}
