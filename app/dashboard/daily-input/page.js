"use client"
import React, { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../../lib/firebase'
import { Minus, Plus, Sparkles, AlertTriangle, BatteryLow, CheckCircle2, BookOpen, Brain, Quote, Smartphone, Gamepad, FileText, X } from 'lucide-react'
import Swal from 'sweetalert2'

const segmentTimes = [
  { label: 'Early Morning', start: '06:00', end: '10:00' },
  { label: 'Morning', start: '10:00', end: '14:00' },
  { label: 'Afternoon', start: '14:00', end: '17:00' },
  { label: 'Evening', start: '17:00', end: '21:00' },
  { label: 'Night', start: '21:00', end: '06:00' },
]

const activityOptions = [
  { value: 'study', label: 'Study', icon: '📚', bucket: 'study' },
  { value: 'work', label: 'Work', icon: '💼', bucket: 'work' },
  { value: 'rest', label: 'Rest', icon: '😴', bucket: 'rest' },
  { value: 'mobile', label: 'Mobile', icon: '📱', bucket: 'mobile' },
  { value: 'game', label: 'Game', icon: '🎮', bucket: 'game' },
  { value: 'assignment', label: 'Assignment', icon: '📝', bucket: 'study' },
  { value: 'reading', label: 'Reading', icon: '📖', bucket: 'study' },
  { value: 'other', label: 'Other', icon: '✏️', bucket: 'other' },
]

const activityLabelMap = activityOptions.reduce((acc, option) => {
  acc[option.value] = `${option.icon} ${option.label}`
  return acc
}, {})

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function getDurationMinutes(startTime, endTime) {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  return endMinutes > startMinutes ? endMinutes - startMinutes : endMinutes + 1440 - startMinutes
}

function createSegments() {
  return segmentTimes.map((segment, index) => ({
    id: `seg-${index}`,
    label: segment.label,
    startTime: segment.start,
    endTime: segment.end,
    durationMinutes: getDurationMinutes(segment.start, segment.end),
    activity: '',
    note: '',
    distractionMinutes: '',
    distractionReason: '',
  }))
}

const SmartSuggestionEngine = () => {
  const [user, setUser] = useState(null)

  // inputs / data model
  const [mood, setMood] = useState('😊')
  const [deadlines, setDeadlines] = useState([])
  const [unaccountedTime, setUnaccountedTime] = useState(0)
  const [unaccountedActivity, setUnaccountedActivity] = useState('')

  const [segments, setSegments] = useState(() => createSegments())
  const [timestamp, setTimestamp] = useState(new Date().toISOString())

  const [statusMsg, setStatusMsg] = useState('')
  const [weeklyInsight, setWeeklyInsight] = useState(null)
  const [actionCards, setActionCards] = useState([])
  const [analyzeDate, setAnalyzeDate] = useState(new Date().toISOString().slice(0, 10))
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [dayEntries, setDayEntries] = useState([])
  const [todaysEntry, setTodaysEntry] = useState(null)
  const [summaryCard, setSummaryCard] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })
    return () => unsub()
  }, [])

  // calculate aggregated times from segments
  function calculateTotalTimes() {
    const study = segments.reduce((sum, segment) => sum + (segment.activity && ['study', 'assignment', 'reading'].includes(segment.activity) ? Number(segment.durationMinutes) || 0 : 0), 0)
    const work = segments.reduce((sum, segment) => sum + (segment.activity === 'work' ? Number(segment.durationMinutes) || 0 : 0), 0)
    const rest = segments.reduce((sum, segment) => sum + (segment.activity === 'rest' ? Number(segment.durationMinutes) || 0 : 0), 0)
    const mobile = segments.reduce((sum, segment) => sum + (segment.activity === 'mobile' ? Number(segment.durationMinutes) || 0 : 0), 0)
    const game = segments.reduce((sum, segment) => sum + (segment.activity === 'game' ? Number(segment.durationMinutes) || 0 : 0), 0)
    const total = study + work + rest + mobile + game
    const unaccounted = Math.max(0, 1440 - total) // 1440 minutes in 24 hours
    return { study, work, rest, mobile, game, total, unaccounted }
  }

  function addDeadline() {
    setDeadlines([...deadlines, { id: Date.now(), title: '', type: 'assignment', date: '' }])
  }

  function updateDeadline(id, changes) {
    setDeadlines(deadlines.map(d => d.id === id ? { ...d, ...changes } : d))
  }

  function removeDeadline(id) {
    setDeadlines(deadlines.filter(d => d.id !== id))
  }

  useEffect(() => {
    computeActions()
  }, [segments, deadlines])

  function updateSegment(index, changes) {
    setSegments((s) => {
      const copy = [...s]
      copy[index] = { ...copy[index], ...changes }
      return copy
    })
  }

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
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)

        const items = (data.items || []).filter(it => {
          const d = new Date(it.createdAt || it.timestamp || it.created_at)
          return d >= dayStart && d < dayEnd
        })

        if (!mounted) return
        setDayEntries(items)
        setTodaysEntry(items && items.length > 0 ? items[0] : null)

        // compute aggregated numbers
        const totalStudy = items.reduce((s, it) => s + (Number(it.studyTime) || 0), 0)
        const totalWork = items.reduce((s, it) => s + (Number(it.workTime) || 0), 0)
        const totalRest = items.reduce((s, it) => s + (Number(it.restTime) || 0), 0)
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
    if (upcomingDeadline || deadlines.length > 0) score += 3 * Math.max(1, deadlines.length)
    score += Math.min(10, workTime / 30) // every 30min adds pressure
    score -= Math.min(5, restTime / 15) // every 15min reduces
    if (score < 0) score = 0
    return Number(score.toFixed(2))
  }

  function computeProgressScore({ studyTime, workTime }) {
    // assume ideal 24h target is 1440 minutes (can log up to 24h)
    const completed = Math.min(1440, Number(studyTime || 0) + Number(workTime || 0))
    return Number(((completed / 1440) * 100).toFixed(0))
  }

  function computeActions() {
    const times = calculateTotalTimes()
    const cards = []

    if (Number(times.rest) < 30 && times.rest > 0) {
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

    if (deadlines.length > 0 && Number(times.study) < 120) {
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

    const pressure = computePressureLevel({ upcomingDeadline: deadlines.length > 0, workTime: times.work, restTime: times.rest })
    const progress = computeProgressScore({ studyTime: times.study, workTime: times.work })

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
        inputs: { upcomingDeadline: deadlines.length > 0, workTime: Number(times.work), restTime: Number(times.rest), studyTime: Number(times.study) },
        pressureFormula: 'pressure = (upcomingDeadline?3:0) + min(10, workTime/30) - min(5, restTime/15)',
        progressFormula: 'progress% = min(240, studyTime+workTime)/240 * 100',
      },
    })

    setActionCards(cards)
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    setStatusMsg('')
    if (!user) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please sign in to save data.' })
      return
    }

    if (segments.some((segment) => !segment.activity)) {
      Swal.fire({
        icon: 'warning',
        title: 'Complete all segments',
        text: 'Please choose what you did in each time block before saving.',
      })
      return
    }

    const times = calculateTotalTimes()
    if (times.total === 0) {
      Swal.fire({ icon: 'warning', title: 'No Data', text: 'Please choose activities for the time blocks.' })
      return
    }

    const segmentSummary = segments.map((segment) => `${segment.label}: ${activityLabelMap[segment.activity] || segment.activity}${segment.note ? ` - ${segment.note}` : ''}`).join(' | ')
    const distractionSummary = segments
      .map((segment) => {
        const minutes = Number(segment.distractionMinutes || 0)
        if (!minutes) return null
        return `${segment.label}: ${minutes} min${segment.distractionReason ? ` (${segment.distractionReason})` : ''}`
      })
      .filter(Boolean)
      .join(' | ')
    // if there's already an entry today, ask user whether to replace
    if (todaysEntry) {
      const confirm = await Swal.fire({
        title: 'Replace today\'s entry?',
        text: 'You already submitted an entry for this date. Do you want to replace it?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Replace',
        cancelButtonText: 'Keep existing',
      })
      if (!confirm.isConfirmed) return
    }

    const payload = {
      userId: user.uid,
      mood,
      taskTitle: 'Daily Log',
      taskDescription: segmentSummary,
      studyTime: times.study,
      workTime: times.work,
      restTime: times.rest,
      upcomingDeadline: deadlines.length > 0 ? deadlines : false,
      deadlines: deadlines,
      segments,
      unaccountedTime: times.unaccounted,
      unaccountedActivity: unaccountedActivity,
      timestamp,
      distractionSummary,
      distractionTime: segments.reduce((sum, segment) => sum + (Number(segment.distractionMinutes) || 0), 0),
      existingId: todaysEntry ? (todaysEntry._id && todaysEntry._id.$oid ? todaysEntry._id.$oid : todaysEntry._id) : undefined,
    }

    try {
      const res = await fetch('/api/daily-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        Swal.fire({ icon: 'error', title: 'Error', text: data?.error || 'Failed to save' })
        return
      }
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Your daily entry has been saved and analyzed.',
        timer: 2000,
        timerProgressBar: true,
      })
      // fetch latest weekly insight
      fetchWeeklyInsight()
      computeActions()
      // reset segments and form
      setSegments(createSegments())
      setDeadlines([])
      setUnaccountedActivity('')
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: 'Error', text: 'Network error' })
    }
  }

  // modal for reading details
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState({ title: '', body: '' })

  function generateReadingContent(title) {
    // dynamic content based on collected data
    const inputs = summaryCard?.inputs || { totalStudy: 0, totalWork: 0, totalRest: 0 }
    const pressure = summaryCard?.pressure || 0
    if (title.includes('Time Management')) {
      const recommendedStudy = Math.max(60, Math.round((inputs.totalStudy || 120) * 0.9))
      const recommendedWork = Math.max(30, Math.round((inputs.totalWork || 60) * 0.8))
      const recommendedRest = Math.max(30, Math.round((inputs.totalRest || 30) * 1.2))
      return `Based on your entries: study ≈ ${inputs.totalStudy} min, work ≈ ${inputs.totalWork} min, rest ≈ ${inputs.totalRest} min. Recommended: study ${recommendedStudy} min, work ${recommendedWork} min, rest ${recommendedRest} min. Try Pomodoro sessions (25/5) and batch similar tasks.`
    }
    if (title.includes('Burnout')) {
      return pressure > 6 ? `Your pressure score is ${pressure}. You show high pressure — prioritize rest, reduce mobile/game time, and seek shorter focused sessions.` : `Your pressure is ${pressure}. Maintain balance: regular breaks, sleep, and avoid long continuous sessions.`
    }
    return 'Helpful study guidance will appear here based on your submitted entries.'
  }

  function handleReadingClick(title) {
    const body = generateReadingContent(title)
    setModalContent({ title, body })
    setModalOpen(true)
  }

  function generateQuickTip() {
    if (aiResult?.data?.quickTip) return aiResult.data.quickTip
    if (summaryCard) {
      if (summaryCard.progress < 40) return 'Start with the most important 20% of tasks — set a 25-minute timer and begin.'
      if (summaryCard.progress < 75) return 'Good progress — continue with focused blocks and short rests.'
      return 'Great job — maintain routine and gradually increase challenge.'
    }
    return 'Submit at least one entry to get tailored quick tips.'
  }

  return (
    <div className="min-h-screen bg-[#f8faff] p-4 md:p-10 font-sans text-slate-800 pb-24 md:pb-0">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#001f3f] tracking-tight">Smart Suggestion Engine</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Log tasks and get dynamic action cards based on your pressure and progress.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
        <div className="lg:col-span-6 space-y-6">


          {/* Day segments: split 24h into 5 parts and collect per-segment activity */}
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm mt-4">
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 mb-1">Day Segments (5 parts) - Record what you did each segment</p>
              <p className="text-xs text-gray-400">Each block already has a time range. Select the activity and add a short note if you want more detail.</p>
            </div>
            <div className="space-y-3 md:space-y-4">
              {segments.map((seg, idx) => {
                return (
                  <div key={seg.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 md:p-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{seg.label}</h4>
                        <p className="text-xs text-blue-600 font-semibold">🕐 {seg.startTime} - {seg.endTime} · {seg.durationMinutes} mins</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 font-semibold mb-1">What did you do?</label>
                        <select
                          value={seg.activity}
                          onChange={(e) => updateSegment(idx, { activity: e.target.value })}
                          className="rounded border border-blue-200 px-2 md:px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        >
                          <option value="">Select activity</option>
                          {activityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 font-semibold mb-1">Note</label>
                        <input
                          type="text"
                          value={seg.note}
                          onChange={(e) => updateSegment(idx, { note: e.target.value })}
                          className="rounded border border-blue-200 px-2 md:px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="e.g., algebra"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 font-semibold mb-1">Distraction (mins)</label>
                        <input
                          type="number"
                          min="0"
                          value={seg.distractionMinutes}
                          onChange={(e) => updateSegment(idx, { distractionMinutes: e.target.value })}
                          className="rounded border border-blue-200 px-2 md:px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="e.g., 5"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 font-semibold mb-1">Why</label>
                        <input
                          type="text"
                          value={seg.distractionReason}
                          onChange={(e) => updateSegment(idx, { distractionReason: e.target.value })}
                          className="rounded border border-blue-200 px-2 md:px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder="e.g., mobile"
                        />
                      </div>
                    </div>
                    {seg.activity && (
                      <p className="mt-2 md:mt-3 text-xs text-blue-700 font-semibold">Selected: {activityLabelMap[seg.activity] || seg.activity}</p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Unaccounted time section */}
            {calculateTotalTimes().unaccounted > 0 && (
              <div className="mt-4 md:mt-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-3 md:p-4">
                <h4 className="font-bold text-amber-900 mb-2 text-sm">⏰ Unaccounted Time: {calculateTotalTimes().unaccounted} minutes</h4>
                <p className="text-xs md:text-sm text-amber-800 mb-3">What did you do with this time?</p>
                <textarea value={unaccountedActivity} onChange={(e) => setUnaccountedActivity(e.target.value)} className="w-full rounded border border-amber-300 px-2 md:px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g., 180 mins sleep, 60 mins eating..." rows={2} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            {/* Deadlines section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500">Deadlines & Tasks</label>
                <button type="button" onClick={addDeadline} className="text-xs bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-800">+ Add</button>
              </div>
              <div className="space-y-2">
                {deadlines.map((dl) => (
                  <div key={dl.id} className="grid grid-cols-12 gap-1 md:gap-2 items-center bg-gray-50 p-2 rounded text-xs md:text-sm">
                    <input type="text" placeholder="e.g., Math" value={dl.title} onChange={(e) => updateDeadline(dl.id, { title: e.target.value })} className="col-span-4 md:col-span-4 rounded border px-2 py-1 text-xs" />
                    <select value={dl.type} onChange={(e) => updateDeadline(dl.id, { type: e.target.value })} className="col-span-4 md:col-span-3 rounded border px-1 md:px-2 py-1 text-xs">
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                      <option value="work">Work</option>
                      <option value="project">Project</option>
                      <option value="other">Other</option>
                    </select>
                    <input type="date" value={dl.date} onChange={(e) => updateDeadline(dl.id, { date: e.target.value })} className="col-span-3 md:col-span-4 rounded border px-1 md:px-2 py-1 text-xs" />
                    <button type="button" onClick={() => removeDeadline(dl.id)} className="col-span-1 text-red-600 hover:text-red-800"><X size={16} /></button>
                  </div>
                ))}
                {deadlines.length === 0 && <div className="text-xs text-gray-400 italic">No deadlines added. Click + Add to track tasks.</div>}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Mood</label>
              <div className="flex gap-2 mt-2">
                {['😫', '😐', '😊', '🤩'].map((em) => (
                  <button key={em} type="button" onClick={() => setMood(em)} className={`px-2 md:px-3 py-2 rounded-lg text-lg md:text-2xl ${mood === em ? 'bg-blue-50 ring-2 ring-blue-100' : 'bg-gray-50'}`}>{em}</button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white py-2 md:py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm md:text-base">
                <Sparkles size={16} />
                Save & Analyze
              </button>
            </div>
            {calculateTotalTimes().study + calculateTotalTimes().work + calculateTotalTimes().rest + calculateTotalTimes().mobile + calculateTotalTimes().game > 0 && (
              <div className="text-xs text-gray-700 bg-blue-50 p-3 rounded-lg">
                <div className="font-semibold mb-2">📊 Daily Breakdown:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>📚 Study: {calculateTotalTimes().study}m</div>
                  <div>💼 Work: {calculateTotalTimes().work}m</div>
                  <div>😴 Rest: {calculateTotalTimes().rest}m</div>
                  <div>📱 Mobile: {calculateTotalTimes().mobile}m</div>
                  <div>🎮 Game: {calculateTotalTimes().game}m</div>
                  {calculateTotalTimes().unaccounted > 0 && <div>⏰ Unaccounted: {calculateTotalTimes().unaccounted}m</div>}
                </div>
              </div>
            )}
          </form>

          <div className="bg-[#1a365d] rounded-2xl p-6 text-white">
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2">Weekly Insight</p>
            {weeklyInsight && weeklyInsight.count > 0 ? (
              <div className="space-y-1 text-sm">
                <div>📊 Entries: {weeklyInsight.count}</div>
                <div>📚 Avg Study: {weeklyInsight.avgStudyTime} min</div>
                <div>💼 Avg Work: {weeklyInsight.avgWorkTime} min</div>
                <div>😴 Avg Rest: {weeklyInsight.avgRestTime} min</div>
                {weeklyInsight.avgMobileTime > 0 && <div>📱 Avg Mobile: {weeklyInsight.avgMobileTime} min</div>}
                {weeklyInsight.avgGameTime > 0 && <div>🎮 Avg Game: {weeklyInsight.avgGameTime} min</div>}
                {weeklyInsight.avgDistractions > 0 && <div>⚠️ Avg Distractions: {weeklyInsight.avgDistractions}</div>}
              </div>
            ) : (
              <div className="text-sm leading-relaxed opacity-90 font-medium">No weekly data yet. Submit entries to see insights.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
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

            {!analyzeDate && <div className="text-sm text-red-600 mt-2">Select a date to analyze</div>}
            {analyzeDate && dayEntries.length === 0 && <div className="text-sm text-gray-500 mt-2">No entries for selected date. Submit entries to analyze.</div>}

            {aiResult && (
              <div className="mt-3 text-sm text-gray-700">
                {aiResult.error ? (
                  <div className="text-red-600">Error: {aiResult.error}</div>
                ) : (
                  <div>
                    <button onClick={() => setAiResult((r) => ({ ...r, _open: !r?._open }))} className="text-left w-full pb-2 border-b mb-2 font-bold ">Summary (click to toggle)</button>
                    {aiResult._open && (
                      <div className="text-sm text-gray-700">{aiResult.data?.summary || aiResult.summary || aiResult.data?.raw || JSON.stringify(aiResult.data)}</div>
                    )}
                    {Array.isArray(aiResult.data?.recommendedActions) && (
                      <div className="mt-2">
                        <p className="font-bold">Recommended Actions</p>
                        <ul className="list-disc pl-5 text-sm">{aiResult.data.recommendedActions.map((a, i) => (<li key={i}>{a}</li>))}</ul>
                      </div>
                    )}
                    {Array.isArray(aiResult.data?.recommendedReading) && (
                      <div className="mt-2">
                        <p className="font-bold">Recommended Reading</p>
                        <ul className="list-disc pl-5 text-sm">{aiResult.data.recommendedReading.map((r, i) => (<li key={i}>{r}</li>))}</ul>
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
              <div onClick={() => handleReadingClick('Time Management 101')}>
                <ReadingItem icon={<BookOpen size={18} />} title="Time Management 101" sub="Techniques for busy scholars" bg="bg-orange-100 text-orange-700" />
              </div>
              <div onClick={() => handleReadingClick('Burnout Prevention')}>
                <ReadingItem icon={<Brain size={18} />} title="Burnout Prevention" sub="Academic wellness guide" bg="bg-blue-100 text-blue-700" />
              </div>
            </div>

            <div className="bg-[#001f3f] rounded-2xl p-6 text-white relative flex flex-col justify-center">
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-4">Quick Tip</p>
              <h4 className="text-lg font-medium italic leading-relaxed mb-4">{generateQuickTip()}</h4>
              <p className="text-xs opacity-50">{aiResult?.data?.quickTipSource || (summaryCard ? `Progress ${summaryCard.progress}%` : '')}</p>
              <Quote className="absolute right-6 top-6 opacity-5" size={60} />
            </div>
          </div>
        </div>
      </div>
      {/* modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">{modalContent.title}</h3>
              <button onClick={() => setModalOpen(false)} className="text-sm text-gray-500">Close</button>
            </div>
            <div className="text-sm text-gray-700">{modalContent.body}</div>
          </div>
        </div>
      )}
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