'use client'
import { useState } from 'react'

export default function AuthForm({ mode = 'login' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const payload = { email, password, ...(mode === 'register' ? { name } : {}) }
    console.log(mode, payload)
    setMessage(mode === 'login' ? 'Logged in (mock)' : 'Registered (mock)')
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        {mode === 'register' && (
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 14, marginBottom: 6 }}>Full name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              style={{ width: '100%', padding: '8px 10px', fontSize: 14 }}
            />
          </label>
        )}

        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={{ width: '100%', padding: '8px 10px', fontSize: 14 }}
          />
        </label>

        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{ width: '100%', padding: '8px 10px', fontSize: 14 }}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: '10px 14px',
            fontSize: 15,
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 12, color: '#065f46' }}>{message}</p>
      )}
    </div>
  )
}
