import { useState, useEffect } from 'react'

const STORAGE_KEY = 'vpr-auth'
const PASSWORD = 'newwonder'

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'unlocked') {
      setUnlocked(true)
    }
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (value === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'unlocked')
      setUnlocked(true)
    } else {
      setError(true)
      setValue('')
    }
  }

  if (unlocked) return children

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold">
            V
          </div>
          <span className="text-xs font-medium tracking-widest uppercase text-zinc-500">
            Prototypes
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Protected</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Enter the password to view the prototype.
        </p>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          placeholder="Password"
          className={`w-full rounded-lg bg-zinc-900 border px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors ${
            error
              ? 'border-rose-500/60 focus:border-rose-500'
              : 'border-zinc-800 focus:border-zinc-600'
          }`}
        />
        {error && (
          <p className="text-xs text-rose-400 mt-2">Incorrect password.</p>
        )}
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-white text-zinc-900 px-4 py-3 text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          Continue
        </button>
      </form>
    </div>
  )
}
