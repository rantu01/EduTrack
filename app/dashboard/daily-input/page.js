"use client"
import React, { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../../lib/firebase'
import { Minus, Plus, Sparkles, AlertTriangle, BatteryLow, CheckCircle2, BookOpen, Brain, Quote } from 'lucide-react'

const SmartSuggestionEngine = () => {
  const [user, setUser] = useState(null)

  // inputs / data model
  const [mood, setMood] = useState('😊')
  const [upcomingDeadline, setUpcomingDeadline] = useState(false)
  const [deadlineDate, setDeadlineDate] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [studyTime, setStudyTime] = useState(120) // minutes
  const [workTime, setWorkTime] = useState(60) // minutes
  const [restTime, setRestTime] = useState(30) // minutes
  const [timestamp, setTimestamp] = useState(new Date().toISOString())

  const [statusMsg, setStatusMsg] = useState('')
  const [weeklyInsight, setWeeklyInsight] = useState(null)
  const [actionCards, setActionCards] = useState([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    computeActions()
  }, [restTime, upcomingDeadline, studyTime])

  async function fetchWeeklyInsight() {
    if (!user) return
    try {
      const res = await fetch(`/api/daily-input?userId=${encodeURIComponent(user.uid)}&insights=weekly`)
      const data = await res.json()
      if (res.ok) setWeeklyInsight(data)
    } catch (err) {
      console.error(err)
    }
  }

  function computePressureLevel({ upcomingDeadline, workTime, restTime }) {
    // simple heuristic: deadline increases pressure, more workTime increases, more rest reduces
    let score = 0
    if (upcomingDeadline) score += 3
    score += Math.min(10, workTime / 30) // every 30min adds pressure
    score -= Math.min(5, restTime / 15) // every 15min reduces
    if (score < 0) score = 0
    return Number(score.toFixed(2))
  }

  function computeProgressScore({ studyTime, workTime }) {
    // assume ideal study+work target is 4 hours (240min)
    const completed = Math.min(240, Number(studyTime || 0) + Number(workTime || 0))
    return Number(((completed / 240) * 100).toFixed(0))
  }

  function computeActions() {
    const cards = []

    if (Number(restTime) < 30) {
      cards.push({
        id: 'warning-rest',
        icon: <BatteryLow className="text-red-600" />, 
        title: 'Take a Break — Low Rest',
        text: 'Your rest time is under 30 minutes. Short breaks help concentration and recovery.',
        priority: 'Warning',
        borderColor: 'border-l-red-500',
        iconBg: 'bg-red-50',
      })
    }

    if (upcomingDeadline && Number(studyTime) < 120) {
      cards.push({
        id: 'urgent-focus',
        icon: <AlertTriangle className="text-orange-600" />, 
        title: 'Urgent Focus',
        text: 'Deadline soon and study time is less than 2 hours — focus on priority tasks now.',
        priority: 'High',
        borderColor: 'border-l-orange-400',
        iconBg: 'bg-orange-100',
      })
    }

    const pressure = computePressureLevel({ upcomingDeadline, workTime, restTime })
    const progress = computeProgressScore({ studyTime, workTime })

    cards.push({
      id: 'summary',
      icon: <CheckCircle2 className="text-blue-600" />, 
      title: 'Summary',
      text: `Pressure: ${pressure} — Progress: ${progress}%`,
      priority: progress >= 75 ? 'Optimal' : progress >= 40 ? 'Moderate' : 'Needs Work',
      borderColor: progress >= 75 ? 'border-l-blue-900' : 'border-l-gray-400',
      iconBg: 'bg-blue-50',
    })

    setActionCards(cards)
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    setStatusMsg('')
    if (!taskTitle || taskTitle.trim() === '') {
      setStatusMsg('Task Title is required.')
      return
    }
    if (!user) {
      setStatusMsg('Please sign in to save data.')
      return
    }

    const payload = {
      userId: user.uid,
      mood,
      upcomingDeadline: upcomingDeadline ? (deadlineDate || true) : false,
      taskTitle,
      taskDescription,
      studyTime: Number(studyTime),
      workTime: Number(workTime),
      restTime: Number(restTime),
      timestamp,
    }

    try {
      const res = await fetch('/api/daily-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatusMsg(data?.error || 'Failed to save')
        return
      }
      setStatusMsg('Entry saved and advice generated.')
      // fetch latest weekly insight
      fetchWeeklyInsight()
      computeActions()
    } catch (err) {
      console.error(err)
      setStatusMsg('Network error')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8faff] p-10 font-sans text-slate-800">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#001f3f] tracking-tight">Smart Suggestion Engine</h1>
        <p className="text-sm text-gray-500 mt-1">Log tasks and get dynamic action cards based on your pressure and progress.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500">Task Title *</label>
              <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="mt-2 block w-full rounded border px-3 py-2" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500">Task Description</label>
              <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="mt-2 block w-full rounded border px-3 py-2" rows={3} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-gray-500">Study Time (min)</label>
              <label className="text-xs text-gray-500">Work Time (min)</label>
              <label className="text-xs text-gray-500">Rest Time (min)</label>
              <input type="number" value={studyTime} onChange={(e) => setStudyTime(Number(e.target.value))} className="mt-1 rounded border px-2 py-1" />
              <input type="number" value={workTime} onChange={(e) => setWorkTime(Number(e.target.value))} className="mt-1 rounded border px-2 py-1" />
              <input type="number" value={restTime} onChange={(e) => setRestTime(Number(e.target.value))} className="mt-1 rounded border px-2 py-1" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-gray-500">Upcoming Deadline?</label>
                <div className="mt-2">
                  <button type="button" onClick={() => setUpcomingDeadline(!upcomingDeadline)} className={`px-3 py-1 rounded ${upcomingDeadline ? 'bg-blue-900 text-white' : 'bg-gray-100'}`}>
                    {upcomingDeadline ? 'Yes' : 'No'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">Deadline date (optional)</label>
                <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className="mt-2 rounded border px-2 py-1" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Mood</label>
              <div className="flex gap-2 mt-2">
                {['😫','😐','😊','🤩'].map((em) => (
                  <button key={em} type="button" onClick={() => setMood(em)} className={`px-3 py-2 rounded-lg ${mood===em? 'bg-blue-50 ring-2 ring-blue-100':'bg-gray-50'}`}>{em}</button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="submit" className="flex-1 bg-[#001f3f] text-white py-2 rounded font-bold">Generate Advice <Sparkles size={14} className="ml-2" /></button>
            </div>
            {statusMsg && <div className="text-sm text-red-600">{statusMsg}</div>}
          </form>

          <div className="bg-[#1a365d] rounded-2xl p-6 text-white">
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2">Weekly Insight</p>
            {weeklyInsight ? (
              <div>
                <div>Entries: {weeklyInsight.count}</div>
                <div>Avg Study: {weeklyInsight.avgStudyTime} min</div>
                <div>Avg Work: {weeklyInsight.avgWorkTime} min</div>
                <div>Avg Rest: {weeklyInsight.avgRestTime} min</div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed opacity-90 font-medium">No weekly data yet. Submit entries to see insights.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[11px] uppercase tracking-widest text-gray-400">Recommended Actions</h3>
            <div className="text-[10px] italic text-gray-500">Live Analysis Active</div>
          </div>

          <div className="space-y-4">
            {actionCards.map((c) => (
              <ActionCard key={c.id} icon={c.icon} title={c.title} text={c.text} priority={c.priority} borderColor={c.borderColor} iconBg={c.iconBg} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
              <h3 className="font-bold text-[11px] uppercase tracking-widest text-gray-400">Recommended Reading</h3>
              <ReadingItem icon={<BookOpen size={18} />} title="Time Management 101" sub="Techniques for busy scholars" bg="bg-orange-100 text-orange-700" />
              <ReadingItem icon={<Brain size={18} />} title="Burnout Prevention" sub="Academic wellness guide" bg="bg-blue-100 text-blue-700" />
            </div>

            <div className="bg-[#001f3f] rounded-2xl p-6 text-white relative flex flex-col justify-center">
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-4">Quick Tip</p>
              <h4 className="text-lg font-medium italic leading-relaxed mb-4">"The secret of getting ahead is getting started."</h4>
              <p className="text-xs opacity-50">— Mark Twain</p>
              <Quote className="absolute right-6 top-6 opacity-5" size={60} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ActionCard = ({ icon, title, text, priority, borderColor, iconBg, statusLabel = 'Priority' }) => (
  <div className={`bg-white rounded-xl p-6 border border-gray-100 border-l-4 ${borderColor} shadow-sm flex items-start gap-5`}>
    <div className={`${iconBg} p-3 rounded-lg`}>{icon}</div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-slate-800">{title}</h4>
        <span className="text-[9px] font-black uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded text-gray-500">{statusLabel}: {priority}</span>
      </div>
      <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
    </div>
  </div>
)

const ReadingItem = ({ icon, title, sub, bg }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
    <div className={`${bg} p-3 rounded-lg`}>{icon}</div>
    <div>
      <h5 className="text-xs font-bold text-slate-800">{title}</h5>
      <p className="text-[10px] text-gray-400">{sub}</p>
    </div>
  </div>
)

export default SmartSuggestionEngine