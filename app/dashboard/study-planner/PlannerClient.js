"use client"
import React, { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Clock, BookOpen } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../../lib/firebase'

function mapLatestToTasks(latest) {
  if (!latest) return []
  if (Array.isArray(latest.segments) && latest.segments.length > 0) {
    return latest.segments.map((s, i) => ({
      id: i,
      subject: s.activity || 'Study',
      topic: s.topic || s.activity || 'Task',
      time: s.startTime || s.endTime || '—',
      status: s.completed ? 'Completed' : 'Pending'
    }))
  }
  if (Array.isArray(latest.deadlines) && latest.deadlines.length > 0) {
    return latest.deadlines.map((d, i) => ({ id: i, subject: d.course || 'Task', topic: d.title || 'Deadline', time: d.due || '—', status: 'Planned' }))
  }
  return []
}

export default function StudyPlannerClient() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let unsub
    unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const [listRes, insightRes] = await Promise.all([
          fetch(`/api/daily-input?userId=${encodeURIComponent(user.uid)}`),
          fetch(`/api/daily-input?userId=${encodeURIComponent(user.uid)}&insights=weekly`)
        ])
        const listJson = await listRes.json()
        const insightJson = await insightRes.json()
        setStats(insightJson && insightJson.success !== false ? insightJson : null)
        if (listJson && Array.isArray(listJson.items) && listJson.items.length > 0) {
          const latest = listJson.items[0]
          const derived = mapLatestToTasks(latest)
          if (derived.length > 0) setTasks(derived)
        }
      } catch (e) {
        console.error('Failed loading planner', e)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub && unsub()
  }, [])

  const displayTasks = tasks.length > 0 ? tasks : [
    { id: 1, subject: 'Mathematics', topic: 'Calculus Integration', time: '10:00 AM', status: 'Pending' },
    { id: 2, subject: 'Physics', topic: 'Thermodynamics', time: '02:30 PM', status: 'In Progress' },
  ]

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <header className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Study Planner 📚</h1>
              <p className="text-gray-500 mt-2 text-lg">Welcome back! Your planner shows live data from your daily inputs.</p>
            </div>
            <div className="flex gap-3">
              {/* <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md active:scale-95">+ New Task</button> */}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`bg-blue-50 text-blue-600 p-3 rounded-lg`}><Clock size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.avgStudyTime ? `${(stats.avgStudyTime/60).toFixed(1)}h` : '—'}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`bg-purple-50 text-purple-600 p-3 rounded-lg`}><BookOpen size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats ? 'Active' : '—'}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`bg-emerald-50 text-emerald-600 p-3 rounded-lg`}><CheckCircle2 size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.avgStudyTime ? `${Math.round(Math.min(100, stats.avgStudyTime))}%` : '—'}</p>
            </div>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Calendar className="text-indigo-500" size={20} />Today's Schedule</h2>
            <span className="text-sm text-gray-400 font-medium">Today</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Topic</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-700">{task.subject}</td>
                    <td className="px-6 py-4 text-gray-600">{task.topic}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{task.time}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.status === 'Completed' ? 'bg-green-100 text-green-600' : task.status === 'In Progress' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>{task.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-12 text-center">
          <div className="inline-block bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Crafted with ❤️</p>
          </div>
        </footer>
      </div>
    </main>
  )
}
