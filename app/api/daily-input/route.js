import { NextResponse } from 'next/server'
import clientPromise from '../../../lib/mongodb'

export async function POST(request) {
  try {
    const data = await request.json()
    if (!data || !data.userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    if (!data.taskTitle || data.taskTitle.trim().length === 0) {
      return NextResponse.json({ error: 'taskTitle is required' }, { status: 400 })
    }

    const toInsert = {
      userId: data.userId,
      mood: data.mood || null,
      upcomingDeadline: data.upcomingDeadline || null,
      taskTitle: data.taskTitle,
      taskDescription: data.taskDescription || '',
      studyTime: Number(data.studyTime || 0),
      workTime: Number(data.workTime || 0),
      restTime: Number(data.restTime || 0),
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

      const response = {
        success: true,
        count,
        avgStudyTime: Number(avg('studyTime').toFixed(2)),
        avgWorkTime: Number(avg('workTime').toFixed(2)),
        avgRestTime: Number(avg('restTime').toFixed(2)),
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
