"use client"
import React, { useState } from 'react'

export default function DailyInputPage() {
  const [form, setForm] = useState({ date: '', subject: '', duration: '', notes: '' })
  const [status, setStatus] = useState(null)

  function onChange(e) {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/daily-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('saved')
        setForm({ date: '', subject: '', duration: '', notes: '' })
      } else {
        console.error(data)
        setStatus('error')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Daily Input</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input name="date" value={form.date} onChange={onChange} type="date" className="mt-1 block w-full rounded border px-3 py-2" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Subject / Topic</label>
          <input name="subject" value={form.subject} onChange={onChange} type="text" className="mt-1 block w-full rounded border px-3 py-2" placeholder="e.g., Calculus - Integration" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Duration (hours)</label>
          <input name="duration" value={form.duration} onChange={onChange} type="number" step="0.25" className="mt-1 block w-full rounded border px-3 py-2" placeholder="1.5" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea name="notes" value={form.notes} onChange={onChange} className="mt-1 block w-full rounded border px-3 py-2" rows={4} />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="px-4 py-2 bg-[#2b458d] text-white rounded">Save</button>
          {status === 'loading' && <span className="text-sm text-gray-600">Saving...</span>}
          {status === 'saved' && <span className="text-sm text-green-600">Saved.</span>}
          {status === 'error' && <span className="text-sm text-red-600">Error saving.</span>}
        </div>
      </form>
    </main>
  )
}
