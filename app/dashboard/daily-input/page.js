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
  const [analyzeDate, setAnalyzeDate] = useState(new Date().toISOString().slice(0, 10))
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [dayEntries, setDayEntries] = useState([])
  const [summaryCard, setSummaryCard] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    computeActions()
  }, [restTime, upcomingDeadline, studyTime])

  // load daily entries and compute summary on mount and when date/user changes
  useEffect(() => {
    let mounted = true
    async function loadEntries() {
      if (!user) return
      setEntriesLoading(true)
      try {
        const res = await fetch(`/api/daily-input?userId=${encodeURIComponent(user.uid)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch')

        // filter by analyzeDate
        const dayStart = new Date(analyzeDate)
        dayStart.setHours(0,0,0,0)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate()+1)

        const items = (data.items || []).filter(it => {
          const d = new Date(it.createdAt || it.timestamp || it.created_at)
          return d >= dayStart && d < dayEnd
        })

        if (!mounted) return
        setDayEntries(items)

        // compute aggregated numbers
        const totalStudy = items.reduce((s,it)=> s + (Number(it.studyTime)||0), 0)
        const totalWork = items.reduce((s,it)=> s + (Number(it.workTime)||0), 0)
        const totalRest = items.reduce((s,it)=> s + (Number(it.restTime)||0), 0)
        const hasDeadline = items.some(it => Boolean(it.upcomingDeadline))

        const pressure = computePressureLevel({ upcomingDeadline: hasDeadline, workTime: totalWork, restTime: totalRest })
        const progress = computeProgressScore({ studyTime: totalStudy, workTime: totalWork })

        setSummaryCard({
          pressure, progress, inputs: { totalStudy, totalWork, totalRest, hasDeadline }, count: items.length,
        })
      } catch (err) {
        console.error('Load entries error', err)
      } finally {
        setEntriesLoading(false)
      }
    }

    loadEntries()
    return () => { mounted = false }
  }, [user, analyzeDate])

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

  // fetch weekly insight when user signs in
  useEffect(() => {
    if (!user) {
      setWeeklyInsight(null)
      return
    }
    fetchWeeklyInsight()
  }, [user])

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
      // attach calculation details for UI expansion
      details: {
        pressure: pressure,
        progress: progress,
        inputs: { upcomingDeadline, workTime: Number(workTime), restTime: Number(restTime), studyTime: Number(studyTime) },
        pressureFormula: 'pressure = (upcomingDeadline?3:0) + min(10, workTime/30) - min(5, restTime/15)',
        progressFormula: 'progress% = min(240, studyTime+workTime)/240 * 100',
      },
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
            {weeklyInsight && weeklyInsight.count > 0 ? (
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

          {/* AI analysis controls */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <input type="date" value={analyzeDate} onChange={(e) => setAnalyzeDate(e.target.value)} className="rounded border px-3 py-2" />
              <button onClick={async () => {
                setAnalyzing(true)
                setAiResult(null)
                try {
                  const res = await fetch('/api/ai-analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: analyzeDate, userId: user?.uid || null, path: '/dashboard/daily-input' }),
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data?.error || 'Analysis failed')
                  setAiResult(data)
                } catch (err) {
                  setAiResult({ error: err.message })
                } finally {
                  setAnalyzing(false)
                }
              }} disabled={analyzing} className="px-3 py-2 bg-[#001f3f] text-white rounded cursor-pointer">{analyzing ? 'Analyzing…' : 'Analyze Day With AI'}</button>
            </div>

            {aiResult && (
              <div className="mt-3 text-sm text-gray-700">
                {aiResult.error ? (
                  <div className="text-red-600">Error: {aiResult.error}</div>
                ) : (
                  <div>
                    <button onClick={() => setAiResult((r)=> ({...r, _open: !r?._open}))} className="text-left w-full pb-2 border-b mb-2 font-bold ">Summary (click to toggle)</button>
                    {aiResult._open && (
                      <div className="text-sm text-gray-700">{aiResult.data?.summary || aiResult.summary || aiResult.data?.raw || JSON.stringify(aiResult.data)}</div>
                    )}
                    {Array.isArray(aiResult.data?.recommendedActions) && (
                      <div className="mt-2">
                        <p className="font-bold">Recommended Actions</p>
                        <ul className="list-disc pl-5 text-sm">{aiResult.data.recommendedActions.map((a,i)=>(<li key={i}>{a}</li>))}</ul>
                      </div>
                    )}
                    {Array.isArray(aiResult.data?.recommendedReading) && (
                      <div className="mt-2">
                        <p className="font-bold">Recommended Reading</p>
                        <ul className="list-disc pl-5 text-sm">{aiResult.data.recommendedReading.map((r,i)=>(<li key={i}>{r}</li>))}</ul>
                      </div>
                    )}
                    {aiResult.data?.quickTip && (
                      <div className="mt-2">
                        <p className="font-bold">Quick Tip</p>
                        <p className="text-sm">{aiResult.data.quickTip}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {actionCards.filter(c => c.id !== 'summary').map((c) => (
              <ActionCard key={c.id} icon={c.icon} title={c.title} text={c.text} priority={c.priority} borderColor={c.borderColor} iconBg={c.iconBg} details={c.details} />
            ))}
            {/* Summary card from backend */}
            {summaryCard && (
              <ActionCard
                key="backend-summary"
                icon={<CheckCircle2 className="text-blue-600" />}
                title="Summary"
                text={entriesLoading ? 'Loading summary…' : `Pressure: ${summaryCard.pressure} — Progress: ${summaryCard.progress}%`}
                priority={summaryCard.progress >= 75 ? 'Optimal' : summaryCard.progress >= 40 ? 'Moderate' : 'Needs Work'}
                borderColor={summaryCard.progress >= 75 ? 'border-l-blue-900' : 'border-l-gray-400'}
                iconBg={'bg-blue-50'}
                details={{
                  pressure: summaryCard.pressure,
                  progress: summaryCard.progress,
                  pressureFormula: 'pressure = (upcomingDeadline?3:0) + min(10, workTime/30) - min(5, restTime/15)',
                  progressFormula: 'progress% = min(240, studyTime+workTime)/240 * 100',
                  inputs: { upcomingDeadline: summaryCard.inputs.hasDeadline, studyTime: summaryCard.inputs.totalStudy, workTime: summaryCard.inputs.totalWork, restTime: summaryCard.inputs.totalRest },
                }}
              />
            )}
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

const ActionCard = ({ icon, title, text, priority, borderColor, iconBg, statusLabel = 'Priority', details }) => {
  const [open, setOpen] = React.useState(false)
  const isSummary = Boolean(details)

  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-100 border-l-4 ${borderColor} shadow-sm`}>
      <div className="flex items-start gap-5">
        <div className={`${iconBg} p-3 rounded-lg`}>{icon}</div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2 ">
            <button onClick={() => isSummary && setOpen(!open)} className="text-left w-full cursor-pointer border-1 p-2">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-800">{title}</h4>
                <span className="text-[9px] font-black uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded text-gray-500">{statusLabel}: {priority}</span>
              </div>
            </button>
          </div>

          <div className="text-sm text-gray-500 leading-relaxed">{text}</div>

          {isSummary && open && (
            <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-100 text-sm text-gray-700">
              <div className="mb-2"><strong>Pressure Calculation</strong></div>
              <div className="text-xs">Formula: {details.pressureFormula}</div>
              <div className="text-xs">Computed: {details.pressure}</div>
              <div className="mt-2 mb-2"><strong>Progress Calculation</strong></div>
              <div className="text-xs">Formula: {details.progressFormula}</div>
              <div className="text-xs">Computed: {details.progress}%</div>
              <div className="mt-2"><strong>Inputs</strong></div>
              <ul className="list-disc pl-5 text-xs">
                <li>upcomingDeadline: {String(details.inputs.upcomingDeadline)}</li>
                <li>studyTime: {details.inputs.studyTime} min</li>
                <li>workTime: {details.inputs.workTime} min</li>
                <li>restTime: {details.inputs.restTime} min</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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