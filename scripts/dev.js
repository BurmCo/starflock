#!/usr/bin/env node
// Local dev server — serves docs/ with the import map rewritten to ../src/index.js
// so the browser always loads the local starflock source instead of esm.sh.

import { createServer } from 'http'
import { readFileSync } from 'fs'
import { extname, resolve, sep } from 'path'

const PORT  = process.env.PORT ?? 3000
const ROOT  = new URL('../docs', import.meta.url).pathname
const SRC   = new URL('../src',  import.meta.url).pathname

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
}

// Containment by design: survives future changes like percent-decoding
// (traversal was previously blocked only by WHATWG URL dot-segment normalization)
function safeJoin(root, urlPath) {
  const path = resolve(root, '.' + urlPath)
  return path === root || path.startsWith(root + sep) ? path : null
}

createServer((req, res) => {
  let urlPath = new URL(req.url, 'http://localhost').pathname
  if (urlPath === '/') urlPath = '/index.html'

  // Serve src/* for the bare 'starflock' import map entry
  if (urlPath.startsWith('/src/')) {
    const filePath = safeJoin(SRC, urlPath.slice('/src'.length))
    if (!filePath) { res.writeHead(404); res.end('Not found'); return }
    serve(res, filePath)
    return
  }

  const filePath = safeJoin(ROOT, urlPath)
  if (!filePath) { res.writeHead(404); res.end('Not found'); return }
  serve(res, filePath, urlPath === '/index.html' ? patch : null)
}).listen(PORT, '127.0.0.1', () => {
  console.log(`starflock dev  →  http://localhost:${PORT}`)
})

function patch(html) {
  return html.replace(
    '"starflock": "https://esm.sh/starflock"',
    '"starflock": "/src/index.js"',
  )
}

function serve(res, filePath, transform = null) {
  try {
    let body = readFileSync(filePath, transform ? 'utf8' : null)
    if (transform) body = transform(body)
    const mime = MIME[extname(filePath)] ?? 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': mime })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
}
