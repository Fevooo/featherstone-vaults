import type { APIRoute } from 'astro'

export const GET: APIRoute = () => {
  const commit = process.env.COMMIT_REF ?? process.env.GITHUB_SHA ?? 'local'

  return new Response(commit, {
    headers: {
      'content-type': 'text/plain',
      'x-robots-tag': 'noindex',
    },
  })
}
