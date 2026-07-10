import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from '../ui/BottomNav'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Expenses',
  '/analytics': 'Analytics',
  '/profile': 'Profile',
  '/assign-work-to-jibran': 'Add Task',
}

export function AppLayout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'FinTrack'

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white">
      <header className="safe-top sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur-lg">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/icons/logo_full.png" alt="FinTrack" className="h-8 w-auto max-w-[140px] object-contain" />
            {title !== 'FinTrack' && <h1 className="truncate text-lg font-bold text-black">{title}</h1>}
          </div>
        </div>
      </header>

      <main className="px-5 pb-24 pt-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
