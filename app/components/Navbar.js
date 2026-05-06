'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, UserCircle } from 'lucide-react'
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

  const activeTab = 'Dashboard'
  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Daily Input', href: '/dashboard/daily-input' },
    { name: 'My Progress', href: '/dashboard/my-progress' },
    { name: 'Study Planner', href: '/dashboard/study-planner' },
  ]

  return (
    <nav className="w-full px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center gap-10 ">
        <Link href="/dashboard" className="text-[#2b458d] text-xl font-bold tracking-tight">EduTrack</Link>

        <div className="hidden md:flex items-center gap-8">
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
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <UserCircle size={28} />
              )}
              <span className="text-sm font-medium text-gray-700">{user.displayName || user.email}</span>
            </div>
            <button onClick={handleSignOut} className="text-sm px-3 py-1 rounded bg-[#ef4444] text-white">Sign out</button>
          </div>
        ) : (
          <Link href="/login" className="px-3 py-1 rounded bg-[#001f3f] text-white text-sm">Sign in</Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar