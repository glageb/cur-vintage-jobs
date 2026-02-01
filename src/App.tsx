import { useState } from 'react'
import { searchJobs, COUNTRY_OPTIONS } from './api/adzuna'
// import { extractSkillsViaLLM } from './api/extractSkills' // LLM skill extraction – uncomment to re-enable
import { detectLocation, isGeolocationSupported } from './api/geo'
import { JobCard } from './JobCard'
import type { JobCard as JobCardType } from './types'
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

  const totalPages = Math.max(1, Math.ceil(total / RESULTS_PER_PAGE))

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
      </form>

      <p className="help-wanted">
        Pick a region and location (or use “Use my location” to detect), then search. Results appear as short cards — tap “See ad” to open the full listing.
      </p>

      {error && (
        <div className="status error">{error}</div>
      )}

      {!error && cards.length === 0 && !loading && (
        <div className="status">
          Choose a region and location, then click Search to see job cards.
        </div>
      )}

      {/* Skills error banner – uncomment when re-enabling LLM skill extraction */}
      {/* {skillsError && (
        <div className="status" style={{ background: '#fef3cd', color: '#856404', marginTop: '0.5rem' }}>
          Skills unavailable: {skillsError} Start the extract-skills server (<code>npm run server</code>) and set <code>OPENAI_API_KEY</code> in the server&apos;s <code>.env</code>.
        </div>
      )} */}

      {!error && cards.length > 0 && (
        <>
          <div className="cards-results-bar">
            <p className="status" style={{ padding: '0 0 0.5rem', textAlign: 'left', margin: 0 }}>
              {total} result{total !== 1 ? 's' : ''} — page {page} of {totalPages}
            </p>
          </div>
          <div className="cards">
            {cards.map((job, index) => (
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
