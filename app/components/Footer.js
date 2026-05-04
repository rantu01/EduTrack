import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
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
          <Link 
            href="#" 
            className="text-[#8e9aaf] text-[11px] font-bold uppercase tracking-widest hover:text-[#2b458d] transition-colors"
          >
            Academic Policy
          </Link>
          <Link 
            href="#" 
            className="text-[#8e9aaf] text-[11px] font-bold uppercase tracking-widest hover:text-[#2b458d] transition-colors"
          >
            Support
          </Link>
          <Link 
            href="#" 
            className="text-[#8e9aaf] text-[11px] font-bold uppercase tracking-widest hover:text-[#2b458d] transition-colors"
          >
            Privacy
          </Link>
        </div>

      </div>
    </footer>
  );
};

export default Footer;