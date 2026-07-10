import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Transaction } from '../../types'
import { analyticsApi } from '../../lib/api'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { ContinuousTabs } from '../ui/continuous-tabs'

interface AnalyticsProps {
  transactions: Transaction[]
}

type ViewType = 'category' | 'person' | 'monthly' | 'yearly' | 'ai'

type AiRecommendation = {
  headline: string
  summary: string
  suggestions: string[]
}

export function Analytics({ transactions }: AnalyticsProps) {
  const [view, setView] = useState<ViewType>('category')
  const [aiRecommendation, setAiRecommendation] = useState<AiRecommendation | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLoaded, setAiLoaded] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string; icon: string }> = {}
    transactions.forEach((tx) => {
      tx.items?.forEach((item) => {
        const cat = item.category
        if (!cat) return
        if (!map[cat.id]) {
          map[cat.id] = { name: cat.name, value: 0, color: cat.color || '#6b7280', icon: cat.icon || '📌' }
        }
        map[cat.id].value += Number(item.amount || 0)
      })
    })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [transactions])

  const personData = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {}
    transactions.forEach((tx) => {
      const ppl = tx.person
      const key = ppl ? ppl.name : 'Unknown'
      if (!map[key]) map[key] = { name: key, value: 0 }
      map[key].value += Number(tx.total_amount || 0)
    })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [transactions])

  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; total: number }> = {}
    transactions.forEach((tx) => {
      const d = new Date(tx.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map[key]) {
        map[key] = {
          month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          total: 0,
        }
      }
      map[key].total += Number(tx.total_amount || 0)
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value)
  }, [transactions])

  const yearlyData = useMemo(() => {
    const map: Record<string, { year: string; total: number }> = {}
    transactions.forEach((tx) => {
      const key = new Date(tx.date).getFullYear().toString()
      if (!map[key]) map[key] = { year: key, total: 0 }
      map[key].total += Number(tx.total_amount || 0)
    })
    return Object.values(map).sort((a, b) => a.year.localeCompare(b.year))
  }, [transactions])

  const totalSpent = transactions.reduce((sum, tx) => sum + Number(tx.total_amount || 0), 0)
  const averageSpend = transactions.length > 0 ? totalSpent / transactions.length : 0
  const topCategory = categoryData[0]
  const topPerson = personData[0]
  const thisMonthTotal = useMemo(() => {
    const now = new Date()
    return transactions.reduce((sum, tx) => {
      const date = new Date(tx.date)
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return sum + Number(tx.total_amount || 0)
      }
      return sum
    }, 0)
  }, [transactions])

  const views: { key: ViewType; label: string }[] = [
    { key: 'category', label: 'Category' },
    { key: 'person', label: 'Person' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'ai', label: 'AI' },
  ]

  const COLORS = ['#00D1FF', '#7C3AED', '#FF4D8D', '#FFB703', '#00C853', '#FF6B35', '#3B82F6', '#E11D48', '#14B8A6', '#A855F7']

  useEffect(() => {
    if (view !== 'ai' || aiLoaded || aiLoading) return

    let cancelled = false
    setAiLoading(true)
    setAiError(null)

    analyticsApi.recommendation()
      .then((data) => {
        if (!cancelled) setAiRecommendation(data)
      })
      .catch((error) => {
        if (!cancelled) setAiError(error.message || 'Failed to load AI insight')
      })
      .finally(() => {
        if (!cancelled) {
          setAiLoading(false)
          setAiLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [view, aiLoaded, aiLoading])

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-black p-5 text-white shadow-lg shadow-black/15">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border-[18px] border-[#00D1FF] opacity-80" />
        <div className="absolute -bottom-12 right-12 h-28 w-28 rounded-full border-[18px] border-[#FF4D8D] opacity-70" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full border-[16px] border-[#FFB703] opacity-70" />
        <div className="relative">
          <p className="text-sm font-medium text-white/70">Insight Total</p>
          <p className="mt-1 text-3xl font-bold">PKR {totalSpent.toLocaleString()}</p>
          <p className="mt-1 text-xs text-white/55">{transactions.length} transactions analyzed</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InsightCard label="This Month" value={`PKR ${thisMonthTotal.toLocaleString()}`} color="#00D1FF" />
        <InsightCard label="Average" value={`PKR ${Math.round(averageSpend).toLocaleString()}`} color="#FFB703" />
        <InsightCard label="Top Category" value={topCategory?.name || 'None'} color="#FF4D8D" />
        <InsightCard label="Top Person" value={topPerson?.name || 'None'} color="#7C3AED" />
      </div>

      <div className="w-full overflow-x-auto scrollbar-hide px-1">
        <ContinuousTabs
          tabs={views.map((v) => ({ id: v.key, label: v.label }))}
          defaultActiveId={view}
          onChange={(id) => setView(id as ViewType)}
        />
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        {view === 'category' && (
          categoryData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`PKR ${value.toLocaleString()}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-xs font-medium text-black/70">{cat.icon} {cat.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-black">
                      PKR {cat.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No data yet</p>
          )
        )}

        {view === 'person' && (
          personData.length > 0 ? (
            <div className="space-y-3">
              {personData.map((p, i) => {
                const maxVal = personData[0].value
                const pct = (p.value / maxVal) * 100
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-black/70">{p.name}</span>
                      <span className="text-xs font-semibold text-black">PKR {p.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-black/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No data yet</p>
          )
        )}

        {view === 'monthly' && (
          monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => [`PKR ${value.toLocaleString()}`, '']} />
                <Bar dataKey="total" fill="#00D1FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No data yet</p>
          )
        )}

        {view === 'yearly' && (
          yearlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => [`PKR ${value.toLocaleString()}`, '']} />
                <Bar dataKey="total" fill="#FF4D8D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No data yet</p>
          )
        )}

        {view === 'ai' && (
          <AiPanel
            recommendation={aiRecommendation}
            loading={aiLoading}
            error={aiError}
            onRetry={() => {
              setAiLoaded(false)
              setAiError(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function InsightCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div
        className="absolute -right-4 -top-4 h-14 w-14 rounded-full opacity-20"
        style={{ backgroundColor: color }}
      />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-wide text-black/40">{label}</p>
        <p className="mt-1 truncate text-sm font-black text-black">{value}</p>
      </div>
    </div>
  )
}

function AiPanel({
  recommendation,
  loading,
  error,
  onRetry,
}: {
  recommendation: AiRecommendation | null
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  if (loading) {
    return (
      <div className="space-y-4 py-2">
        <div className="h-24 animate-pulse rounded-2xl bg-black/5" />
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-xl bg-black/5" />
          <div className="h-10 animate-pulse rounded-xl bg-black/5" />
          <div className="h-10 animate-pulse rounded-xl bg-black/5" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
        <p className="text-sm font-bold text-red-700">AI insight unavailable</p>
        <p className="mt-1 text-xs text-red-500">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-black px-4 py-2 text-xs font-bold text-white"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!recommendation) {
    return <p className="py-8 text-center text-sm text-gray-400">Open this tab to generate an AI insight</p>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4"
    >
      <div className="relative overflow-hidden rounded-2xl bg-black p-4 text-white">
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#00D1FF]/70" />
        <div className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-[#FF4D8D]/60" />
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">AI Coach</p>
          <h3 className="mt-2 text-xl font-black">{recommendation.headline}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{recommendation.summary}</p>
        </div>
      </div>

      <div className="space-y-2">
        {recommendation.suggestions.map((suggestion, index) => (
          <motion.div
            key={`${suggestion}-${index}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.28 }}
            className="flex gap-3 rounded-2xl border border-black/10 bg-white p-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFB703]/20 text-xs font-black text-black">
              {index + 1}
            </span>
            <p className="text-sm font-medium leading-relaxed text-black/70">{suggestion}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
