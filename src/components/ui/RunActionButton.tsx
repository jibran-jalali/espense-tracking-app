import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Transition } from 'motion/react'
import { Zap } from 'lucide-react'
import { HiBadgeCheck } from 'react-icons/hi'
import { IoCloseSharp } from 'react-icons/io5'
import { FaInbox } from 'react-icons/fa6'
import { RiBubbleChartFill } from 'react-icons/ri'
import { BsFileTextFill, BsSendFill, BsTagFill } from 'react-icons/bs'
import { TbClockHour12Filled } from 'react-icons/tb'

function AnimatedText({ text, className, delayStep = 0.014 }: { text: string; className?: string; delayStep?: number }) {
  const chars = text.split('')

  return (
    <span className={className} style={{ display: 'inline-flex' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={text} style={{ display: 'inline-flex', willChange: 'transform' }}>
          {chars.map((char, i) => (
            <motion.span
              key={i}
              initial={{ y: 10, opacity: 0, scale: 0.5, filter: 'blur(2px)' }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ y: -10, opacity: 0, scale: 0.5, filter: 'blur(2px)' }}
              transition={{
                type: 'spring',
                stiffness: 240,
                damping: 16,
                mass: 1.2,
                delay: i * delayStep,
              }}
              style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : undefined }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

const spring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 22,
  mass: 0.8,
}

const OCR_STEPS = [
  { id: 1, label: 'Uploading Receipt', icon: FaInbox },
  { id: 2, label: 'Reading Text', icon: RiBubbleChartFill },
  { id: 3, label: 'Identifying Items', icon: BsTagFill },
  { id: 4, label: 'Categorizing', icon: TbClockHour12Filled },
  { id: 5, label: 'Creating Transaction', icon: BsFileTextFill },
  { id: 6, label: 'Done!', icon: BsSendFill },
]

type StepItem = { id: number; label: string; icon: React.ComponentType<any> }

interface RunActionButtonProps {
  steps?: StepItem[]
  idleLabel?: string
  doneLabel?: string
  onStart?: () => void
  onComplete?: () => void
  onCancel?: () => void
  running?: boolean
  done?: boolean
  onReset?: () => void
}

export function RunActionButton({
  steps = OCR_STEPS,
  idleLabel = 'Scan Receipt',
  doneLabel = 'Scan Complete',
  onStart,
  onComplete,
  onCancel,
  running: externalRunning,
  done: externalDone,
  onReset,
}: RunActionButtonProps) {
  const [internalStatus, setInternalStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [currentStep, setCurrentStep] = useState(0)

  const status = externalRunning !== undefined
    ? externalRunning ? 'running' : externalDone ? 'done' : 'idle'
    : internalStatus

  const startAction = () => {
    setInternalStatus('running')
    setCurrentStep(0)
    onStart?.()
  }

  const reset = () => {
    setInternalStatus('idle')
    setCurrentStep(0)
    onReset?.()
  }

  useEffect(() => {
    if (status !== 'running') return
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1
        setInternalStatus('done')
        onComplete?.()
        return prev
      })
    }, 1200)
    return () => clearInterval(interval)
  }, [status, steps.length, onComplete])

  const widths = { idle: 220, running: 320, done: 220 }

  return (
    <div className="flex w-full items-center justify-center">
      <motion.div
        initial={{ width: 220 }}
        animate={{ width: widths[status] }}
        transition={spring}
        className={`relative flex h-[58px] max-w-full items-center justify-between overflow-hidden rounded-full ${
          status === 'running'
            ? 'border-2 border-dashed border-[#D6D6DD]'
            : 'border-2 border-transparent'
        }`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {status === 'idle' && (
            <motion.button
              key="idle"
              onClick={startAction}
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              transition={spring}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#F4F4F9] px-5 py-3 whitespace-nowrap"
            >
              <Zap className="h-5 w-5 shrink-0 text-[#26262B]" />
              <AnimatedText text={idleLabel} className="text-[16px] font-semibold text-[#26262B]" />
            </motion.button>
          )}

          {status === 'running' && (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              transition={spring}
              className="flex flex-1 items-center justify-between gap-2 px-3 whitespace-nowrap"
            >
              <div className="flex items-center gap-2">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0, filter: 'blur(4px)' }}
                    transition={spring}
                  >
                    {React.createElement(steps[currentStep].icon, {
                      className: 'w-5 h-5 text-[#28272A]',
                    })}
                  </motion.div>
                </AnimatePresence>
                <AnimatedText
                  text={steps[currentStep].label}
                  className="text-[15px] font-bold text-[#28272A]"
                />
              </div>

              <motion.button
                onClick={() => { reset(); onCancel?.() }}
                initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
                transition={{ ...spring, delay: 0.15 }}
                className="ml-1 rounded-full bg-[#D6D5E2] p-1.5"
              >
                <IoCloseSharp className="h-4 w-4 text-white" />
              </motion.button>
            </motion.div>
          )}

          {status === 'done' && (
            <motion.button
              key="done"
              onClick={reset}
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              transition={spring}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#EAF9EA] px-5 py-3 whitespace-nowrap"
            >
              <HiBadgeCheck className="h-5 w-5 text-[#22c55e]" />
              <AnimatedText text={doneLabel} className="text-[16px] font-bold text-[#22c55e]" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
