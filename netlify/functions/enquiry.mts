import type { Config, Context } from '@netlify/functions'

/**
 * Enquiry handler.
 *
 * Receives the site's four forms, validates them, and delivers them by two
 * independent channels so that a lead cannot be lost to a missing setting:
 *
 *   1. Netlify Forms. Every submission is recorded against the site. Needs no
 *      API key and no DNS, and the record survives whatever happens to email.
 *   2. Email, via Resend, when RESEND_API_KEY is set. This is the one that
 *      lands in the enquiries@ inbox with reply_to pointing at the enquirer,
 *      so a reply goes straight back to them.
 *
 * Either channel succeeding counts as delivered. Only if both fail does the
 * caller get an error, and the form then offers a prefilled mailto.
 *
 * Environment variables, all optional:
 *
 *   RESEND_API_KEY   Enables channel 2. Without it the enquiry is still
 *                    recorded by channel 1.
 *   ENQUIRY_TO       Defaults to enquiries@featherstonevaults.com.
 *   ENQUIRY_FROM     Defaults to website@featherstonevaults.com. A sending
 *                    identity, not a mailbox: the domain must be verified in
 *                    Resend, but no inbox has to exist for it. Replies go to
 *                    the enquirer via reply_to, not here.
 */

const DEFAULT_TO = 'enquiries@featherstonevaults.com'

/**
 * Must sit on a domain verified in Resend, or the send is rejected outright.
 * This is the sending subdomain, because verifying it leaves the root MX and
 * SPF, which carry the actual enquiries@ mailbox, untouched. Verify the root
 * domain instead and this has to change with it, via ENQUIRY_FROM.
 *
 * Only ever seen by the house: the enquirer receives nothing from here, and a
 * reply goes to them through reply_to.
 */
const DEFAULT_FROM = 'Featherstone Vaults <website@send.featherstonevaults.com>'

/** Declared in public/__forms.html, which is how Netlify learns the schema. */
const FORMS_PATH = '/__forms.html'

const FORM_TITLES: Record<string, string> = {
  'general-enquiry': 'General enquiry',
  'private-acquisition': 'Private acquisition brief',
  'sell-an-object': 'Object submitted for consideration',
  'private-access': 'Private Access request',
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  firstName: 'First name',
  surname: 'Surname',
  email: 'Email',
  object: 'Object',
  objectType: 'Object type',
  interest: 'Area of interest',
  interests: 'Collector interests',
  budget: 'Approximate budget',
  range: 'Acquisition range',
  value: 'Approximate value',
  description: 'Description',
  provenance: 'Known provenance',
  photographs: 'Photographs',
  notes: 'Notes',
  message: 'Message',
}

/** Submitted alongside the real fields; never part of the enquiry itself. */
const CONTROL_FIELDS = new Set(['form', 'form-name', '_confirm'])

const json = (status: number, message: string) =>
  new Response(JSON.stringify({ message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )

/**
 * Records the submission against the site's Netlify form of the same name.
 *
 * Netlify detects forms by parsing deployed HTML, so the raw field names are
 * posted here rather than the display labels used in the email. Failure is
 * reported, never thrown: this is one of two channels and must not take the
 * other one down with it.
 */
async function recordSubmission(
  origin: string,
  formName: string,
  form: FormData,
): Promise<boolean> {
  if (!FORM_TITLES[formName]) return false

  const body = new URLSearchParams()
  body.set('form-name', formName)
  for (const [key, value] of form.entries()) {
    if (CONTROL_FIELDS.has(key)) continue
    const text = String(value).trim()
    if (text) body.append(key, text)
  }

  try {
    const response = await fetch(`${origin}${FORMS_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(6000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Sends the enquiry to the house inbox. Reports failure rather than throwing.
 *
 * Failures are logged with Resend's own reason, because the other channel will
 * usually have recorded the enquiry by now and the caller is told it succeeded.
 * Without this line a rejected sender or a dead key would be invisible: the
 * forms would look healthy while no email ever arrived. Netlify function logs
 * are where to look if enquiries stop reaching the inbox.
 */
async function sendEmail(payload: Record<string, unknown>, apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      const reason = await response.text().catch(() => '')
      console.error(
        `Resend rejected the enquiry (${response.status}). Sender was "${payload.from}", ` +
          `which must be on a domain verified in Resend. ${reason}`.trim(),
      )
    }
    return response.ok
  } catch (error) {
    console.error('Resend could not be reached:', error)
    return false
  }
}

export default async (request: Request, _context: Context) => {
  if (request.method !== 'POST') {
    return json(405, 'This endpoint accepts enquiry submissions only.')
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json(400, 'That enquiry could not be read. Please try again.')
  }

  /* Honeypot — a real person never fills this in. */
  if ((form.get('_confirm') as string | null)?.trim()) {
    return json(200, 'Thank you. Your enquiry has been received.')
  }

  const formName = String(form.get('form') ?? 'general-enquiry')
  const email = String(form.get('email') ?? '').trim()

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    return json(400, 'Please give an email address we can reply to.')
  }

  /* Collect the submitted fields, keeping multi-value inputs together. */
  const entries: Array<[string, string]> = []
  for (const key of new Set(form.keys())) {
    if (CONTROL_FIELDS.has(key)) continue
    const values = form
      .getAll(key)
      .map((v) => String(v).trim())
      .filter(Boolean)
    if (!values.length) continue
    if (values.join(', ').length > 5000) {
      return json(400, 'That enquiry is longer than this form accepts. Please email us directly.')
    }
    entries.push([FIELD_LABELS[key] ?? key, values.join(', ')])
  }

  if (!entries.length) {
    return json(400, 'The form was empty.')
  }

  const title = FORM_TITLES[formName] ?? 'Website enquiry'
  const text = [title, '', ...entries.map(([k, v]) => `${k}\n${v}\n`)].join('\n')
  const html = `<h2 style="font-family:Georgia,serif">${escapeHtml(title)}</h2>${entries
    .map(
      ([k, v]) =>
        `<p style="font-family:Helvetica,Arial,sans-serif;margin:0 0 1em"><strong style="display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#777">${escapeHtml(
          k,
        )}</strong>${escapeHtml(v).replace(/\n/g, '<br>')}</p>`,
    )
    .join('')}`

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ENQUIRY_TO?.trim() || DEFAULT_TO
  const from = process.env.ENQUIRY_FROM?.trim() || DEFAULT_FROM
  const origin = process.env.URL?.trim().replace(/\/$/, '') || new URL(request.url).origin

  /* Both channels at once: neither waits on the other, and either will do. */
  const [recorded, emailed] = await Promise.all([
    recordSubmission(origin, formName, form),
    apiKey
      ? sendEmail(
          { from, to: [to], reply_to: email, subject: `[FV] ${title}`, text, html },
          apiKey,
        )
      : Promise.resolve(false),
  ])

  if (emailed || recorded) {
    return json(200, 'Thank you. Your enquiry has been received and will be answered personally.')
  }

  return json(
    apiKey ? 502 : 503,
    `That enquiry could not be sent from the site. Please write to ${DEFAULT_TO} and we will reply directly.`,
  )
}

/* Keeps the public endpoint at /api/enquiry, so the forms need no change. */
export const config: Config = {
  path: '/api/enquiry',
}
