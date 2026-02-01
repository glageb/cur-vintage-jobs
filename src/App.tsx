import { useState, useCallback } from 'react'
import { searchJobs, COUNTRY_OPTIONS } from './api/adzuna'
import {
  getPublishedUserJobs,
  getAllUserJobs,
  getUserJob,
  updateUserJobStatus,
  deleteUserJob,
} from './api/userJobs'
// import { extractSkillsViaLLM } from './api/extractSkills' // LLM skill extraction – uncomment to re-enable
import { detectLocation, isGeolocationSupported } from './api/geo'
import { JobCard } from './JobCard'
import { PostJobForm } from './PostJobForm'
import type { JobCard as JobCardType, UserJobRecord } from './types'
import './App.css'

const RESULTS_PER_PAGE = 20

export default function App() {
  const [country, setCountry] = useState('gb')
  const [where, setWhere] = useState('')
  const [what, setWhat] = useState('')
  const [page, setPage] = useState(1)
  const [cards, setCards] = useState<JobCardType[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [postJobOpen, setPostJobOpen] = useState(false)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [userJobsList, setUserJobsList] = useState<UserJobRecord[]>(() => getAllUserJobs())

  const refreshUserJobs = useCallback(() => {
    setUserJobsList(getAllUserJobs())
  }, [])

  const publishedUserJobs = getPublishedUserJobs()
  const displayCards =
    page === 1
      ? [...publishedUserJobs, ...cards].slice(0, RESULTS_PER_PAGE)
      : cards
  const displayTotal = page === 1 ? publishedUserJobs.length + total : total
  const totalPages = Math.max(1, Math.ceil(displayTotal / RESULTS_PER_PAGE))
  // const [skillsError, setSkillsError] = useState<string | null>(null) // for LLM skill extraction – uncomment when re-enabling

  async function handleUseMyLocation() {
    setError(null)
    setDetectingLocation(true)
    try {
      const { country: c, where: w } = await detectLocation()
      setCountry(c)
      setWhere(w)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not detect location.')
    } finally {
      setDetectingLocation(false)
    }
  }

  async function handleSearch(nextPage = 1) {
    setError(null)
    setLoading(true)
    try {
      const { total: count, cards: list, rawJobsForSkills } = await searchJobs(
        country,
        nextPage,
        what,
        where
      )
      setCards(list)
      setTotal(count)
      setPage(nextPage)
      setLoading(false)
      // LLM skill extraction disabled – uncomment below and extractSkillsViaLLM import to re-enable
      // if (rawJobsForSkills.length > 0) {
      //   setSkillsError(null)
      //   extractSkillsViaLLM(rawJobsForSkills).then(({ skillsByJobId, error: extractError }) => {
      //     setSkillsError(extractError ?? null)
      //     setCards((prev) =>
      //       prev.map((c) => ({
      //         ...c,
      //         skills:
      //           (skillsByJobId[String(c.id)]?.length > 0)
      //             ? skillsByJobId[String(c.id)]
      //             : c.skills,
      //       }))
      //     )
      //   })
      // } else {
      //   setSkillsError(null)
      // }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
      setCards([])
      setTotal(0)
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Help Wanted</h1>
        <p>Job listings — simple as the want ads.</p>
      </header>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          handleSearch(1)
        }}
      >
        <div className="form-group">
          <label htmlFor="country">Region</label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="where">Location</label>
          <input
            id="where"
            type="text"
            placeholder="e.g. London"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
          />
        </div>
        {isGeolocationSupported() && (
          <button
            type="button"
            className="form-button--secondary"
            onClick={handleUseMyLocation}
            disabled={detectingLocation || loading}
          >
            {detectingLocation ? 'Detecting…' : 'Use my location'}
          </button>
        )}
        <div className="form-group">
          <label htmlFor="what">Keyword</label>
          <input
            id="what"
            type="text"
            placeholder="e.g. developer"
            value={what}
            onChange={(e) => setWhat(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditingJobId(null)
            setPostJobOpen(true)
          }}
          className="form-button--secondary"
        >
          Post a job
        </button>
      </form>

      {(postJobOpen || editingJobId) && (
        <div
          className="post-job-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPostJobOpen(false)
              setEditingJobId(null)
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-job-title"
        >
          <div className="post-job-modal" onClick={(e) => e.stopPropagation()}>
            <PostJobForm
              initial={editingJobId ? getUserJob(editingJobId) ?? null : null}
              onClose={() => {
                setPostJobOpen(false)
                setEditingJobId(null)
              }}
              onSaved={() => {
                refreshUserJobs()
                setEditingJobId(null)
              }}
            />
          </div>
        </div>
      )}

      {userJobsList.length > 0 && (
        <section className="my-jobs">
          <h2 className="my-jobs__header">My job posts</h2>
          <div className="my-jobs__list">
            {userJobsList.map((job) => {
              const words =
                job.wordCount ??
                (job.descriptionExcerpt
                  ? job.descriptionExcerpt
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean).length
                  : 0)
              return (
              <div key={job.id} className="my-jobs__row">
                <div className="my-jobs__main">
                  <span className="my-jobs__title">{job.title} — {job.company}</span>
                  <span className="my-jobs__meta">
                    {job.location}
                    {` · ${words} word${words === 1 ? '' : 's'}`}
                  </span>
                </div>
                <span
                  className={`my-jobs__badge my-jobs__badge--${job.status}`}
                  aria-label={`Status: ${job.status}`}
                >
                  {job.status}
                </span>
                <div className="my-jobs__actions">
                  {(job.status === 'draft' || job.status === 'unpublished') && (
                    <button
                      type="button"
                      onClick={() => {
                        updateUserJobStatus(job.id, 'published')
                        refreshUserJobs()
                      }}
                    >
                      Publish
                    </button>
                  )}
                  {job.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => {
                        updateUserJobStatus(job.id, 'unpublished')
                        refreshUserJobs()
                      }}
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingJobId(job.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteUserJob(job.id)
                      refreshUserJobs()
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </section>
      )}

      <p className="help-wanted">
        Pick a region and location (or use “Use my location” to detect), then search. Results appear as short cards — tap “See ad” to open the full listing.
      </p>

      {error && (
        <div className="status error">{error}</div>
      )}

      {!error && displayCards.length === 0 && !loading && (
        <div className="status">
          Choose a region and location, then click Search to see job cards. Or post a job to list it here.
        </div>
      )}

      {/* Skills error banner – uncomment when re-enabling LLM skill extraction */}
      {/* {skillsError && (
        <div className="status" style={{ background: '#fef3cd', color: '#856404', marginTop: '0.5rem' }}>
          Skills unavailable: {skillsError} Start the extract-skills server (<code>npm run server</code>) and set <code>OPENAI_API_KEY</code> in the server&apos;s <code>.env</code>.
        </div>
      )} */}

      {!error && (displayCards.length > 0 || cards.length > 0) && (
        <>
          <div className="cards-results-bar">
            <p className="status" style={{ padding: '0 0 0.5rem', textAlign: 'left', margin: 0 }}>
              {displayTotal} result{displayTotal !== 1 ? 's' : ''} — page {page} of {totalPages}
            </p>
          </div>
          <div className="cards">
            {displayCards.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                variant={index % 4 === 0 ? 'tall' : index % 4 === 2 ? 'short' : undefined}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => handleSearch(page - 1)}
              >
                Previous
              </button>
              <span className="status" style={{ padding: '0.4rem 0.75rem' }}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => handleSearch(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
