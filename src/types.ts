/** Normalized job card for vintage UI (1930s–1950s style) */
export interface JobCard {
  id: string
  title: string
  company: string
  location: string
  /** Formatted salary range for display (e.g. "40k–50k") */
  salaryDisplay?: string
  /** One short line: contract type or telegraphic snippet when no salary */
  snippet: string
  /** Posted date YYYY-MM-DD for "printed" line */
  posted?: string
  /** Short description excerpt (~120 chars) for card body */
  descriptionExcerpt?: string
  /** Inferred skills from title + description (max 10) */
  skills: string[]
  url: string
}

/** User-posted job stored in localStorage (extends JobCard with status) */
export type UserJobStatus = 'draft' | 'published' | 'unpublished'

export interface UserJobRecord extends JobCard {
  status: UserJobStatus
  /** ISO date string for "printed" display when updated */
  updatedAt?: string
  /** Word count of description (for My job posts display) */
  wordCount?: number
}

/** Adzuna API raw result item */
export interface AdzunaJobResult {
  id: string
  title: string
  location?: { display_name?: string }
  company?: { display_name?: string }
  salary_min?: number
  salary_max?: number
  salary_is_predicted?: string
  contract_type?: string
  contract_time?: string
  redirect_url: string
  description?: string
  created?: string
}

export interface AdzunaSearchResponse {
  count: number
  results: AdzunaJobResult[]
}
