import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FaBell } from 'react-icons/fa6'
import { smoothSpring } from '../../lib/motion'

interface MorphingButtonProps {
  buttonText?: string
  placeholder?: string
  inputType?: React.HTMLInputTypeAttribute
  onSubmit?: (value: string) => void | Promise<void>
  className?: string
  wrapperClassName?: string
  icon?: React.ReactNode
  variant?: 'primary' | 'soft'
  size?: 'default' | 'compact' | 'mini'
}

export const MorphingButton: React.FC<MorphingButtonProps> = ({
  buttonText = 'Notify Me',
  placeholder = 'Email',
  inputType = 'email',
  onSubmit,
  className = '',
  wrapperClassName = 'theme-injected flex w-full flex-col items-center justify-center gap-12 p-8 transition-colors duration-500',
  icon,
  variant = 'primary',
  size = 'default',
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [value, setValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isExpanded && inputRef.current) inputRef.current.focus()
  }, [isExpanded])

  const handleToggle = (e: React.MouseEvent) => {
    if (!isExpanded) {
      e.stopPropagation()
      setIsExpanded(true)
    } else if (value.trim()) {
      onSubmit?.(value.trim())
      setIsExpanded(false)
      setValue('')
    }
  }

  const springConfig = smoothSpring

  const isSoft = variant === 'soft'
  const radiusClass = isSoft ? 'rounded-full' : 'rounded-lg'
  const containerClass = isSoft
    ? 'border-transparent bg-[#F4F4F4]'
    : 'border-border/60 bg-card'
  const expandedWidthClass = size === 'mini' ? 'w-[230px]' : size === 'compact' ? 'w-[240px]' : 'w-[21rem]'
  const inputTextClass = size === 'mini' ? 'text-sm' : size === 'compact' ? 'text-base' : 'text-xl'
  const buttonTextClass = size === 'mini' ? 'text-sm' : size === 'compact' ? 'text-base' : 'text-xl'
  const softCollapsedSpacing = size === 'mini' ? 'px-3 py-2' : 'px-5 py-3'
  const softExpandedSpacing = size === 'mini' ? 'px-3 py-2' : 'px-4 py-2.5'
  const primaryCollapsedSpacing = size === 'mini' ? 'px-4 py-2.5' : 'px-6 py-4'
  const primaryExpandedSpacing = size === 'mini' ? 'px-4 py-2.5' : 'px-5 py-3'
  const collapsedButtonClass = isSoft
    ? `bg-[#F4F4F4] ${softCollapsedSpacing} text-black hover:bg-[#ececec]`
    : `bg-primary text-primary-foreground hover:bg-primary/90 ${primaryCollapsedSpacing}`
  const expandedButtonClass = isSoft
    ? `bg-white ${softExpandedSpacing} text-black shadow-sm hover:bg-[#fafafa]`
    : `bg-primary text-primary-foreground hover:bg-primary/90 ${primaryExpandedSpacing} shadow-sm`
  const fallbackIconClass = size === 'mini' ? 'h-4 w-4' : isSoft ? 'h-5 w-5' : 'h-6 w-6'

  return (
    <div className={wrapperClassName}>
      <div className={`flex items-center justify-center will-change-transform ${className}`}>
        <motion.div
          ref={containerRef}
          layout
          transition={springConfig}
          className={`relative flex items-center overflow-hidden border-[1.1px] transition-colors duration-300 ${radiusClass} ${containerClass} ${
            isExpanded ? `${expandedWidthClass} p-1 shadow-sm` : 'w-auto p-0'
          }`}
        >
          <AnimatePresence mode="popLayout">
            {isExpanded && (
              <motion.div
                key="input-container"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ ...springConfig }}
                className="flex flex-1 items-center px-4"
              >
                <motion.input
                  ref={inputRef}
                  layout
                  type={inputType}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  className={`text-card-foreground placeholder:text-muted-foreground w-full bg-transparent font-semibold transition-colors outline-none ${inputTextClass}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && value.trim()) {
                      onSubmit?.(value.trim())
                      setIsExpanded(false)
                      setValue('')
                    }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            layout
            onClick={handleToggle}
            transition={springConfig}
            className={`relative flex items-center justify-center gap-3 font-bold whitespace-nowrap transition-colors duration-300 ${radiusClass} ${
              isExpanded ? expandedButtonClass : collapsedButtonClass
            }`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {!isExpanded && (
                <motion.span
                  key="bell-icon"
                  layout
                  className="origin-right"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={springConfig}
                >
                  {icon || <FaBell className={`${fallbackIconClass} ${isSoft ? 'text-black' : 'text-primary-foreground'}`} />}
                </motion.span>
              )}
            </AnimatePresence>

            <motion.span layout="position" className={`${buttonTextClass} tracking-tight`}>
              {buttonText}
            </motion.span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
