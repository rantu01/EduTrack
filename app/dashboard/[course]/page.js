import Link from 'next/link'

export default function CoursePage({ params }) {
  const { course } = params
  const displayTitle = {
    math101: 'Math 101: Calculus I',
    cs101: 'CS 101: Intro to Programming',
    phy101: 'Physics 101',
  }[course] || course

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{displayTitle}</h1>
          <p className="text-sm text-gray-500">Course overview and quick links.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-[#001f3f]">Back to dashboard</Link>
      </div>

      <div className="grid gap-4">
        <div className="p-4 bg-white rounded shadow">Announcements and recent activity for {displayTitle}.</div>
        <div className="p-4 bg-white rounded shadow">Assignments — <Link href="#" className="text-blue-600">View</Link></div>
        <div className="p-4 bg-white rounded shadow">Resources — syllabus, lecture notes, links.</div>
      </div>
    </section>
  )
}
