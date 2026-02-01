import 'dotenv/config'
import express from 'express'
import OpenAI from 'openai'

const app = express()
app.use(express.json({ limit: '1mb' }))

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const PORT = process.env.EXTRACT_SERVER_PORT || 3001

const MAX_DESCRIPTION_CHARS = 4000
const MAX_SKILLS_PER_JOB = 10

function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// LLM skill extraction – disabled; return empty skills. Uncomment the block below to re-enable.
app.post('/api/extract-skills', async (req, res) => {
  const { jobs } = req.body || {}
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return res.status(400).json({ error: 'Missing or empty jobs array' })
  }
  return res.json({
    skillsByJobId: Object.fromEntries(jobs.map((j) => [String(j.id), []])),
  })

  /* --- Re-enable LLM extraction: remove the return above and uncomment from here ---
  if (!OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'OPENAI_API_KEY not configured',
      skillsByJobId: Object.fromEntries(jobs.map((j) => [String(j.id), []])),
    })
  }

  const client = new OpenAI({ apiKey: OPENAI_API_KEY })

  const jobTexts = jobs.map((j) => {
    const id = String(j.id || '')
    const title = (j.title || '').trim()
    const desc = stripHtml(j.description || '').slice(0, MAX_DESCRIPTION_CHARS)
    return { id, title, desc }
  })

  const jobIds = jobTexts.map((j) => j.id)
  const prompt = `You are a job skills analyst. For each job below, extract 5–${MAX_SKILLS_PER_JOB} skills or keywords that appear in the TITLE or DESCRIPTION. Use exact phrases from the post when possible (e.g. "Sage 50", "NVQ Level 2", "person-centred care"). Include: software/tools, technical skills, qualifications, soft skills, and domain terms. Do not invent skills; only list what is clearly mentioned.

Output format: a single JSON object. Each key must be one of the exact job IDs listed below; each value is an array of skill strings. Example: {"${jobIds[0] || 'id1'}": ["Skill A", "Skill B"], "${jobIds[1] || 'id2'}": ["Skill C"]}

Job IDs to use as keys (use these exactly): ${jobIds.join(', ')}

Job posts:
${jobTexts
  .map(
    (j) => `--- ID: ${j.id}
TITLE: ${j.title}
DESCRIPTION: ${j.desc}
---`
  )
  .join('\n\n')}

Return only the JSON object, no other text:`

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })
    let raw = completion.choices?.[0]?.message?.content?.trim() || '{}'
    if (raw.startsWith('```')) {
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) raw = match[1].trim()
    }
    let skillsByJobId = {}
    try {
      const parsed = JSON.parse(raw)
      const obj = parsed.skillsByJobId ?? parsed.data ?? parsed
      if (Array.isArray(obj)) {
        skillsByJobId = Object.fromEntries(
          obj.map((item) => [
            String(item.id ?? item.jobId ?? item.key ?? ''),
            Array.isArray(item.skills) ? item.skills : [],
          ]).filter(([k]) => k)
        )
      } else if (typeof obj === 'object' && obj !== null) {
        skillsByJobId = Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [String(k), Array.isArray(v) ? v : []])
        )
      }
    } catch (_) {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          const obj = parsed.skillsByJobId ?? parsed.data ?? parsed
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            skillsByJobId = Object.fromEntries(
              Object.entries(obj).map(([k, v]) => [String(k), Array.isArray(v) ? v : []])
            )
          }
        } catch (_) {}
      }
    }
    const result = {}
    for (const j of jobs) {
      const id = String(j.id)
      const arr = Array.isArray(skillsByJobId[id]) ? skillsByJobId[id] : (skillsByJobId[Number(j.id)] ?? [])
      result[id] = arr.slice(0, MAX_SKILLS_PER_JOB).map((s) => (typeof s === 'string' ? s.trim() : String(s)).trim()).filter(Boolean)
    }
    const totalExtracted = Object.values(result).reduce((sum, arr) => sum + arr.length, 0)
    if (totalExtracted === 0 && jobIds.length > 0) {
      console.warn('Extract-skills: no skills returned for job IDs', jobIds.slice(0, 3), '... Raw response length:', raw.length)
    }
    res.json({ skillsByJobId: result })
  } catch (err) {
    console.error('OpenAI extract-skills error:', err.message)
    res.status(500).json({
      error: err.message || 'LLM extraction failed',
      skillsByJobId: Object.fromEntries(jobs.map((j) => [String(j.id), []])),
    })
  }
  --- end re-enable --- */
})

app.listen(PORT, () => {
  console.log(`Extract-skills server on http://localhost:${PORT}`)
})
