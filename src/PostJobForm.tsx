import { useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { saveUserJob } from './api/userJobs'
import type { UserJobRecord, UserJobStatus } from './types'

const MAX_DESCRIPTION_WORDS = 15
const MAX_SKILLS = 8
const CONDITIONS_OPTIONS = ['Full-time', 'Part-time', 'Remote', 'Hybrid', 'In office'] as const
/** Full-time and Part-time are mutually exclusive. */
const WORK_TYPE_GROUP = ['Full-time', 'Part-time'] as const
/** Remote, Hybrid, and In office are mutually exclusive. */
const WORK_PLACE_GROUP = ['Remote', 'Hybrid', 'In office'] as const
/** Contract type: Permanent or Temporary (mutually exclusive, optional). */
const CONTRACT_TYPE_OPTIONS = ['Permanent', 'Temporary'] as const

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function trimToMaxWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, max).join(' ')
}

export interface PostJobFormValues {
  title: string
  company: string
  description: string
  skills: string[]
  location: string
  contractType: '' | 'Permanent' | 'Temporary'
  conditions: string[]
  payMin: string
  payMax: string
}

const emptyForm: PostJobFormValues = {
  title: '',
  company: '',
  description: '',
  skills: [],
  location: '',
  contractType: '',
  conditions: [],
  payMin: '',
  payMax: '',
}

