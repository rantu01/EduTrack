"use client";
import React, { useState } from 'react';
import { Minus, Plus, Lightbulb, ShieldCheck, ArrowRight, Smile, Frown, Meh } from 'lucide-react';

const Dashboard = () => {
  const [studyHours, setStudyHours] = useState(8);

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

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          label="CGPA Cumulative" 
          value="3.84" 
          subValue="+0.12" 
          borderColor="border-blue-900" 
          progress={70} 
        />
        <StatCard 
          label="Attendance %" 
          value="94.2%" 
          showCheck 
          borderColor="border-orange-400" 
          progress={85} 
          progressColor="bg-orange-400"
        />
        <StatCard 
          label="Pending Assignments" 
          value="03" 
          subText="Due soon" 
          borderColor="border-red-600" 
          isAssignment 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Today's Daily Input */}
        <div className="lg:col-span-7 bg-[#fff9f0] rounded-3xl p-8 border border-orange-100 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-2xl">📝</span>
            <h2 className="text-xl font-bold text-[#4a3728]">Today's Daily Input</h2>
          </div>

          <div className="space-y-8">
            {/* Study Hours */}
            <div className="flex justify-between items-center">
              <div>
                <label className="block font-bold text-xs uppercase text-gray-500 tracking-wider">Study Hours</label>
                <p className="text-[10px] text-gray-400">Total focus time today</p>
              </div>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setStudyHours(Math.max(0, studyHours - 1))} className="p-3 hover:bg-gray-50"><Minus size={16} /></button>
                <span className="px-6 font-bold text-lg">{studyHours.toString().padStart(2, '0')}</span>
                <button onClick={() => setStudyHours(studyHours + 1)} className="p-3 hover:bg-gray-50"><Plus size={16} /></button>
              </div>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-2 gap-6">
              <InputSelector label="Assignment Due" options={['Yes', 'No']} active="Yes" />
              <InputSelector label="Attendance" options={['All', 'Some', 'Absent']} active="All" />
            </div>

            {/* Subject Difficulty */}
            <div>
              <label className="block font-bold text-xs uppercase text-gray-500 tracking-wider mb-2">Subject Difficulty</label>
              <input 
                type="text" 
                defaultValue="Advanced Calculus (Highly Demanding)" 
                className="w-full bg-transparent border-b border-gray-300 py-2 focus:outline-none focus:border-orange-400 font-medium"
              />
            </div>

            {/* Mood Selector */}
            <div>
              <label className="block font-bold text-xs uppercase text-gray-500 tracking-wider mb-4">Current Mood</label>
              <div className="flex gap-4">
                {[Frown, Frown, Meh, Smile, Smile].map((Icon, i) => (
                  <button key={i} className={`p-3 rounded-xl border ${i === 3 ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200'} hover:shadow-md transition-all`}>
                    <Icon size={24} className={i === 3 ? 'text-blue-600' : 'text-gray-400'} />
                  </button>
                ))}
              </div>
            </div>

            <button className="w-full bg-[#001f3f] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#052c52] transition-all group">
              Get Smart Suggestion <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="lg:col-span-5 space-y-6">
          {/* Personalized Insight */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl relative overflow-hidden ring-4 ring-[#4a3728]/5">
             <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={20} className="text-[#4a3728]" fill="#4a3728" />
                <h3 className="font-bold text-sm text-[#4a3728]">Personalized Study Insight</h3>
             </div>
             <h4 className="text-xl font-black italic text-[#001f3f] mb-4">"Prioritize Rest Over Late Revision"</h4>
             <p className="text-gray-500 text-sm leading-relaxed mb-6">
               Based on your reported 8 study hours and a "Slightly Content" mood with an assignment due, your efficiency peak has passed. For Calculus tomorrow, focus on a quick 20-minute recap of core formulas and aim for 8 hours of sleep to ensure cognitive retention.
             </p>
             <div className="bg-blue-50/50 p-4 rounded-xl flex items-center gap-4 border border-blue-100/50">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><ShieldCheck size={20} /></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Recommended Action</p>
                  <p className="text-sm font-bold text-gray-700">Review 'Integration by Parts' @ 9:00 PM</p>
                </div>
             </div>
          </div>

          {/* Upcoming Deadline */}
          <div className="bg-[#1a365d] rounded-3xl p-6 text-white flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-blue-200 mb-1">Upcoming Deadline</p>
              <h4 className="text-sm font-bold mb-4">CS402: Software Architecture - Final Project</h4>
              <div className="text-4xl font-bold flex items-baseline gap-1">
                48 <span className="text-sm font-normal text-blue-200 uppercase">hrs left</span>
              </div>
            </div>
            <button className="bg-[#f3d1a7] text-black px-6 py-2 rounded-lg font-bold text-xs hover:bg-[#eac496] transition-colors">
              SUBMIT NOW
            </button>
          </div>
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

export default Dashboard;