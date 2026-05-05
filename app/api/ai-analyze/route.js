import { NextResponse } from 'next/server'
import clientPromise from '../../../lib/mongodb'

async function callGemini(promptText) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY missing in environment')

 
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1/models/text-bison-001:generate?key=${key}`,
    `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${key}`,
  ]

  const body = {
    prompt: { text: promptText },
    temperature: 0.2,
    maxOutputTokens: 512,
  }

  let lastErr = null
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const txt = await res.text()
      let json
      try { json = JSON.parse(txt) } catch(e) { json = null }

      if (!res.ok) {
        lastErr = new Error(`Gemini API error at ${url}: ${res.status} ${txt}`)
        // try next endpoint
        continue
      }

      // try common response shapes
      const text = json?.candidates?.[0]?.output || json?.outputs?.[0]?.content?.[0]?.text || json?.text || txt
      return text
    } catch (err) {
      lastErr = err
    }
  }

  throw lastErr || new Error('Gemini API request failed')
}

export async function POST(request) {
  try {
    const data = await request.json()
    const { date, userId, path } = data || {}
    if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 })

    const client = await clientPromise
    const db = client.db('EduTrack')

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const query = { createdAt: { $gte: dayStart, $lt: dayEnd } }
    if (userId) query.userId = userId

    const items = await db.collection('dailyInputs').find(query).toArray()

    const count = items.length
    const avg = (key) => (count === 0 ? 0 : items.reduce((s, it) => s + (Number(it[key]) || 0), 0) / count)

    const summary = {
      count,
      avgStudyTime: Number(avg('studyTime').toFixed(2)),
      avgWorkTime: Number(avg('workTime').toFixed(2)),
      avgRestTime: Number(avg('restTime').toFixed(2)),
      sampleTasks: items.slice(0, 6).map((i) => ({ title: i.taskTitle, desc: i.taskDescription, mood: i.mood })),
    }

    // Build a clear instruction for the model to return JSON
    const prompt = `You are an assistant that analyzes a user's daily-input entries for a given date.`
      + `\n\nData summary:\n${JSON.stringify(summary, null, 2)}`
      + `\n\nReturn a JSON object with these keys: `
      + `\n- summary: short 2-4 sentence summary of the day's state.`
      + `\n- recommendedActions: an array (3-6) of concise action items (short sentences).` 
      + `\n- recommendedReading: an array (2-4) of suggested readings/resources (title + short reason).` 
      + `\n- quickTip: single short actionable tip (one sentence).` 
      + `\nMake sure the response is valid JSON only (no explanation).`;

    let aiJson = null
    try {
      const aiText = await callGemini(prompt)
      try {
        aiJson = JSON.parse(aiText)
      } catch (err) {
        const match = aiText.match(/\{[\s\S]*\}/)
        if (match) {
          try {
            aiJson = JSON.parse(match[0])
          } catch (e) {
            aiJson = { raw: aiText }
          }
        } else {
          aiJson = { raw: aiText }
        }
      }
    } catch (err) {
      console.error('Gemini call failed, using local fallback:', err.message || err)
      // Local heuristic fallback when AI call fails
      const fallbackActions = []
      if (summary.avgStudyTime < 60) fallbackActions.push('Increase focused study blocks to at least 60 minutes.')
      if (summary.avgRestTime < 30) fallbackActions.push('Schedule short 10–15 minute breaks every hour to recover.')
      if (summary.count === 0) fallbackActions.push('No entries found — log today\'s activity to get personalized advice.')
      if (fallbackActions.length === 0) fallbackActions.push('Keep your current routine; maintain consistency and rest.')

      const fallbackReading = [
        'Pomodoro Technique — short focused sessions for higher retention',
        'Active Recall study guides — practice retrieval for better memory',
      ]

      aiJson = {
        summary: `Local summary: ${summary.count} entries. Avg study ${summary.avgStudyTime} min, work ${summary.avgWorkTime} min, rest ${summary.avgRestTime} min.`,
        recommendedActions: fallbackActions,
        recommendedReading: fallbackReading,
        quickTip: 'Prioritize a short, focused study block and schedule a break afterwards.',
        fallback: true,
        error: err.message || String(err),
      }
    }

    return NextResponse.json({ success: true, data: aiJson, summary }, { status: 200 })
  } catch (err) {
    console.error('API /ai-analyze error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
