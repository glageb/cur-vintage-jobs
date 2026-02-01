/**
 * Call the extract-skills backend (LLM) to get skills for each job.
 * Returns skillsByJobId and optional error message if server is down or key missing.
 * Currently unused – re-enable by uncommenting the LLM call in App.tsx and the server handler in server/index.js.
 */
export interface JobForExtraction {
  id: string
  title: string
  description?: string
}

export interface ExtractSkillsResult {
  skillsByJobId: Record<string, string[]>
  error?: string
}

const EXTRACT_URL =
  import.meta.env.DEV ? '/api/extract-skills' : '/api/extract-skills'

export async function extractSkillsViaLLM(
  jobs: JobForExtraction[]
): Promise<ExtractSkillsResult> {
  if (!jobs.length) return { skillsByJobId: {}, error: undefined }
  const body = {
    jobs: jobs.map((j) => ({
      id: String(j.id),
      title: j.title ?? '',
      description: j.description ?? '',
    })),
  }
  try {
    const res = await fetch(EXTRACT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    const skillsByJobId = data.skillsByJobId ?? Object.fromEntries(jobs.map((j) => [String(j.id), []]))
    if (!res.ok) {
      const msg = data.error || (res.status === 503 ? 'Extract-skills server: API key not set or unavailable.' : `Request failed (${res.status}).`)
      return { skillsByJobId, error: msg }
    }
    return { skillsByJobId, error: undefined }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed.'
    return { skillsByJobId: Object.fromEntries(jobs.map((j) => [String(j.id), []])), error: msg }
  }
}
