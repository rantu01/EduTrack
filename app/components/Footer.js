'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const Footer = () => {
  const [modalOpen, setModalOpen] = useState(null) // 'policy' | 'privacy' | null

  const handleLinkClick = (type) => {
    setModalOpen(type)
  }

  return (
    <>
    <footer className="w-full bg-[#f0f4f8] py-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
        
        {/* Left Side: Brand and Copyright */}
        <div className="flex flex-col gap-1 text-center md:text-left">
          <h2 className="text-[#2b458d] font-bold text-lg tracking-tight">
            EduTrack
          </h2>
          <p className="text-[#8e9aaf] text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
            © 2024 EDUTRACK INSTITUTIONAL ARCHIVIST. ALL RIGHTS RESERVED.
          </p>
        </div>

        {/* Right Side: Navigation Links */}
        <div className="flex items-center gap-6 md:gap-10">
          <button 
            onClick={() => handleLinkClick('policy')}
            className="text-[#8e9aaf] text-[11px] font-bold uppercase tracking-widest hover:text-[#2b458d] transition-colors cursor-pointer bg-none border-none p-0"
          >
            Academic Policy
          </button>
          <Link 
            href="https://www.rantumondal.dev"
            target='blank'
            className="text-[#8e9aaf] text-[11px] font-bold uppercase tracking-widest hover:text-[#2b458d] transition-colors"
          >
            Support
          </Link>
          <button 
            onClick={() => handleLinkClick('privacy')}
            className="text-[#8e9aaf] text-[11px] font-bold uppercase tracking-widest hover:text-[#2b458d] transition-colors cursor-pointer bg-none border-none p-0"
          >
            Privacy
          </button>
        </div>

      </div>
    </footer>

    {/* Academic Policy Modal */}
    {modalOpen === 'policy' && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#2b458d]">Academic Policy</h2>
            <button onClick={() => setModalOpen(null)} className="p-1 hover:bg-gray-100 rounded-lg transition">
              <X size={24} className="text-gray-500" />
            </button>
          </div>
          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <section>
              <h3 className="font-bold text-lg mb-2">1. Code of Academic Integrity</h3>
              <p>All students are expected to maintain the highest standards of academic integrity. Plagiarism, cheating, and dishonest conduct are strictly prohibited and will result in disciplinary action.</p>
            </section>
            <section>
              <h3 className="font-bold text-lg mb-2">2. Attendance Requirements</h3>
              <p>Students are required to maintain a minimum attendance rate of 75% in all courses. Unauthorized absences may result in course deregistration or failure.</p>
            </section>
            <section>
              <h3 className="font-bold text-lg mb-2">3. Assignment Submission</h3>
              <p>All assignments must be submitted by the specified deadline. Late submissions may be penalized at the instructor's discretion. Extensions must be requested in advance.</p>
            </section>
            <section>
              <h3 className="font-bold text-lg mb-2">4. Grading Standards</h3>
              <p>Grades are based on assignments (30%), quizzes (20%), midterm exams (25%), and final examinations (25%). Grade appeals must be filed within 7 days of receiving your grade.</p>
            </section>
            <section>
              <h3 className="font-bold text-lg mb-2">5. Academic Probation</h3>
              <p>Students with a GPA below 2.0 will be placed on academic probation. Continued poor academic performance may result in suspension or dismissal.</p>
            </section>
          </div>
        </div>
      </div>
    )}

    {/* Privacy Policy Modal */}
    {modalOpen === 'privacy' && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#2b458d]">Privacy Policy</h2>
            <button onClick={() => setModalOpen(null)} className="p-1 hover:bg-gray-100 rounded-lg transition">
              <X size={24} className="text-gray-500" />
            </button>
          </div>
          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <section>
              <h3 className="font-bold text-lg mb-2">1. Data Collection</h3>
              <p>EduTrack collects personal information including name, email, student ID, and academic performance data to provide educational services and track progress.</p>
            </section>
            <section>
              <h3 className="font-bold text-lg mb-2">2. Data Usage</h3>
              <p>Your data is used solely for educational purposes, performance analysis, and communication. We do not share your personal information with third parties without consent.</p>
            </section>
            <section>
              <h3 className="font-bold text-lg mb-2">3. Data Security</h3>
              <p>We implement industry-standard security measures to protect your data. All information is encrypted and stored securely on our servers.</p>
            </section>
            <section>
              <h3 className="font-bold text-lg mb-2">4. User Rights</h3>
              <p>You have the right to access, modify, or delete your personal data at any time. Submit requests through your account settings or contact our support team.</p>
            </section>
            <section>
              <h3 className="font-bold text-lg mb-2">5. Cookies and Tracking</h3>
              <p>EduTrack uses cookies to enhance your user experience and analyze platform usage. You can disable cookies in your browser settings if desired.</p>
            </section>
            <section>
              <h3 className="font-bold text-lg mb-2">6. Policy Updates</h3>
              <p>We may update this privacy policy periodically. Users will be notified of significant changes via email or platform announcement.</p>
            </section>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Footer;