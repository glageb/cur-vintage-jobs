/** Result of detecting user location for job search */
export interface DetectedLocation {
  /** Adzuna country code (e.g. gb, us) */
  country: string
  /** Place name for "where" field (e.g. London, New York) */
  where: string
}

/** ipapi.co response (we only use a few fields) */
interface IpApiResponse {
  country_code?: string
  city?: string
  region?: string
  country_name?: string
}

const IPAPI_URL =
  import.meta.env.DEV ? '/api/ipapi/json/' : 'https://ipapi.co/json/'

/** Map ISO country code to Adzuna API country code */
const COUNTRY_MAP: Record<string, string> = {
  gb: 'gb',
  uk: 'gb',
  us: 'us',
  au: 'au',
  de: 'de',
  at: 'at',
  br: 'br',
  in: 'in',
  nl: 'nl',
  pl: 'pl',
  ru: 'ru',
  sg: 'sg',
  za: 'za',
  mx: 'mx',
  fr: 'fr',
  it: 'it',
  es: 'es',
  ch: 'ch',
  ca: 'ca',
  nz: 'nz',
  ie: 'ie',
  be: 'be',
  pt: 'pt',
  tr: 'tr',
}

function adzunaCountry(code: string): string {
  const lower = (code || '').toLowerCase()
  return COUNTRY_MAP[lower] ?? lower
}

/**
 * Detect location via IP (ipapi.co). No browser permission, no hang.
 * Use for "Use my location" so it works in Cursor and any browser.
 */
export function detectLocation(): Promise<DetectedLocation> {
  return fetch(IPAPI_URL, { headers: { Accept: 'application/json' } })
    .then((res) => {
      if (!res.ok) throw new Error('Could not detect location.')
      return res.json() as Promise<IpApiResponse>
    })
    .then((data) => {
      const code = data?.country_code ?? ''
      const where = data?.city ?? data?.region ?? data?.country_name ?? 'Unknown'
      return {
        country: adzunaCountry(code) || 'gb',
        where: String(where).trim() || 'Unknown',
      }
    })
    .catch((e) => {
      throw e instanceof Error ? e : new Error('Could not detect location.')
    })
}

/** Always true: IP-based detection works everywhere */
export function isGeolocationSupported(): boolean {
  return typeof fetch !== 'undefined'
}
