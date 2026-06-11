"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link'
import { Minus, Plus, Lightbulb, ShieldCheck, ArrowRight, Smile, Frown, Meh, User, Calendar, Clock, Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [deadlinesModalOpen, setDeadlinesModalOpen] = useState(false)

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
    const pendingCount = items.filter(it => it.upcomingDeadline || it.deadlines).length

    // Upcoming Deadline: find nearest future deadline
    // collect all deadlines from both arrays and string fields
    const allDeadlines = []
    items.forEach(it => {
      // handle upcomingDeadline as array
      if (Array.isArray(it.upcomingDeadline)) {
        it.upcomingDeadline.forEach(d => {
          if (d && d.date) {
            allDeadlines.push({ date: new Date(d.date), title: d.title || 'Deadline', type: d.type })
          }
        })
      } else if (it.upcomingDeadline && typeof it.upcomingDeadline === 'string') {
        // handle string deadline
        allDeadlines.push({ date: new Date(it.upcomingDeadline), title: it.taskTitle || 'Deadline' })
      }
      // handle deadlines array field
      if (Array.isArray(it.deadlines)) {
        it.deadlines.forEach(d => {
          if (d && d.date) {
            allDeadlines.push({ date: new Date(d.date), title: d.title || 'Deadline', type: d.type })
          }
        })
      }
    })
    
    // filter future deadlines and sort
    const futureDeadlines = allDeadlines.filter(d => d.date > now).sort((a, b) => a.date - b.date)
    const nearest = futureDeadlines[0] || null

    setStats({
      cgpa: Number(cgpa.toFixed(2)),
      attendance,
      pendingAssignments: pendingCount,
      upcomingDeadline: nearest,
      daysWithEntries: uniqueDays.size,
    })
  }

  function collectAllDeadlines() {
    try {
      const all = []
      ;(allEntries || []).forEach((it) => {
        if (Array.isArray(it.deadlines)) {
          it.deadlines.forEach(d => all.push(d))
        }
        if (Array.isArray(it.upcomingDeadline)) {
          it.upcomingDeadline.forEach(d => all.push(d))
        } else if (it.upcomingDeadline && typeof it.upcomingDeadline === 'string') {
          // single string deadline stored as ISO
          all.push({ title: it.taskTitle || 'Deadline', date: it.upcomingDeadline })
        }
      })
      // dedupe by title+date+id
      const key = (d) => `${d.title || ''}::${d.date || ''}::${d.id || ''}`
      const map = new Map()
      all.forEach(d => { if (!map.has(key(d))) map.set(key(d), d) })
      const arr = Array.from(map.values())
      return arr.sort((a,b)=> new Date(a.date) - new Date(b.date))
    } catch (e) {
      console.error('collectAllDeadlines error', e)
      return []
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans text-slate-800 pb-24 md:pb-0">
      {/* Header Section */}
      <header className="mb-6 md:mb-12 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2 md:gap-3 mb-2">
              Welcome back, {user?.displayName || (user?.email ? user.email.split('@')[0] : 'Friend')}
              <User className="text-blue-500 w-6 h-6 md:w-8 md:h-8" />
            </h1>
            <p className="text-xs md:text-sm font-semibold text-slate-500 tracking-wide">Track your progress and stay focused</p>
          </div>
        </div>
      </header>

      {/* Stats Cards Grid */}
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8 animate-fade-in-delay">
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">CGPA</p>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <p className="text-xl md:text-3xl font-bold text-blue-600">{stats.cgpa.toFixed(2)}</p>
          <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2">Last 7 days</p>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Attendance</p>
            <Target size={16} className="text-blue-500" />
          </div>
          <p className="text-xl md:text-3xl font-bold text-blue-600">{stats.attendance}%</p>
          <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2">Active days</p>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Pending</p>
            <AlertCircle size={16} className="text-orange-500" />
          </div>
          <p className="text-xl md:text-3xl font-bold text-orange-600">{stats.pendingAssignments}</p>
          <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2">Assignments</p>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Entries</p>
            <Calendar size={16} className="text-indigo-500" />
          </div>
          <p className="text-xl md:text-3xl font-bold text-indigo-600">{stats.daysWithEntries}</p>
          <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2">Days tracked</p>
        </div>
      </div> */}

      {/* Time Tracking Section */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
          <Clock size={20} className="text-blue-600" />
          Daily Overview
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
          {/* Weekly Averages */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-4">Weekly Averages (7 days)</p>
            <div className="space-y-2 md:space-y-4">
              <div className="flex items-center justify-between p-2 md:p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg md:text-xl">📚</span>
                  <span className="font-semibold text-slate-700 text-sm">Study Time</span>
                </div>
                <p className="text-sm md:text-lg font-bold text-blue-600">{weeklyInsight?.avgStudyTime != null ? formatMinutesToHMS(weeklyInsight.avgStudyTime) : '—'}</p>
              </div>
              <div className="flex items-center justify-between p-2 md:p-3 bg-gradient-to-r from-indigo-50 to-transparent rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg md:text-xl">💼</span>
                  <span className="font-semibold text-slate-700 text-sm">Work Time</span>
                </div>
                <p className="text-sm md:text-lg font-bold text-indigo-600">{weeklyInsight?.avgWorkTime != null ? formatMinutesToHMS(weeklyInsight.avgWorkTime) : '—'}</p>
              </div>
              <div className="flex items-center justify-between p-2 md:p-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg md:text-xl">😴</span>
                  <span className="font-semibold text-slate-700 text-sm">Rest Time</span>
                </div>
                <p className="text-sm md:text-lg font-bold text-emerald-600">{weeklyInsight?.avgRestTime != null ? formatMinutesToHMS(weeklyInsight.avgRestTime) : '—'}</p>
              </div>
            </div>
          </div>

          {/* Today's Breakdown */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-4">Today's Breakdown</p>
            {entriesLoading ? (
              <div className="flex items-center justify-center h-20 md:h-32">
                <div className="text-xs md:text-sm text-slate-500">Loading…</div>
              </div>
            ) : summaryCard ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📚</span>
                    <span className="font-semibold text-slate-700">Study</span>
                  </div>
                  <p className="text-lg font-bold text-blue-600">{formatMinutesToHMS(summaryCard.inputs.totalStudy)}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-transparent rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💼</span>
                    <span className="font-semibold text-slate-700">Work</span>
                  </div>
                  <p className="text-lg font-bold text-indigo-600">{formatMinutesToHMS(summaryCard.inputs.totalWork)}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">😴</span>
                    <span className="font-semibold text-slate-700">Rest</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-600">{formatMinutesToHMS(summaryCard.inputs.totalRest)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-sm text-slate-500">
                No entries for selected date
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: AI Analysis & Daily Input */}
        <div className="lg:col-span-8">
          {/* AI Analysis Panel */}
          {/* <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb size={24} className="text-amber-500" />
              <h2 className="text-xl font-bold text-slate-800">AI Analysis</h2>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <input 
                  type="date" 
                  value={analyzeDate} 
                  onChange={(e) => setAnalyzeDate(e.target.value)} 
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button 
                  onClick={handleAnalyze} 
                  disabled={analyzing} 
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>

              {aiResult && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {aiResult.error ? (
                    <div className="text-red-600 font-semibold">Error: {aiResult.error}</div>
                  ) : (
                    <AIResultView result={aiResult} />
                  )}
                </div>
              )}
            </div>
          </div> */}

          {/* Selected Entry Viewer */}
          <div className="animate-fade-in-delay">
            <SelectedEntryView analyzeDate={analyzeDate} allEntries={allEntries} formatMinutesToHMS={formatMinutesToHMS} />
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-slate-200 shadow-sm mt-6">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-4">Daily Summary</p>
            {entriesLoading ? (
              <div className="text-sm text-slate-500">Loading summary…</div>
            ) : summaryCard ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Pressure Level</p>
                    <p className="text-2xl font-bold text-orange-600">{summaryCard.pressure}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Progress</p>
                    <p className="text-2xl font-bold text-green-600">{summaryCard.progress}%</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                    style={{ width: `${summaryCard.progress}%` }}
                  ></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <span className="inline-block px-3 py-1 bg-white rounded-full text-xs font-bold text-slate-700 border border-slate-200">
                    {summaryCard.progress >= 75 ? '✓ Optimal' : summaryCard.progress >= 40 ? '⚠ Moderate' : '! Needs Work'}
                  </span>
                </div>
                <Link href="/dashboard/daily-input">
                  <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all">
                    View Details →
                  </button>
                </Link>
              </div>
            ) : (
              <div className="text-sm text-slate-500">No entries for selected date.</div>
            )}
          </div>
        </div>

        {/* Right: Deadlines & Insights */}
        <div className="lg:col-span-4 space-y-6">
          {/* Weekly Insight Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} />
              <p className="text-sm font-bold uppercase tracking-widest">Weekly Insight</p>
            </div>
            {weeklyInsight && weeklyInsight.count > 0 ? (
              <div className="space-y-2">
                <div className="text-sm opacity-90">
                  <span className="font-bold text-blue-200">Entries:</span> {weeklyInsight.count}
                </div>
                <div className="text-xs opacity-80 border-t border-blue-400 pt-2 mt-2">
                  <p className="font-semibold text-blue-100 mb-1">Summary:</p>
                  <p>You've been tracking your time consistently. Keep it up!</p>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed opacity-90">Start tracking to see your weekly insights.</div>
            )}
          </div>

          {/* Upcoming Deadline Card */}
          {stats.upcomingDeadline ? (
            <div 
              onClick={() => setDeadlinesModalOpen(true)} 
              className="cursor-pointer bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={20} />
                <p className="text-xs font-bold uppercase tracking-widest">Upcoming Deadline</p>
              </div>
              <h4 className="text-lg font-bold mb-3 truncate">{stats.upcomingDeadline.title}</h4>
              <div className="text-3xl font-bold flex items-baseline gap-2 mb-2">
                {formatTimeRemaining(stats.upcomingDeadline.date)}
                <span className="text-sm font-normal opacity-80">left</span>
              </div>
              <p className="text-xs opacity-90">{stats.upcomingDeadline.date.toLocaleDateString()}</p>
            </div>
          ) : (
            <div 
              onClick={() => setDeadlinesModalOpen(true)} 
              className="cursor-pointer bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} />
                <p className="text-xs font-bold uppercase tracking-widest">Status</p>
              </div>
              <h4 className="text-lg font-bold mb-2">All Clear!</h4>
              <p className="text-sm opacity-90">No upcoming deadlines. Great momentum! 🚀</p>
            </div>
          )}

          {/* All Deadlines Preview */}
          {(() => {
            const deadlines = collectAllDeadlines().slice(0, 3)
            return deadlines.length > 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" />
                  Recent Deadlines
                </h3>
                <div className="space-y-3">
                  {deadlines.map((d, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 text-sm">{d.title}</div>
                          <div className="text-xs text-slate-500 mt-1">{d.date ? new Date(d.date).toLocaleDateString() : '—'}</div>
                        </div>
                        {d.date && (
                          <div className="text-xs font-bold text-orange-600 whitespace-nowrap ml-2">
                            {formatTimeRemaining(new Date(d.date))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setDeadlinesModalOpen(true)}
                  className="w-full mt-4 text-xs font-bold text-blue-600 hover:text-blue-700 py-2"
                >
                  View all deadlines →
                </button>
              </div>
            ) : null
          })()}
        </div>
      </div>

      {/* Deadlines Modal */}
      {deadlinesModalOpen && (() => {
        const deadlines = collectAllDeadlines()
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Calendar size={24} className="text-blue-600" />
                  All Deadlines
                </h3>
                <button 
                  onClick={() => setDeadlinesModalOpen(false)} 
                  className="text-2xl text-slate-400 hover:text-slate-600 font-light"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                {deadlines.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-3 opacity-30" />
                    <div className="text-slate-500 font-semibold">No deadlines found.</div>
                  </div>
                ) : (
                  deadlines.map((d, i) => (
                    <div key={i} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-slate-800">{d.title}</div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <Calendar size={14} />
                            {d.date ? new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </div>
                        </div>
                        {d.date && (
                          <div className="text-right">
                            <div className="text-sm font-bold text-orange-600">
                              {formatTimeRemaining(new Date(d.date))}
                            </div>
                            <div className="text-xs text-slate-500">remaining</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-fade-in-delay {
          animation: fadeIn 0.6s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
};

// Reusable Components
const SelectedEntryView = ({ analyzeDate, allEntries, formatMinutesToHMS }) => {
  const activityIcons = {
    study: '📚', work: '💼', rest: '😴', mobile: '📱', game: '🎮', assignment: '📝', reading: '📖', other: '✏️'
  }

  const selectedEntry = React.useMemo(() => {
    if (!allEntries || allEntries.length === 0) return null
    const dayStart = new Date(analyzeDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    return allEntries.find(it => {
      const d = new Date(it.createdAt || it.timestamp || it.created_at)
      return d >= dayStart && d < dayEnd
    }) || null
  }, [allEntries, analyzeDate])

  if (!selectedEntry) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-slate-500">No entry found for selected date</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">{selectedEntry.taskTitle || 'Daily Log'}</h3>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Clock size={14} />
            {new Date(selectedEntry.timestamp || selectedEntry.createdAt).toLocaleString()}
          </div>
        </div>
        {selectedEntry.mood && (
          <div className="text-center">
            <div className="text-xs text-slate-500 font-semibold mb-1">Mood</div>
            <div className="text-3xl">{selectedEntry.mood}</div>
          </div>
        )}
      </div>

      {/* Deadlines */}
      {selectedEntry.deadlines && selectedEntry.deadlines.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800 font-bold uppercase mb-2">Deadlines</p>
          <ul className="space-y-1">
            {selectedEntry.deadlines.map((d, i) => (
              <li key={i} className="text-sm text-amber-900">
                <span className="font-semibold">{d.title}</span> — {d.date}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Time Aggregates */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-700 font-bold uppercase mb-1">Study</div>
          <div className="text-xl font-bold text-blue-900">{formatMinutesToHMS(selectedEntry.studyTime)}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
          <div className="text-xs text-indigo-700 font-bold uppercase mb-1">Work</div>
          <div className="text-xl font-bold text-indigo-900">{formatMinutesToHMS(selectedEntry.workTime)}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
          <div className="text-xs text-emerald-700 font-bold uppercase mb-1">Rest</div>
          <div className="text-xl font-bold text-emerald-900">{formatMinutesToHMS(selectedEntry.restTime)}</div>
        </div>
      </div>

      {/* Segments list */}
      {Array.isArray(selectedEntry.segments) && selectedEntry.segments.length > 0 && (
        <div className="space-y-3 mb-6">
          <p className="text-sm font-bold text-slate-700">Activity Breakdown</p>
          {selectedEntry.segments.map((seg) => (
            <div key={seg.id} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold text-slate-800">
                    {seg.label} 
                    <span className="text-xs text-slate-500 ml-2 font-normal">
                      {seg.startTime} - {seg.endTime}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mt-2">
                    {activityIcons[seg.activity] || ''} <strong>{seg.activity}</strong>
                    {seg.note && ` — ${seg.note}`}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    {seg.durationMinutes} mins
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-600">{seg.distractionMinutes || 0}m</div>
                  <div className="text-xs text-slate-500">distracted</div>
                  {seg.distractionReason && (
                    <div className="text-xs text-slate-500 mt-1">{seg.distractionReason}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unaccounted Time */}
      {(selectedEntry.unaccountedTime || selectedEntry.distractionTime) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-800 font-bold uppercase mb-2">Time Analysis</p>
          <div className="space-y-1 text-sm text-red-900">
            <div>Unaccounted: <strong>{selectedEntry.unaccountedTime} mins</strong></div>
            {selectedEntry.unaccountedActivity && (
              <div className="text-xs text-red-700"><em>{selectedEntry.unaccountedActivity}</em></div>
            )}
            <div className="pt-2 border-t border-red-200">Total Distraction: <strong>{selectedEntry.distractionTime || 0} mins</strong></div>
          </div>
        </div>
      )}
    </div>
  )
}

const AIResultView = ({ result }) => {
  const ai = result.data || {}
  const summary = ai.summary || ai?.summary || result.summary || ai?.raw || ''
  const recommendedActions = ai.recommendedActions || ai.recommended_actions || []
  const recommendedReading = ai.recommendedReading || ai.recommended_reading || []
  const quickTip = ai.quickTip || ai.quick_tip || ''
  const [open, setOpen] = React.useState(false)

  return (
    <div className="space-y-3">
      <button 
        onClick={() => setOpen(!open)} 
        className="text-left w-full pb-3 border-b border-slate-200 hover:text-blue-600 transition-colors"
      >
        <div className="flex justify-between items-center">
          <strong className="text-slate-800">Summary</strong>
          <span className="text-lg">{open ? '▲' : '▼'}</span>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          {typeof summary === 'string' ? summary.slice(0, 100) : JSON.stringify(summary).slice(0, 100)}...
        </p>
      </button>
      
      {open && (
        <div className="space-y-4 animate-fade-in pt-3">
          <div className="text-sm text-slate-700 leading-relaxed">
            {typeof summary === 'string' ? summary : JSON.stringify(summary, null, 2)}
          </div>
          
          {recommendedActions.length > 0 && (
            <div>
              <p className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" />
                Recommended Actions
              </p>
              <ul className="space-y-2">
                {recommendedActions.map((a, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {recommendedReading.length > 0 && (
            <div>
              <p className="font-bold text-slate-800 mb-2">Recommended Reading</p>
              <ul className="space-y-2">
                {recommendedReading.map((r, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {quickTip && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="font-bold text-amber-900 text-sm mb-1">💡 Quick Tip</p>
              <p className="text-sm text-amber-800">{quickTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard;