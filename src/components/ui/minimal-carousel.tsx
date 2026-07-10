import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MoreHorizontal, Copy } from 'lucide-react'
import { smoothSpring, smoothEase } from '../../lib/motion'

export interface CarouselCard {
  id: string
  title: string
  value: string
  color: string
  icon: React.ElementType
}

interface MinimalCarouselProps {
  cards: CarouselCard[]
  onCopyClick?: (card: CarouselCard) => void
  onCustomizeClick?: (card: CarouselCard) => void
}

export const MinimalCarousel: React.FC<MinimalCarouselProps> = ({
  cards,
  onCopyClick,
  onCustomizeClick,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeCard = cards.find((c) => c.id === activeId)
  const secondaryCards = cards.filter((c) => c.id !== activeId)

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setActiveId(null)
  }

  return (
    <div className="theme-injected flex min-h-full w-full items-center justify-center bg-transparent">
      <div
        className="flex w-full select-none flex-col items-center justify-center px-0 font-sans"
        onClick={handleBackgroundClick}
      >
        <div className="w-full max-w-[26.25rem]">
          <motion.div layout transition={smoothSpring} className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {activeCard && (
                <motion.div
                  key={activeCard.id}
                  layoutId={activeCard.id}
                  className={`relative flex w-full min-h-[10.625rem] transform-gpu flex-col justify-between rounded-[28px] p-4 text-white shadow-2xl will-change-transform sm:h-48 sm:rounded-[32px] sm:p-5 ${activeCard.color}`}
                  transition={smoothSpring}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11">
                      <activeCard.icon size={38} className="sm:h-11 sm:w-11" />
                    </div>

                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={smoothEase}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCopyClick?.(activeCard)
                      }}
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-md transition-colors hover:bg-white/20 sm:px-4 sm:py-2 sm:text-base"
                    >
                      Copy <span className="hidden sm:inline">Value</span> <Copy size={16} />
                    </motion.button>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div className="mr-2 overflow-hidden">
                      <h3 className="truncate text-xl font-semibold leading-tight opacity-90 sm:text-2xl">
                        {activeCard.title}
                      </h3>
                      <p className="truncate text-lg font-semibold tracking-tight opacity-60 sm:text-xl">
                        {activeCard.value}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCustomizeClick?.(activeCard)
                      }}
                      className="shrink-0 rounded-full bg-white/30 px-3 py-1 text-sm font-bold backdrop-blur-md transition-colors hover:bg-white/40 sm:px-4 sm:py-1.5 sm:text-base"
                    >
                      View
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              transition={smoothSpring}
              className={`grid gap-2 transition-all duration-500 sm:gap-3 ${activeId ? 'grid-cols-3' : 'grid-cols-2'}`}
            >
              {(activeId ? secondaryCards : cards).map((card) => (
                <motion.div
                  key={card.id}
                  layoutId={card.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveId(card.id)
                  }}
                  transition={smoothSpring}
                  className={`relative flex transform-gpu cursor-pointer flex-col justify-between rounded-[22px] p-3 text-white shadow-lg will-change-transform sm:rounded-[28px] sm:p-4 ${card.color} ${activeId ? 'h-24 sm:h-28' : 'h-28 sm:h-32'}`}
                >
                  <div className="flex items-start justify-between">
                    <card.icon size={activeId ? 20 : 28} className="shrink-0" />
                    <div className="rounded-full bg-white/10 p-1 transition-colors sm:p-1.5">
                      <MoreHorizontal size={16} />
                    </div>
                  </div>

                  <div className="mt-1 overflow-hidden">
                    <h4 className={`${activeId ? 'text-[10px] sm:text-xs' : 'text-sm sm:text-base'} truncate font-medium leading-tight opacity-90`}>
                      {card.title}
                    </h4>
                    <p className={`${activeId ? 'text-[10px] sm:text-xs' : 'text-sm sm:text-base'} truncate font-semibold text-white/60`}>
                      {card.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
