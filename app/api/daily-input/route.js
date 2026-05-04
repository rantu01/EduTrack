import { NextResponse } from 'next/server'
import clientPromise from '../../../lib/mongodb'

export async function POST(request) {
  try {
    const data = await request.json()
    const client = await clientPromise
    const db = client.db('EduTrack')
    const result = await db.collection('dailyInputs').insertOne({ ...data, createdAt: new Date() })
    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 })
  } catch (err) {
    console.error('API /daily-input error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
