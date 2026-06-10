"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, GraduationCap, ShieldCheck, ArrowRight, EyeOff } from 'lucide-react';
import { auth, db } from '../../lib/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, signOut } from 'firebase/auth'
import Swal from 'sweetalert2'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

const LoginPage = () => {
  const [userType, setUserType] = useState('student');
  const [formMode, setFormMode] = useState('login') // 'login' | 'register'

  // form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [registrationKey, setRegistrationKey] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const REQUIRE_REG_KEY = process.env.NEXT_PUBLIC_REQUIRE_REG_KEY === 'true'
  const REG_KEY = process.env.NEXT_PUBLIC_REGISTRATION_KEY || ''

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    try {
      if (formMode === 'register') {
        if (password !== confirmPassword) {
          setMessage('Passwords do not match')
          return
        }
        if (REQUIRE_REG_KEY && registrationKey !== REG_KEY) {
          setMessage('Invalid registration key')
          return
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        await updateProfile(user, { displayName: fullName })
        // store extra student metadata in Firestore
        await setDoc(doc(db, 'students', user.uid), {
          fullName,
          email,
          studentId: studentId || null,
          createdAt: serverTimestamp(),
        })
        // sign out newly created user and prompt them to log in
        await signOut(auth)
        await Swal.fire({
          icon: 'success',
          title: 'Registration successful',
          text: 'Your account has been created. Please sign in to continue.',
          confirmButtonColor: '#2563eb'
        })
        router.push('/login')
        return
      }

      // login
      await signInWithEmailAndPassword(auth, email, password)
      // show success toast then navigate
      await Swal.fire({
        icon: 'success',
        title: 'Signed in',
        text: 'Welcome back!',
        showConfirmButton: false,
        timer: 1200,
        background: '#ffffff',
        confirmButtonColor: '#2563eb'
      })
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      setMessage(err.message || 'Auth error')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setMessage('')
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      const info = getAdditionalUserInfo(result)
      if (info?.isNewUser) {
        await setDoc(doc(db, 'students', user.uid), {
          fullName: user.displayName || null,
          email: user.email,
          studentId: null,
          createdAt: serverTimestamp(),
          provider: 'google',
        })
      }
      await Swal.fire({
        icon: 'success',
        title: 'Signed in',
        text: 'Welcome back!',
        showConfirmButton: false,
        timer: 1200,
        confirmButtonColor: '#2563eb'
      })
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      setMessage(err.message || 'Google sign-in error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen font-sans">
      {/* Left Section - Hero Area */}
      <div className="hidden lg:flex w-7/12 bg-[#001f3f] text-white p-16 flex-col justify-between relative overflow-hidden">
        <div className="z-10">
          <p className="text-[#d4af37] font-semibold tracking-widest text-xs mb-4 uppercase">
            Academic Excellence
          </p>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Empowering the <br /> Next Generation.
          </h1>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed">
            Access your personalized academic portal. Track your progress, 
            manage courses, and connect with advisors in one refined environment.
          </p>
        </div>

        {/* Center Illustration Placeholder */}
        <div className="relative z-10 flex justify-center py-12">
          <div className="w-80 h-80 bg-[#0a2a4d] rounded-2xl flex items-center justify-center border border-gray-700 shadow-2xl overflow-hidden">
             {/* Replace with actual image source */}
             <img 
               src="https://img.freepik.com/free-vector/flat-background-class-2023-graduation_23-2150291538.jpg?semt=ais_hybrid&w=740&q=80" 
               alt="Academic Illustration" 
               className="opacity-80 object-cover"
             />
          </div>
        </div>

        {/* Brand Logo */}
        <div className="z-10 flex items-center gap-2">
          <div className="bg-[#e2e8f0] p-1 rounded">
             <GraduationCap className="text-[#001f3f] w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">EduTrack</span>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-5/12 bg-[#f8faff] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white p-10 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-[#001f3f] mb-1">{formMode === 'login' ? 'Welcome Back' : 'Create Student Account'}</h2>
          <p className="text-gray-500 text-sm mb-8">{formMode === 'login' ? 'Sign in to continue' : 'Register as a student to access the portal'}</p>

          {/* User Type Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setUserType('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${
                userType === 'student' ? 'bg-[#001f3f] text-white shadow-md' : 'text-gray-500'
              }`}
            >
              <GraduationCap size={18} />
              <span className="text-sm font-medium text-white">Student</span>
            </button>
            {/* <button
              onClick={() => setUserType('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${
                userType === 'admin' ? 'bg-[#001f3f] text-white shadow-md' : 'text-gray-500'
              }`}
            >
              <ShieldCheck size={18} />
              <span className="text-sm font-medium">Admin</span>
            </button> */}
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {formMode === 'register' && userType === 'student' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Institutional Email</label>
              <div className="relative">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="e.g. j.doe@university.edu"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  required
                  disabled={loading}
                />
                <Mail className="absolute right-3 top-3 text-gray-400" size={18} />
              </div>
            </div>

            {formMode === 'register' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Student ID</label>
                <input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  type="text"
                  placeholder="2024-12345"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Security Key</label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="********"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  required
                  disabled={loading}
                />
                <EyeOff className="absolute right-3 top-3 text-gray-400" size={18} />
              </div>
            </div>

            {formMode === 'register' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm Security Key</label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="********"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <button disabled={loading} className={`w-full bg-[#001f3f] text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors group ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#002d5c]'}`} type="submit">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {formMode === 'login' ? 'Signing in...' : 'Registering...'}
                </>
              ) : (
                formMode === 'login' ? (
                  <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  <>Register Student <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                )
              )}
            </button>
          </form>

          {/* Google sign-in */}
          <div className="mt-4">
            <button onClick={handleGoogleSignIn} disabled={loading} className={`w-full border border-gray-200 py-2 rounded-md flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
              <img src="https://t3.ftcdn.net/jpg/03/88/07/84/360_F_388078454_mKtbdXYF9cyQovCCTsjqI0gbfu7gCcSp.jpg" alt="Google" className="w-5 h-5" />
              {loading ? <><span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> <span className="text-sm font-medium">Signing in...</span></> : <span className="text-sm font-medium">Continue with Google</span>}
            </button>
          </div>

          <div className="mt-4 text-center">
            {formMode === 'login' ? (
              <>
                <a href="#" onClick={(e) => { e.preventDefault(); setFormMode('register') }} className="text-sm text-[#001f3f] font-medium">Create student account</a>
                <div className="mt-2"><a href="#" className="text-xs text-gray-400 hover:text-gray-600 font-medium">Forgot password?</a></div>
              </>
            ) : (
              <a href="#" onClick={(e) => { e.preventDefault(); setFormMode('login') }} className="text-sm text-[#001f3f] font-medium">Already have an account? Sign in</a>
            )}
          </div>

          {message && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}

          {/* Footer inside form container */}
          <div className="mt-10 text-center">
            <p className="text-[10px] text-gray-400 mb-2">© 2024 EduTrack Institutional Systems.</p>
            <div className="flex justify-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
              <a href="#" className="hover:text-gray-700">Help Desk</a>
              <span>•</span>
              <a href="#" className="hover:text-gray-700">Privacy Policy</a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;