import React from 'react';
import { Calendar, CheckCircle2, Clock, BookOpen } from 'lucide-react'; // Icons-er jonno (optional)

export const metadata = {
  title: 'Study Planner | Stay Organized'
}

export default function StudyPlannerPage() {
  const tasks = [
    { id: 1, subject: 'Mathematics', topic: 'Calculus Integration', time: '10:00 AM', status: 'Pending' },
    { id: 2, subject: 'Physics', topic: 'Thermodynamics', time: '02:30 PM', status: 'In Progress' },
    { id: 3, subject: 'English', topic: 'Essay Writing', time: '05:00 PM', status: 'Completed' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <header className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Study Planner 📚
              </h1>
              <p className="text-gray-500 mt-2 text-lg">
                Welcome back, <span className="font-semibold text-indigo-600">Rajash</span>! Let's crush your goals today.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md active:scale-95">
                + New Task
              </button>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Hours', value: '6.5h', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Courses', value: '4 Active', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Completed', value: '85%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Study Schedule Table */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="text-indigo-500" size={20} />
              Today's Schedule
            </h2>
            <span className="text-sm text-gray-400 font-medium">May 24, 2024</span>
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
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-700">{task.subject}</td>
                    <td className="px-6 py-4 text-gray-600">{task.topic}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{task.time}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        task.status === 'Completed' ? 'bg-green-100 text-green-600' : 
                        task.status === 'In Progress' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer / Rajash's Credit */}
        <footer className="mt-12 text-center">
          <div className="inline-block bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">
              Crafted with ❤️ by <span className="font-bold text-gray-800">Rajash</span>
            </p>
          </div>
        </footer>

      </div>
    </main>
  );
}