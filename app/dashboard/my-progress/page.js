import React from 'react';
import { TrendingUp, Award, BookOpen, Clock, ChevronRight } from 'lucide-react';

export default function MyProgressPage() {
  const progressData = [
    { subject: 'Web Development', percentage: 85, color: 'bg-blue-600', lessons: '12/15' },
    { subject: 'UI/UX Design', percentage: 60, color: 'bg-purple-600', lessons: '8/12' },
    { subject: 'JavaScript Deep Dive', percentage: 40, color: 'bg-amber-500', lessons: '4/10' },
    { subject: 'Data Structures', percentage: 92, color: 'bg-emerald-500', lessons: '23/25' },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Progress Metrics</h1>
          <p className="text-slate-500 mt-2">Track your learning journey and milestones, Rajash.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Progress Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progressData.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${item.color.replace('bg-', 'bg-opacity-10 ')} ${item.color.replace('bg-', 'text-')}`}>
                      <BookOpen size={24} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.lessons} Lessons</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">{item.subject}</h3>
                  
                  {/* Custom Progress Bar */}
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`${item.color} h-full rounded-full transition-all duration-1000`} 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-3">
                    <span className="text-sm font-medium text-slate-500">Completion</span>
                    <span className="text-sm font-bold text-slate-800">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Achievement Section */}
            <div className="bg-indigo-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-6 overflow-hidden relative">
              <div className="relative z-10 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">Keep it up, Rajash! 🚀</h2>
                <p className="text-indigo-200">You completed 4 more topics this week than last month. You're in the top 5% of learners this week.</p>
                <button className="mt-6 bg-white text-indigo-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-indigo-50 transition-colors">
                  View Full Report
                </button>
              </div>
              <div className="hidden md:block opacity-20 absolute -right-4 -bottom-4">
                <Award size={200} />
              </div>
            </div>
          </div>

          {/* Sidebar - Recent Activity & Stats */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-500" /> Activity Stats
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><Clock size={18} /></div>
                    <span className="text-sm text-slate-600">Study Time</span>
                  </div>
                  <span className="font-bold text-slate-800">42h 15m</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Award size={18} /></div>
                    <span className="text-sm text-slate-600">Certificates</span>
                  </div>
                  <span className="font-bold text-slate-800">03</span>
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

        {/* Footer */}
        <div className="mt-12 py-6 border-t border-slate-200 text-center">
          <p className="text-slate-400 text-sm">Dashboard System v2.0 • Created by Rajash</p>
        </div>
      </div>
    </main>
  );
} 
