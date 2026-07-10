import type { Transition } from 'motion/react'

export const smoothSpring: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 34,
  mass: 0.8,
}

export const softSpring: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 30,
  mass: 0.9,
}

export const smoothEase: Transition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1],
}
