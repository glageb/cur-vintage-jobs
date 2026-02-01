import type { JobCard, UserJobRecord } from '../types'

const STORAGE_KEY = 'wanted-job-posts-user'

function load(): UserJobRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function save(records: UserJobRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // ignore
  }
}

/** All user job records (draft, published, unpublished) */
export function getAllUserJobs(): UserJobRecord[] {
  return load()
}

/** Only published user jobs as JobCard for merging into search view */
export function getPublishedUserJobs(): JobCard[] {
  return load()
    .filter((j) => j.status === 'published')
    .map(({ status, updatedAt, ...card }) => card)
}

export function saveUserJob(record: UserJobRecord): void {
  const list = load()
  const idx = list.findIndex((j) => j.id === record.id)
  const withTimestamp = {
    ...record,
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  }
  if (idx >= 0) {
    list[idx] = withTimestamp
  } else {
    list.push(withTimestamp)
  }
  save(list)
}

export function deleteUserJob(id: string): void {
  save(load().filter((j) => j.id !== id))
}

export function updateUserJobStatus(id: string, status: UserJobRecord['status']): void {
  const list = load()
  const job = list.find((j) => j.id === id)
  if (!job) return
  job.status = status
  job.updatedAt = new Date().toISOString()
  save(list)
}

export function getUserJob(id: string): UserJobRecord | undefined {
  return load().find((j) => j.id === id)
}
