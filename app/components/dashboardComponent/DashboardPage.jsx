"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link'
import { Minus, Plus, Lightbulb, ShieldCheck, ArrowRight, Smile, Frown, Meh } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../../lib/firebase'

const Dashboard = () => {
  const [studyHours, setStudyHours] = useState(8);
  const [analyzeDate, setAnalyzeDate] = useState(new Date().toISOString().slice(0, 10));
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [user, setUser] = useState(null)
  const [weeklyInsight, setWeeklyInsight] = useState(null)
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [summaryCard, setSummaryCard] = useState(null)
  const [allEntries, setAllEntries] = useState([])
  const [stats, setStats] = useState({ cgpa: 0, attendance: 0, pendingAssignments: 0, upcomingDeadline: null, daysWithEntries: 0 })

  async function handleAnalyze() {
    setAnalyzing(true)
    setAiResult(null)
    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: analyzeDate, path: '/dashboard' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Analysis failed')
      setAiResult(data)
    } catch (err) {
      setAiResult({ error: err.message })
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user) {
      setWeeklyInsight(null)
      setSummaryCard(null)
      return
    }

    async function fetchWeekly() {
      try {
        const res = await fetch(`/api/daily-input?userId=${encodeURIComponent(user.uid)}&insights=weekly`)
        const data = await res.json()
        if (res.ok) setWeeklyInsight(data)
      } catch (err) {
        console.error('weekly insight fetch', err)
      }
    }

    async function loadEntriesForDate() {
      setEntriesLoading(true)
      try {
        const res = await fetch(`/api/daily-input?userId=${encodeURIComponent(user.uid)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch')

        const dayStart = new Date(analyzeDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)

        const items = (data.items || []).filter(it => {
          const d = new Date(it.createdAt || it.timestamp || it.created_at)
          return d >= dayStart && d < dayEnd
        })

        const totalStudy = items.reduce((s, it) => s + (Number(it.studyTime) || 0), 0)
        const totalWork = items.reduce((s, it) => s + (Number(it.workTime) || 0), 0)
        const totalRest = items.reduce((s, it) => s + (Number(it.restTime) || 0), 0)
        const hasDeadline = items.some(it => Boolean(it.upcomingDeadline))

        const pressure = computePressureLevel({ upcomingDeadline: hasDeadline, workTime: totalWork, restTime: totalRest })
        const progress = computeProgressScore({ studyTime: totalStudy, workTime: totalWork })

        setSummaryCard({ pressure, progress, inputs: { totalStudy, totalWork, totalRest, hasDeadline }, count: items.length })
      } catch (err) {
        console.error('Load entries error', err)
      } finally {
        setEntriesLoading(false)
      }
    }

    async function loadAllEntries() {
      try {
        const res = await fetch(`/api/daily-input?userId=${encodeURIComponent(user.uid)}`)
        const data = await res.json()
        if (res.ok) {
          const items = data.items || []
          setAllEntries(items)
          computeStats(items)
        }
      } catch (err) {
        console.error('Load all entries error', err)
      }
    }

    fetchWeekly()
    loadEntriesForDate()
    loadAllEntries()
  }, [user, analyzeDate])

  function computePressureLevel({ upcomingDeadline, workTime, restTime }) {
    let score = 0
    if (upcomingDeadline) score += 3
    score += Math.min(10, workTime / 30)
    score -= Math.min(5, restTime / 15)
    if (score < 0) score = 0
    return Number(score.toFixed(2))
  }

  function computeProgressScore({ studyTime, workTime }) {
    const completed = Math.min(240, Number(studyTime || 0) + Number(workTime || 0))
    return Number(((completed / 240) * 100).toFixed(0))
  }

  function formatTimeRemaining(deadlineDate) {
    const now = new Date()
    const diff = deadlineDate - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours} hrs`
    return 'Soon'
  }

  function formatMinutesToHMS(minutes) {
    if (minutes == null || isNaN(minutes)) return '—'
    const totalSeconds = Math.round(Number(minutes) * 60)
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    const pad = (n) => String(n).padStart(2, '0')
    return `${hrs}h ${pad(mins)}m ${pad(secs)}s`
  }

  function computeStats(items) {
    // Attendance: count unique days in past 7 days
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const uniqueDays = new Set()
    items.forEach(it => {
      const d = new Date(it.createdAt || it.timestamp)
      if (d >= sevenDaysAgo && d <= now) {
        uniqueDays.add(d.toISOString().split('T')[0])
      }
    })
    const attendance = Math.round((uniqueDays.size / 7) * 100)

    // CGPA: average progress from last 7 days entries
    const recentItems = items.filter(it => {
      const d = new Date(it.createdAt || it.timestamp)
      return d >= sevenDaysAgo && d <= now
    })
    let cgpa = 3.5
    if (recentItems.length > 0) {
      const totalStudy = recentItems.reduce((s, it) => s + (Number(it.studyTime) || 0), 0)
      const totalWork = recentItems.reduce((s, it) => s + (Number(it.workTime) || 0), 0)
      const avgProgress = ((Math.min(240, totalStudy + totalWork) / 240) * 100) / 100
      cgpa = Math.min(4.0, 2.5 + avgProgress * 1.5)
    }

    // Pending Assignments: count items with upcomingDeadline
    const pendingCount = items.filter(it => it.upcomingDeadline).length

    // Upcoming Deadline: find nearest future deadline
    const deadlines = items
      .filter(it => it.upcomingDeadline && typeof it.upcomingDeadline === 'string')
      .map(it => ({ date: new Date(it.upcomingDeadline), title: it.taskTitle }))
      .filter(d => d.date > now)
      .sort((a, b) => a.date - b.date)

    const nearest = deadlines[0] || null

    setStats({
      cgpa: Number(cgpa.toFixed(2)),
      attendance,
      pendingAssignments: pendingCount,
      upcomingDeadline: nearest,
      daysWithEntries: uniqueDays.size,
    })
  }

  return (
    <div className="min-h-screen bg-[#f8faff] p-8 font-sans text-slate-800">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-[#001f3f] flex items-center gap-2">
          Hello, Alex <span className="animate-bounce">👋</span>
        </h1>
        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-1">
          Track your daily progress
        </p>
      </header>

      <div className="flex items-center gap-2 mb-8">
        <span className="text-2xl">📝</span>
        <h2 className="text-xl font-bold text-[#4a3728]">Daily Avg Data</h2>
      </div>
      {/* Daily averages + Today's breakdown (replaces top stat cards) */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase">Daily Averages (7d)</p>
          <div className="flex gap-6 mt-3">
            <div className="flex-1">
              <p className="text-sm font-bold">{weeklyInsight?.avgStudyTime != null ? formatMinutesToHMS(weeklyInsight.avgStudyTime) : '—'}</p>
              <p className="text-xs text-gray-500">Avg Study</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{weeklyInsight?.avgWorkTime != null ? formatMinutesToHMS(weeklyInsight.avgWorkTime) : '—'}</p>
              <p className="text-xs text-gray-500">Avg Work</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{weeklyInsight?.avgRestTime != null ? formatMinutesToHMS(weeklyInsight.avgRestTime) : '—'}</p>
              <p className="text-xs text-gray-500">Avg Rest</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Today's Breakdown</p>
          {entriesLoading ? (
            <div className="text-sm text-gray-500 mt-2">Loading…</div>
          ) : summaryCard ? (
            <div className="flex gap-6 mt-3">
              <div className="flex-1">
                <p className="text-sm font-bold">{formatMinutesToHMS(summaryCard.inputs.totalStudy)}</p>
                <p className="text-xs text-gray-500">Study</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{formatMinutesToHMS(summaryCard.inputs.totalWork)}</p>
                <p className="text-xs text-gray-500">Work</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{formatMinutesToHMS(summaryCard.inputs.totalRest)}</p>
                <p className="text-xs text-gray-500">Rest</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 mt-2">No entries for selected date.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Today's Daily Input */}
        <div className="lg:col-span-7 bg-[#fff9f0] rounded-3xl p-8 border border-orange-100 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-2xl">📝</span>
            <h2 className="text-xl font-bold text-[#4a3728]">Daily Overview</h2>
          </div>

          {/* AI Analysis Panel */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">AI Analysis</p>
                <p className="text-sm font-medium text-gray-700">Analyze backend entries by date</p>
              </div>
            </div>
            <div className="flex gap-2 items-center mb-4">
              <input type="date" value={analyzeDate} onChange={(e) => setAnalyzeDate(e.target.value)} className="rounded border px-3 py-2" />
              <button onClick={handleAnalyze} disabled={analyzing} className="px-4 py-2 bg-[#001f3f] text-white rounded">
                {analyzing ? 'Analyzing…' : 'Analyze Day'}
              </button>
            </div>

            {aiResult && (
              <div className="mt-2 text-sm text-gray-700">
                {aiResult.error ? (
                  <div className="text-red-600">Error: {aiResult.error}</div>
                ) : (
                  <AIResultView result={aiResult} />
                )}
              </div>
            )}
          </div>

          {/* Weekly Insight + Summary (dynamic) */}
          <div className="mt-6 grid grid-cols-1 gap-4">


            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Summary</p>
              {entriesLoading ? (
                <div className="text-sm text-gray-500">Loading summary…</div>
              ) : summaryCard ? (
                <>
                  <div className="flex items-start justify-between">
                    <p className="text-xs text-gray-500">Pressure: {summaryCard.pressure} — Progress: {summaryCard.progress}%</p>
                    <div className="text-sm font-bold ml-4">Priority: {summaryCard.progress >= 75 ? 'Optimal' : summaryCard.progress >= 40 ? 'Moderate' : 'Needs Work'}</div>
                  </div>
                  <div className="mt-4">
                    <Link href="/dashboard/daily-input">
                      <button className="px-4 py-2 bg-[#1a365d] text-white rounded hover:bg-[#142e52] transition cursor-pointer">More Details</button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">No entries for selected date.</div>
              )}

            </div>
          </div>

        </div>

        {/* Right Section */}
        <div className="lg:col-span-5 space-y-6">
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

          {/* Upcoming Deadline */}
          {stats.upcomingDeadline ? (
            <div className="bg-gradient-to-r from-[#1a365d] to-[#2d5a8c] rounded-3xl p-6 text-white flex justify-between items-center shadow-lg">
              <div>
                <p className="text-xs font-medium text-blue-300 mb-1">Upcoming Deadline</p>
                <h4 className="text-sm font-bold mb-4 truncate max-w-xs">{stats.upcomingDeadline.title}</h4>
                <div className="text-4xl font-bold flex items-baseline gap-1">
                  {formatTimeRemaining(stats.upcomingDeadline.date)} <span className="text-sm font-normal text-blue-200 uppercase">left</span>
                </div>
                <p className="text-xs text-blue-300 mt-2">{stats.upcomingDeadline.date.toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-6 text-white flex justify-between items-center shadow-lg">
              <div>
                <p className="text-xs font-medium text-green-200 mb-1">Status</p>
                <h4 className="text-sm font-bold mb-4">No Upcoming Deadlines</h4>
                <p className="text-xs text-green-200">Great job! Keep up the momentum.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const StatCard = ({ label, value, subValue, subText, showCheck, borderColor, progress, progressColor = "bg-blue-900", isAssignment }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 ${borderColor}`}>
    <div className="flex justify-between items-start mb-2">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      {showCheck && <ShieldCheck size={16} className="text-orange-400" />}
    </div>
    <div className="flex items-baseline gap-3 mb-4">
      <span className="text-3xl font-bold text-slate-800">{value}</span>
      {subValue && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{subValue}</span>}
      {subText && <span className="text-xs italic text-red-500 font-medium">{subText}</span>}
    </div>
    <div className="w-full bg-gray-100 h-1.5 rounded-full flex gap-1">
      {isAssignment ? (
        [1, 2, 3, 4].map(i => <div key={i} className={`h-full flex-1 rounded-full ${i < 4 ? 'bg-red-600' : 'bg-gray-200'}`} />)
      ) : (
        <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${progress}%` }} />
      )}
    </div>
  </div>
);

const InputSelector = ({ label, options, active }) => (
  <div>
    <label className="block font-bold text-[10px] uppercase text-gray-400 tracking-wider mb-2">{label}</label>
    <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
      {options.map(opt => (
        <button key={opt} className={`flex-1 py-2 text-xs font-bold transition-all ${opt === active ? 'bg-[#001f3f] text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const AIResultView = ({ result }) => {
  const ai = result.data || {}
  const summary = ai.summary || ai?.summary || result.summary || ai?.raw || ''
  const recommendedActions = ai.recommendedActions || ai.recommended_actions || []
  const recommendedReading = ai.recommendedReading || ai.recommended_reading || []
  const quickTip = ai.quickTip || ai.quick_tip || ''
  const [open, setOpen] = React.useState(false)

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="text-left w-full pb-2 border-b mb-2">
        <strong>Summary:</strong> {typeof summary === 'string' ? summary.slice(0, 120) : JSON.stringify(summary).slice(0, 120)} {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="space-y-3">
          <div className="text-sm text-gray-700">{typeof summary === 'string' ? summary : JSON.stringify(summary, null, 2)}</div>
          {recommendedActions.length > 0 && (
            <div>
              <p className="font-bold mt-2">Recommended Actions</p>
              <ul className="list-disc pl-5 text-sm">
                {recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {recommendedReading.length > 0 && (
            <div>
              <p className="font-bold mt-2">Recommended Reading</p>
              <ul className="list-disc pl-5 text-sm">
                {recommendedReading.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
          {quickTip && (
            <div>
              <p className="font-bold mt-2">Quick Tip</p>
              <p className="text-sm">{quickTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard;