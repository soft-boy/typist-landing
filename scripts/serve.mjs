// Tiny static server for local preview: node scripts/serve.mjs [dir] [port]
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'

const dir = resolve(process.argv[2] ?? 'src')
const port = Number(process.argv[3] ?? process.env.PORT ?? 4321)
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json',
  '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon'
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = normalize(join(dir, path))
  if (!file.startsWith(dir)) return res.writeHead(403).end()
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) return res.writeHead(404).end('Not found')
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' })
  res.end(readFileSync(file))
}).listen(port, () => console.log(`Serving ${dir} at http://localhost:${port}`))
