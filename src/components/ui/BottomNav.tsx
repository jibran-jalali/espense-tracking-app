import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { HiHome, HiChartBar, HiPlusCircle, HiUser } from 'react-icons/hi'
import { BsReceipt } from 'react-icons/bs'
import { smoothSpring } from '../../lib/motion'

const tabs = [
  { path: '/dashboard', label: 'Home', icon: HiHome },
  { path: '/expenses', label: 'Expenses', icon: BsReceipt },
  { path: '/add', label: 'Add', icon: HiPlusCircle, special: true },
  { path: '/analytics', label: 'Analytics', icon: HiChartBar },
  { path: '/profile', label: 'Profile', icon: HiUser },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-1 pt-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          const Icon = tab.icon

          if (tab.special) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative -mt-3 flex h-14 w-14 items-center justify-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black shadow-lg shadow-black/20">
                  <Icon className="h-7 w-7 text-white" />
                </div>
              </button>
            )
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-2 h-1 w-8 rounded-full bg-black"
                  transition={smoothSpring}
                />
              )}
              <Icon
                className={`h-6 w-6 ${
                  isActive ? 'text-black' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-black' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
