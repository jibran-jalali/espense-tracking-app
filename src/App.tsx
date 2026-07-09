import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthScreen } from './components/auth/AuthScreen'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Expenses } from './pages/Expenses'
import { AnalyticsPage } from './pages/Analytics'
import { Profile } from './pages/Profile'
import { AssignWork } from './pages/AssignWork'
import { AddExpense } from './components/expenses/AddExpense'
import { usePeople, useCategories, useTransactions } from './hooks/useExpenses'
import { useEffect } from 'react'
import { HiArrowLeft } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'

function useKeyboardSafeViewport() {
  useEffect(() => {
    const root = document.documentElement

    const updateViewportVars = () => {
      const visualViewport = window.visualViewport
      const viewportHeight = visualViewport?.height || window.innerHeight
      const keyboardInset = visualViewport
        ? Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)
        : 0

      root.style.setProperty('--visual-viewport-height', `${viewportHeight}px`)
      root.style.setProperty('--keyboard-inset', `${keyboardInset}px`)
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (!target.matches('input, textarea, select, [contenteditable="true"]')) return

      window.setTimeout(() => {
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
      }, 275)
    }

    updateViewportVars()
    window.visualViewport?.addEventListener('resize', updateViewportVars)
    window.visualViewport?.addEventListener('scroll', updateViewportVars)
    window.addEventListener('resize', updateViewportVars)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewportVars)
      window.visualViewport?.removeEventListener('scroll', updateViewportVars)
      window.removeEventListener('resize', updateViewportVars)
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [])
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const adminEmails = ['wasi@gmail.com', 'k245620@nu.edu.pk']
  const hasAccess = user?.is_admin || user?.features?.assign_work_to_jibran || adminEmails.includes(user?.email?.toLowerCase() || '')
  if (!hasAccess) return <Navigate to="/profile" replace />
  return <>{children}</>
}

function AddExpensePage() {
  const navigate = useNavigate()
  const { people } = usePeople()
  const { categories } = useCategories()
  const { add } = useTransactions()

  return (
    <div className="safe-top min-h-screen bg-white px-5 pt-4">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-600">
        <HiArrowLeft className="h-4 w-4" /> Back
      </button>
      <AddExpense
        people={people}
        categories={categories}
        onSubmit={async (data) => {
          await add(data)
          navigate('/expenses')
        }}
        onClose={() => navigate(-1)}
      />
    </div>
  )
}

export default function App() {
  useKeyboardSafeViewport()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthScreen />}
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/assign-work-to-jibran" element={<AdminRoute><AssignWork /></AdminRoute>} />
      </Route>
      <Route
        path="/add"
        element={
          <ProtectedRoute>
            <AddExpensePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}
