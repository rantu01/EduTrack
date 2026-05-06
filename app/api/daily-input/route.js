import { NextResponse } from 'next/server'
import clientPromise from '../../../lib/mongodb'

function timeToMinutes(time) {
  if (!time || typeof time !== 'string' || !time.includes(':')) return 0
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function getSegmentDuration(segment) {
  const explicitDuration = Number(segment?.durationMinutes)
  if (Number.isFinite(explicitDuration) && explicitDuration > 0) return explicitDuration

  const startTime = segment?.startTime
  const endTime = segment?.endTime
  if (!startTime || !endTime) return 0

  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  return endMinutes > startMinutes ? endMinutes - startMinutes : endMinutes + 1440 - startMinutes
}

function getActivityBucket(activity) {
  const normalized = String(activity || '').toLowerCase()
  if (normalized === 'assignment' || normalized === 'reading') return 'study'
  if (normalized === 'study' || normalized === 'work' || normalized === 'rest' || normalized === 'mobile' || normalized === 'game') {
    return normalized
  }
  return 'other'
}

export async function POST(request) {
  try {
    const data = await request.json()
    if (!data || !data.userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    if (!data.taskTitle || data.taskTitle.trim().length === 0) {
      return NextResponse.json({ error: 'taskTitle is required' }, { status: 400 })
    }
    const segments = Array.isArray(data.segments) ? data.segments : []

    let aggStudy = Number(data.studyTime || 0)
    let aggWork = Number(data.workTime || 0)
    let aggRest = Number(data.restTime || 0)
    let aggMobile = Number(data.mobileTime || 0)
    let aggGame = Number(data.gameTime || 0)
    let aggDistractions = Number(data.distractions || 0)
    let aggDistractionTime = Number(data.distractionTime || 0)
    let accountedTime = 0

    if (segments.length > 0) {
      aggStudy = 0
      aggWork = 0
      aggRest = 0
      aggMobile = 0
      aggGame = 0
      aggDistractions = 0
      aggDistractionTime = 0

      for (const segment of segments) {
        const duration = getSegmentDuration(segment)
        const bucket = getActivityBucket(segment.activity)
        const distractionMinutes = Number(segment?.distractionMinutes || 0)

        if (bucket === 'study') aggStudy += duration
        else if (bucket === 'work') aggWork += duration
        else if (bucket === 'rest') aggRest += duration
        else if (bucket === 'mobile') aggMobile += duration
        else if (bucket === 'game') aggGame += duration

        aggDistractionTime += distractionMinutes
        if (distractionMinutes > 0) {
          aggDistractions += 1
        }

        if (bucket !== 'other') {
          accountedTime += duration
        }
      }
    }

    const normalizedSegments = segments.map((segment) => ({
      ...segment,
      distractionMinutes: segment?.distractionMinutes ?? '',
      distractionReason: segment?.distractionReason ?? '',
    }))

    const derivedUnaccounted = Math.max(0, 1440 - accountedTime)

    const toInsert = {
      userId: data.userId,
      mood: data.mood || null,
      upcomingDeadline: data.upcomingDeadline || null,
      taskTitle: data.taskTitle,
      taskDescription: data.taskDescription || '',
      studyTime: aggStudy,
      workTime: aggWork,
      restTime: aggRest,
      // additional metrics
      segments: segments,
      mobileTime: aggMobile,
      gameTime: aggGame,
      distractions: aggDistractions,
      distractionTime: aggDistractionTime,
      unaccountedTime: Number.isFinite(Number(data.unaccountedTime)) && Number(data.unaccountedTime) > 0 ? Number(data.unaccountedTime) : derivedUnaccounted,
      unaccountedActivity: data.unaccountedActivity || '',
      deadlines: Array.isArray(data.deadlines) ? data.deadlines : [],
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      createdAt: new Date(),
    }

    const client = await clientPromise
    const db = client.db('EduTrack')
    const result = await db.collection('dailyInputs').insertOne(toInsert)
    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 })
  } catch (err) {
    console.error('API /daily-input error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('EduTrack')

    const insights = url.searchParams.get('insights')
    if (insights === 'weekly') {
      const since = new Date()
      since.setDate(since.getDate() - 7)

      const items = await db
        .collection('dailyInputs')
        .find({ userId, createdAt: { $gte: since } })
        .toArray()

      const count = items.length
      const avg = (key) => (count === 0 ? 0 : items.reduce((s, it) => s + (Number(it[key]) || 0), 0) / count)

      const avgMobile = (count === 0 ? 0 : items.reduce((s,it)=> s + (Number(it.mobileTime)||0),0)/count)
      const avgGame = (count === 0 ? 0 : items.reduce((s,it)=> s + (Number(it.gameTime)||0),0)/count)
      const avgDistr = (count === 0 ? 0 : items.reduce((s,it)=> s + (Number(it.distractions)||0),0)/count)

      const response = {
        success: true,
        count,
        avgStudyTime: Number(avg('studyTime').toFixed(2)),
        avgWorkTime: Number(avg('workTime').toFixed(2)),
        avgRestTime: Number(avg('restTime').toFixed(2)),
        avgMobileTime: Number(avgMobile.toFixed(2)),
        avgGameTime: Number(avgGame.toFixed(2)),
        avgDistractions: Number(avgDistr.toFixed(2)),
        moods: items.map((it) => it.mood).filter(Boolean),
      }

      return NextResponse.json(response, { status: 200 })
    }

    const items = await db
      .collection('dailyInputs')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ success: true, items }, { status: 200 })
  } catch (err) {
    console.error('API /daily-input GET error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
