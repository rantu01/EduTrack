'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, UserCircle, Home, BookOpen, TrendingUp, Calendar } from 'lucide-react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useRouter, usePathname } from 'next/navigation'

const Navbar = () => {
  const router = useRouter()
  const path = usePathname()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })
    return () => unsub()
  }, [])

  async function handleSignOut() {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (err) {
      console.error('Sign out error', err)
    }
  }

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Daily Input', href: '/dashboard/daily-input', icon: BookOpen },
    { name: 'My Progress', href: '/dashboard/my-progress', icon: TrendingUp },
    { name: 'Study Planner', href: '/dashboard/study-planner', icon: Calendar },
  ]

  return (
    <>
    {/* Desktop Navbar */}
    <nav className="w-full px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center gap-10 ">
        <Link href="/dashboard" className="text-[#2b458d] text-xl font-bold tracking-tight">EduTrack</Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`relative text-sm font-semibold transition-colors duration-200 pb-1 ${
                path === link.href ? 'text-[#2b458d]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {link.name}
              {path === link.href && (
                <span className="absolute bottom-[-14px] left-0 w-full h-[3px] bg-[#f5a623] rounded-t-md" />
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-5 text-gray-500">
        

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <UserCircle size={28} />
              )}
              <span className="text-sm font-medium text-gray-700">{user.displayName || user.email}</span>
            </div>
            <button onClick={handleSignOut} className="text-sm px-3 py-1 rounded bg-[#ef4444] text-white hidden sm:block">Sign out</button>
          </div>
        ) : (
          <Link href="/login" className="px-3 py-1 rounded bg-[#001f3f] text-white text-sm">Sign in</Link>
        )}
      </div>
    </nav>

    {/* Mobile Bottom Navigation Bar */}
    <div className="fixed lg:hidden bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center h-16">
        {navLinks.map((link) => {
          const IconComponent = link.icon
          const isActive = path === link.href
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all ${
                isActive
                  ? 'text-[#2b458d] bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <IconComponent size={24} />
              <span className="text-xs font-semibold mt-1">{link.name.split(' ')[0]}</span>
            </Link>
          )
        })}
      </div>
    </div>

    {/* Mobile Sign Out / Account (if needed) */}
    {user && (
      <div className="fixed lg:hidden bottom-20 right-4 z-40">
        <button 
          onClick={handleSignOut}
          className="bg-[#ef4444] text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-lg"
        >
          Sign out
        </button>
      </div>
    )}
    </>
  )
}

export default Navbar