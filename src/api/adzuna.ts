import type { AdzunaSearchResponse, JobCard } from '../types'

const APP_ID = import.meta.env.VITE_ADZUNA_APP_ID
const APP_KEY = import.meta.env.VITE_ADZUNA_APP_KEY
const BASE =
  import.meta.env.DEV
    ? '/api/adzuna/jobs'
    : 'https://api.adzuna.com/v1/api/jobs'

function buildUrl(country: string, page: number, what: string, where: string): string {
  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: APP_KEY,
    results_per_page: '20',
    ...(what && { what }),
    ...(where && { where }),
  })
  return `${BASE}/${country}/search/${page}?${params}`
}

function formatSalaryDisplay(job: AdzunaSearchResponse['results'][0]): string | undefined {
  if (job.salary_min == null && job.salary_max == null) return undefined
  const min = job.salary_min != null ? `${(job.salary_min / 1000).toFixed(0)}k` : ''
  const max = job.salary_max != null ? `${(job.salary_max / 1000).toFixed(0)}k` : ''
  return [min, max].filter(Boolean).join('–') || undefined
}

function formatDescriptionExcerpt(job: AdzunaSearchResponse['results'][0]): string | undefined {
  if (!job.description) return undefined
  const plain = job.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!plain) return undefined
  const maxLen = 120
  return plain.length <= maxLen ? plain : plain.slice(0, maxLen).trim() + '…'
}

function formatPosted(created?: string): string | undefined {
  if (!created) return undefined
  const date = created.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined
}

function formatSnippet(job: AdzunaSearchResponse['results'][0]): string {
  const parts: string[] = []
  if (job.salary_min != null || job.salary_max != null) {
    const min = job.salary_min != null ? `${(job.salary_min / 1000).toFixed(0)}k` : ''
    const max = job.salary_max != null ? `${(job.salary_max / 1000).toFixed(0)}k` : ''
    parts.push([min, max].filter(Boolean).join('–'))
  }
  if (job.contract_time) {
    const ct = job.contract_time.toLowerCase()
    if (ct === 'full_time') parts.push('Full-time')
    else if (ct === 'part_time') parts.push('Part-time')
    else if (ct === 'contract') parts.push('Contract')
    else parts.push(job.contract_time)
  }
  if (job.contract_type?.toLowerCase() === 'permanent') parts.push('Permanent')
  if (parts.length === 0 && job.description) {
    const first = job.description.replace(/<[^>]+>/g, ' ').trim().slice(0, 60)
    parts.push(first + (first.length >= 60 ? '…' : ''))
  }
  return parts.length ? parts.join(' · ') : 'Apply for details.'
}

function toJobCard(job: AdzunaSearchResponse['results'][0]): JobCard {
  return {
    id: String(job.id),
    title: job.title || 'Position',
    company: job.company?.display_name ?? 'Company',
    location: job.location?.display_name ?? '—',
    salaryDisplay: formatSalaryDisplay(job),
    snippet: formatSnippet(job),
    posted: formatPosted(job.created),
    descriptionExcerpt: formatDescriptionExcerpt(job),
    skills: [],
    url: job.redirect_url,
  }
}

/** Raw job fields needed for LLM skill extraction */
export interface JobForExtraction {
  id: string
  title: string
  description?: string
}

export async function searchJobs(
  country: string,
  page: number,
  what: string,
  where: string
): Promise<{ total: number; cards: JobCard[]; rawJobsForSkills: JobForExtraction[] }> {
  const url = buildUrl(country, page, what.trim(), where.trim())
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Adzuna API error: ${res.status}`)
  const data: AdzunaSearchResponse = await res.json()
  const results = data.results ?? []
  return {
    total: data.count ?? 0,
    cards: results.map(toJobCard),
    rawJobsForSkills: results.map((r) => ({
      id: String(r.id),
      title: r.title ?? '',
      description: r.description ?? '',
    })),
  }
}

export const COUNTRY_OPTIONS = [
  { value: 'gb', label: 'United Kingdom' },
  { value: 'us', label: 'United States' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'at', label: 'Austria' },
  { value: 'br', label: 'Brazil' },
  { value: 'in', label: 'India' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'pl', label: 'Poland' },
  { value: 'ru', label: 'Russia' },
  { value: 'sg', label: 'Singapore' },
  { value: 'za', label: 'South Africa' },
  { value: 'mx', label: 'Mexico' },
  { value: 'fr', label: 'France' },
  { value: 'it', label: 'Italy' },
  { value: 'es', label: 'Spain' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'ca', label: 'Canada' },
  { value: 'nz', label: 'New Zealand' },
  { value: 'ie', label: 'Ireland' },
  { value: 'be', label: 'Belgium' },
  { value: 'pt', label: 'Portugal' },
  { value: 'tr', label: 'Turkey' },
] as const
