import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Auth1 } from '../ui/auth-01'
import { HiUser } from 'react-icons/hi'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name')
      setLoading(false)
      return
    }

    const err = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, name.trim())

    if (err) setError(err)
    setLoading(false)
  }

  if (mode === 'signup') {
    return (
      <Auth1
        heading="Create your account"
        subheading="Start tracking your finances"
        submitLabel="Create Account"
        bottomPromptText="Already have an account?"
        bottomPromptLinkText="Sign in"
        onBottomPromptClick={() => { setMode('login'); setError(null) }}
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
        socialProviders={[]}
        dividerText=""
        extraFields={(
          <div className="relative">
            <HiUser className="text-muted-foreground absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              required
              className="bg-muted focus-visible:ring-primary/20 focus-visible:border-primary/50 flex h-9 w-full rounded-lg border border-input px-3 py-1 pl-10 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground"
            />
          </div>
        )}
      />
    )
  }

  return (
    <Auth1
      heading="Welcome to FinTrack"
      subheading="Track your expenses, manage finances, and gain insights."
      submitLabel="Sign In"
      bottomPromptText="Don't have an account?"
      bottomPromptLinkText="Create one"
      onBottomPromptClick={() => { setMode('signup'); setError(null) }}
      onSubmit={handleSubmit}
      error={error}
      loading={loading}
    />
  )
}
