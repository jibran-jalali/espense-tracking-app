import { Outlet } from 'react-router-dom'
import { BottomNav } from '../ui/BottomNav'

export function AppLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white">
      <header className="safe-top sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur-lg">
        <div className="flex items-center justify-center px-5 py-4">
          <img src="/icons/logo_full.png" alt="FinTrack" className="h-9 w-auto max-w-[170px] object-contain" />
        </div>
      </header>

      <main className="px-5 pb-24 pt-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
