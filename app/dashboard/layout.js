import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AuthGuard from '../components/AuthGuard'

export const metadata = {
  title: 'Student Dashboard',
}

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <AuthGuard>
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">{children}</main>
      </AuthGuard>
      <Footer />
    </div>
  )
}
