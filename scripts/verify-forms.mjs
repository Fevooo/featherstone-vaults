/**
 * Checks that every field the site's forms submit is declared in
 * public/__forms.html.
 *
 * Netlify learns a form's schema by parsing the deployed HTML, and silently
 * discards any field it was not told about. A field added to a form but not to
 * the declaration would therefore go missing from the recorded enquiry with no
 * error anywhere. Runs after the build so that cannot ship.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname

const fieldNames = (html) =>
  new Set(
    [...html.matchAll(/<(?:input|select|textarea)\b[^>]*\bname="([^"]+)"/g)].map((m) => m[1]),
  )

/* The forms as built, keyed by the hidden "form" value the handler reads. */
const live = new Map()
for (const file of readdirSync(DIST).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(DIST, file), 'utf8')
  for (const [, form] of html.matchAll(/<form\b([^]*?)<\/form>/g)) {
    const name = form.match(/name="form"\s+value="([^"]+)"/)?.[1]
    if (name) live.set(name, { file, fields: fieldNames(form) })
  }
}

/* The declaration Netlify will read. */
const declared = new Map()
for (const [, attrs, inner] of readFileSync(join(DIST, '__forms.html'), 'utf8').matchAll(
  /<form\b([^>]*)>([^]*?)<\/form>/g,
)) {
  const name = attrs.match(/name="([^"]+)"/)?.[1]
  if (name) declared.set(name, fieldNames(inner))
}

const problems = []
for (const [name, { file, fields }] of live) {
  const schema = declared.get(name)
  if (!schema) {
    problems.push(`${name} (${file}) is not declared in public/__forms.html`)
    continue
  }
  const missing = [...fields].filter((f) => f !== 'form' && !schema.has(f))
  if (missing.length) {
    problems.push(`${name}: Netlify would discard ${missing.join(', ')}`)
  }
}
for (const name of declared.keys()) {
  if (!live.has(name)) problems.push(`declared form "${name}" matches no form on the site`)
}

if (problems.length) {
  console.error('\nForm declarations are out of sync with the forms:\n')
  for (const p of problems) console.error(`  - ${p}`)
  console.error('\nUpdate public/__forms.html to match.\n')
  process.exit(1)
}

console.log(`Forms verified: ${live.size} forms, all fields declared.`)
