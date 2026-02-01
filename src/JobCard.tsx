import { Coins, FileText, PocketKnife } from 'lucide-react'
import type { JobCard as JobCardType } from './types'

interface Props {
  job: JobCardType
  variant?: 'tall' | 'short'
}

function printedLabel(posted: string): string {
  const date = new Date(posted)
  if (Number.isNaN(date.getTime())) return `printed on ${posted}`
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  const diffMs = today.getTime() - date.getTime()
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (days === 0) return `printed today on ${posted}`
  if (days === 1) return `printed 1 day ago on ${posted}`
  return `printed ${days} days ago on ${posted}`
}

export function JobCard({ job, variant }: Props) {
  const className = ['job-card', variant && `job-card--${variant}`].filter(Boolean).join(' ')
  const hasSkills = job.skills.length > 0
  const hasDescription = job.descriptionExcerpt && job.descriptionExcerpt.trim().length > 0

  return (
    <article className={className}>
      <h2 className="job-card__title">{job.title}</h2>
      <p className="job-card__company">{job.company}</p>

      <div className="job-card__salary-row">
        <Coins className="job-card__salary-icon" aria-hidden />
        {job.salaryDisplay && (
          <span className="job-card__salary-pill">{job.salaryDisplay}</span>
        )}
      </div>

      <hr className="job-card__rule" aria-hidden />

      {hasDescription && (
        <p className="job-card__description">
          <FileText className="job-card__description-icon" aria-hidden />
          {job.descriptionExcerpt}
        </p>
      )}

      {hasSkills && (
        <>
          <p className="job-card__skills-label">
            <PocketKnife className="job-card__salary-icon" aria-hidden style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
            Skills
          </p>
          <div className="job-card__skills-list">
            {job.skills.slice(0, 10).map((skill) => (
              <span key={skill} className="job-card__skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </>
      )}

      <footer className="job-card__footer">
        <span className="job-card__location">{job.location}</span>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="job-card__apply"
        >
          APPLY
        </a>
      </footer>
      {job.posted && (
        <p className="job-card__printed">{printedLabel(job.posted)}</p>
      )}
    </article>
  )
}
