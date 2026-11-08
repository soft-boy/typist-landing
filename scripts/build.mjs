// Build the static site into dist/.
// Share previews need absolute URLs, so SITE_URL is filled in at build time:
//   SITE_URL env  →  Vercel / Netlify / GitHub Pages env vars  →  localhost (with a warning)
import { createHash } from 'node:crypto'
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'src')
const dist = join(root, 'dist')

function siteUrl() {
  const env = process.env
  if (env.SITE_URL) return env.SITE_URL
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  if (env.NETLIFY && env.URL) return env.URL
  if (env.GITHUB_REPOSITORY) {
    const [owner, repo] = env.GITHUB_REPOSITORY.split('/')
    return repo.toLowerCase() === `${owner.toLowerCase()}.github.io` ? `https://${repo}` : `https://${owner}.github.io/${repo}`
  }
  return null
}

const url = (siteUrl() ?? 'http://localhost:4321').replace(/\/+$/, '')
if (!siteUrl()) console.warn('⚠ SITE_URL is not set — share previews need your real URL, e.g. SITE_URL=https://typist.example npm run build')

// A content hash so updated images/styles bust social and browser caches.
const hash = createHash('sha1')
for (const f of ['assets/og.png', 'styles.css', 'main.js']) if (existsSync(join(src, f))) hash.update(readFileSync(join(src, f)))
const buildId = hash.digest('hex').slice(0, 8)

rmSync(dist, { recursive: true, force: true })
cpSync(src, dist, { recursive: true })

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(html|xml|txt|json|webmanifest)$/.test(name)) {
      writeFileSync(p, readFileSync(p, 'utf8').replaceAll('{{SITE_URL}}', url).replaceAll('{{BUILD_ID}}', buildId))
    }
  }
}
walk(dist)
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${url}/sitemap.xml\n`)
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url}/</loc></url></urlset>\n`
)
console.log(`Built dist/ for ${url} (build ${buildId})`)