function buildUserJobRecord(
  values: PostJobFormValues,
  status: UserJobStatus,
  existingId?: string
): UserJobRecord {
  const id = existingId ?? `user-${Date.now()}`
  const today = new Date().toISOString().slice(0, 10)
  const snippetParts = [values.contractType, ...values.conditions].filter(Boolean)
  const snippet = snippetParts.length > 0 ? snippetParts.join(' · ') : '—'
  const desc = values.description.trim()
  const descriptionExcerpt = desc.length > 120 ? desc.slice(0, 120).trim() + '…' : desc || undefined
  const skills = values.skills.slice(0, 10)

  let salaryDisplay: string | undefined
  const min = values.payMin.trim().replace(/k$/i, '')
  const max = values.payMax.trim().replace(/k$/i, '')
  if (min || max) {
    const fmt = (v: string) => {
      const n = parseFloat(v)
      if (Number.isNaN(n)) return v
      return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}k`
    }
    const minStr = min ? fmt(min) : ''
    const maxStr = max ? fmt(max) : ''
    salaryDisplay = [minStr, maxStr].filter(Boolean).join('–') || undefined
  }

  return {
    id,
    title: values.title.trim() || 'Position',
    company: values.company.trim() || 'Company',
    location: values.location.trim() || '—',
    salaryDisplay,
    snippet,
    posted: status === 'published' ? today : undefined,
    descriptionExcerpt,
    skills,
    url: '#',
    status,
    updatedAt: new Date().toISOString(),
    wordCount: countWords(values.description),
  }
}

interface PostJobFormProps {
  initial?: UserJobRecord | null
  onClose: () => void
  onSaved: () => void
}

export function PostJobForm({ initial, onClose, onSaved }: PostJobFormProps) {
  const [values, setValues] = useState<PostJobFormValues>(() => {
    if (initial) {
      const payParts = initial.salaryDisplay?.split(/[–-]/) ?? []
      const parts = initial.snippet && initial.snippet !== '—' ? initial.snippet.split(' · ').filter(Boolean) : []
      const contractType = parts.includes('Permanent') ? 'Permanent' : parts.includes('Temporary') ? 'Temporary' : ''
      const conditions = parts.filter((p) => p !== 'Permanent' && p !== 'Temporary')
      return {
        title: initial.title,
        company: initial.company,
        description: initial.descriptionExcerpt ?? '',
        skills: initial.skills ?? [],
        location: initial.location,
        contractType,
        conditions,
        payMin: payParts[0]?.replace(/k$/i, '') ?? '',
        payMax: payParts[1]?.replace(/k$/i, '') ?? '',
      }
    }
    return { ...emptyForm }
  })

  const [skillInput, setSkillInput] = useState('')
  const [editingSkillIndex, setEditingSkillIndex] = useState<number | null>(null)
  const [editingSkillValue, setEditingSkillValue] = useState('')

  const wordCount = countWords(values.description)
  const overLimit = wordCount > MAX_DESCRIPTION_WORDS

  const update = useCallback(<K extends keyof PostJobFormValues>(key: K, value: PostJobFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setContractType = useCallback((value: '' | 'Permanent' | 'Temporary') => {
    setValues((prev) => ({ ...prev, contractType: prev.contractType === value ? '' : value }))
  }, [])

  const toggleCondition = useCallback((label: string) => {
    setValues((prev) => {
      const isChecked = prev.conditions.includes(label)
      let next: string[]
      if (isChecked) {
        next = prev.conditions.filter((c) => c !== label)
      } else {
        const withoutSameGroup = prev.conditions.filter((c) => {
          if (WORK_TYPE_GROUP.includes(label as typeof WORK_TYPE_GROUP[number]))
            return !WORK_TYPE_GROUP.includes(c as typeof WORK_TYPE_GROUP[number])
          if (WORK_PLACE_GROUP.includes(label as typeof WORK_PLACE_GROUP[number]))
            return !WORK_PLACE_GROUP.includes(c as typeof WORK_PLACE_GROUP[number])
          return true
        })
        next = [...withoutSameGroup, label]
      }
      return { ...prev, conditions: next }
    })
  }, [])

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const raw = e.target.value
      if (countWords(raw) > MAX_DESCRIPTION_WORDS) {
        update('description', trimToMaxWords(raw, MAX_DESCRIPTION_WORDS))
      } else {
        update('description', raw)
      }
    },
    [update]
  )

  const addSkill = useCallback(() => {
    const trimmed = skillInput.trim()
    if (!trimmed || values.skills.length >= MAX_SKILLS) return
    update('skills', [...values.skills, trimmed])
    setSkillInput('')
  }, [skillInput, values.skills, update])

  const removeSkill = useCallback(
    (index: number) => {
      update(
        'skills',
        values.skills.filter((_, i) => i !== index)
      )
      if (editingSkillIndex === index) {
        setEditingSkillIndex(null)
        setEditingSkillValue('')
      } else if (editingSkillIndex != null && editingSkillIndex > index) {
        setEditingSkillIndex(editingSkillIndex - 1)
      }
    },
    [values.skills, update, editingSkillIndex]
  )

  const startEditSkill = useCallback((index: number) => {
    setEditingSkillIndex(index)
    setEditingSkillValue(values.skills[index] ?? '')
  }, [values.skills])

  const saveEditSkill = useCallback(() => {
    if (editingSkillIndex == null) return
    const trimmed = editingSkillValue.trim()
    if (trimmed) {
      const next = [...values.skills]
      next[editingSkillIndex] = trimmed
      update('skills', next)
    }
    setEditingSkillIndex(null)
    setEditingSkillValue('')
  }, [editingSkillIndex, editingSkillValue, values.skills, update])

  const cancelEditSkill = useCallback(() => {
    setEditingSkillIndex(null)
    setEditingSkillValue('')
  }, [])

  const moveSkill = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const next = [...values.skills]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return
      ;[next[index], next[target]] = [next[target], next[index]]
      update('skills', next)
      if (editingSkillIndex === index) setEditingSkillIndex(target)
      else if (editingSkillIndex === target) setEditingSkillIndex(index)
    },
    [values.skills, update, editingSkillIndex]
  )

  const hasContract = values.contractType === 'Permanent' || values.contractType === 'Temporary'
  const hasType = WORK_TYPE_GROUP.some((opt) => values.conditions.includes(opt))
  const hasLocation = WORK_PLACE_GROUP.some((opt) => values.conditions.includes(opt))
  const hasJobAttributes = hasContract && hasType && hasLocation

  const handleSubmit = useCallback(
    (status: UserJobStatus) => (e: React.FormEvent) => {
      e.preventDefault()
      if (overLimit) return
      if (!values.title.trim() || !values.company.trim() || !values.location.trim()) return
      if (!values.description.trim()) return
      if (!hasJobAttributes) return

      const record = buildUserJobRecord(values, status, initial?.id)
      saveUserJob(record)
      onSaved()
      onClose()
    },
    [values, overLimit, hasJobAttributes, initial?.id, onSaved, onClose]
  )

  const canPublish =
    !overLimit &&
    hasJobAttributes &&
    values.title.trim().length > 0 &&
    values.company.trim().length > 0 &&
    values.location.trim().length > 0 &&
    values.description.trim().length > 0

  return (
    <form className="post-job-form" onSubmit={(e) => e.preventDefault()}>
      <h2 className="post-job-form__title">Place an ad</h2>

      <div className="form-group">
        <label htmlFor="post-job-title">Job title *</label>
        <input
          id="post-job-title"
          type="text"
          value={values.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="e.g. Bookkeeper"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="post-job-company">Company name *</label>
        <input
          id="post-job-company"
          type="text"
          value={values.company}
          onChange={(e) => update('company', e.target.value)}
          placeholder="e.g. Acme Co."
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="post-job-desc">
          Job description * <span className="post-job-form__word-count">Words: {wordCount} / {MAX_DESCRIPTION_WORDS}</span>
        </label>
        <textarea
          id="post-job-desc"
          value={values.description}
          onChange={handleDescriptionChange}
          placeholder="Brief description (max 15 words)."
          rows={3}
          className={overLimit ? 'post-job-form__input--error' : ''}
        />
        {overLimit && <span className="post-job-form__error">Maximum {MAX_DESCRIPTION_WORDS} words.</span>}
      </div>

      <div className="form-group">
        <span className="post-job-form__label">Skills (optional, up to {MAX_SKILLS})</span>
        <div className="post-job-form__skills-add">
          <input
            id="post-job-skill"
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="e.g. React, Excel"
          />
          <button
            type="button"
            className="form-button--secondary post-job-form__add-btn"
            onClick={addSkill}
            disabled={!skillInput.trim() || values.skills.length >= MAX_SKILLS}
          >
            Add
          </button>
        </div>
        {values.skills.length > 0 && (
          <ul className="post-job-form__skills-list">
            {values.skills.map((skill, index) => (
              <li key={`${skill}-${index}`} className="post-job-form__skill-row">
                {editingSkillIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editingSkillValue}
                      onChange={(e) => setEditingSkillValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditSkill()
                        if (e.key === 'Escape') cancelEditSkill()
                      }}
                      className="post-job-form__skill-edit-input"
                      autoFocus
                    />
                    <button type="button" onClick={saveEditSkill} className="post-job-form__skill-btn">Save</button>
                    <button type="button" onClick={cancelEditSkill} className="post-job-form__skill-btn">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="post-job-form__skill-text">{skill}</span>
                    <div className="post-job-form__skill-actions">
                      <button type="button" onClick={() => moveSkill(index, 'up')} disabled={index === 0} className="post-job-form__skill-btn" aria-label="Move up"><ChevronUp size={14} /></button>
                      <button type="button" onClick={() => moveSkill(index, 'down')} disabled={index === values.skills.length - 1} className="post-job-form__skill-btn" aria-label="Move down"><ChevronDown size={14} /></button>
                      <button type="button" onClick={() => startEditSkill(index)} className="post-job-form__skill-btn" aria-label="Edit"><Pencil size={14} /></button>
                      <button type="button" onClick={() => removeSkill(index)} className="post-job-form__skill-btn" aria-label="Delete"><Trash2 size={14} /></button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="post-job-location">Place *</label>
        <input
          id="post-job-location"
          type="text"
          value={values.location}
          onChange={(e) => update('location', e.target.value)}
          placeholder="e.g. London"
          required
        />
      </div>

      <fieldset className="post-job-form__fieldset">
        <legend className="post-job-form__legend">Job Attributes *</legend>
        <div className="form-group">
          <span className="post-job-form__label">Contract</span>
          <div className="post-job-form__conditions post-job-form__conditions--inline">
            {CONTRACT_TYPE_OPTIONS.map((opt) => (
              <label key={opt} className="post-job-form__checkbox-label">
                <input
                  type="checkbox"
                  checked={values.contractType === opt}
                  onChange={() => setContractType(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <span className="post-job-form__label">Type</span>
          <div className="post-job-form__conditions post-job-form__conditions--inline">
            {WORK_TYPE_GROUP.map((opt) => (
              <label key={opt} className="post-job-form__checkbox-label">
                <input
                  type="checkbox"
                  checked={values.conditions.includes(opt)}
                  onChange={() => toggleCondition(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <span className="post-job-form__label">Location</span>
          <div className="post-job-form__conditions post-job-form__conditions--inline">
            {WORK_PLACE_GROUP.map((opt) => (
              <label key={opt} className="post-job-form__checkbox-label">
                <input
                  type="checkbox"
                  checked={values.conditions.includes(opt)}
                  onChange={() => toggleCondition(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <div className="form-group post-job-form__pay">
        <span className="post-job-form__label">Pay range (optional)</span>
        <div className="post-job-form__pay-row">
          <input
            type="text"
            inputMode="numeric"
            value={values.payMin}
            onChange={(e) => update('payMin', e.target.value)}
            placeholder="Min (e.g. 30k)"
          />
          <span>–</span>
          <input
            type="text"
            inputMode="numeric"
            value={values.payMax}
            onChange={(e) => update('payMax', e.target.value)}
            placeholder="Max (e.g. 50k)"
          />
        </div>
      </div>

      <div className="post-job-form__actions">
        <button type="button" className="form-button--secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="form-button--secondary"
          onClick={handleSubmit('draft')}
          disabled={!values.title.trim() || !values.company.trim() || !values.location.trim() || !values.description.trim() || !hasJobAttributes || overLimit}
        >
          Save as draft
        </button>
        <button
          type="button"
          className="post-job-form__submit"
          onClick={handleSubmit('published')}
          disabled={!canPublish}
        >
          Place ad
        </button>
      </div>
    </form>
  )
}
