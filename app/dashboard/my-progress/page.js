"use client"
import React, { useEffect, useState } from 'react'
import { TrendingUp, Award, BookOpen, Clock, ChevronRight } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../../lib/firebase'

function makeCardsFromInsights(insights) {
  if (!insights) return []
  const items = [
    { subject: 'Study', value: insights.avgStudyTime || 0, color: 'bg-blue-600' },
    { subject: 'Work', value: insights.avgWorkTime || 0, color: 'bg-amber-500' },
    { subject: 'Rest', value: insights.avgRestTime || 0, color: 'bg-emerald-500' },
    { subject: 'Mobile', value: insights.avgMobileTime || 0, color: 'bg-purple-600' },
  ]
  const total = items.reduce((s, it) => s + (Number(it.value) || 0), 0) || 1
  return items.map((it) => ({
    subject: it.subject,
    percentage: Math.min(100, Math.round((Number(it.value) / total) * 100)),
    color: it.color,
    lessons: `${Math.round(Number(it.value) || 0)}m avg`
  }))
}

export default function MyProgressPage() {
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState(null)
  const [progressData, setProgressData] = useState([])

  useEffect(() => {
    let unsub
    unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/daily-input?userId=${encodeURIComponent(user.uid)}&insights=weekly`)
        const json = await res.json()
        if (json && json.success !== false) {
          setInsights(json)
          const cards = makeCardsFromInsights(json)
          if (cards.length) setProgressData(cards)
        }
      } catch (e) {
        console.error('Failed to load insights', e)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub && unsub()
  }, [])

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Progress Metrics</h1>
          <p className="text-slate-500 mt-2">Track your learning journey and milestones.</p>
        </div>

        {loading ? (
          <div className="text-center py-20">Loading progress…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {progressData.length > 0 ? (
                  progressData.map((item, index) => (
                    <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${item.color.replace('bg-', 'bg-opacity-10 ')} ${item.color.replace('bg-', 'text-')}`}>
                          <BookOpen size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.lessons}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4">{item.subject}</h3>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div className={`${item.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${item.percentage}%` }} />
                      </div>
                      <div className="flex justify-between mt-3">
                        <span className="text-sm font-medium text-slate-500">Completion</span>
                        <span className="text-sm font-bold text-slate-800">{item.percentage}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No progress data yet. Add some daily inputs to see insights.</div>
                )}
              </div>

              <div className="bg-indigo-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-6 overflow-hidden relative">
                <div className="relative z-10 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">Keep going! 🚀</h2>
                  <p className="text-indigo-200">Weekly summary is shown from your recent daily inputs.</p>
                </div>
                <div className="hidden md:block opacity-20 absolute -right-4 -bottom-4">
                  <Award size={200} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-500" /> Activity Stats
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><Clock size={18} /></div>
                      <span className="text-sm text-slate-600">Avg Study (weekly)</span>
                    </div>
                    <span className="font-bold text-slate-800">{insights?.avgStudyTime ?? '—'}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Award size={18} /></div>
                      <span className="text-sm text-slate-600">Avg Mobile</span>
                    </div>
                    <span className="font-bold text-slate-800">{insights?.avgMobileTime ?? '—'}m</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Recent Milestones</h3>
                <div className="space-y-4">
                  {[
                    'Finished React Basics',
                    '10 Day Study Streak',
                    'JavaScript Project Live'
                  ].map((milestone, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 group cursor-pointer hover:bg-white transition-all">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span className="text-sm text-slate-700 flex-1">{milestone}</span>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 py-6 border-t border-slate-200 text-center">
          <p className="text-slate-400 text-sm">Dashboard System v2.0</p>
        </div>
      </div>
    </main>
  )
}
