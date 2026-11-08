// Typist landing page: platform-aware download buttons.
//
// 1. Detect the visitor's OS (and CPU architecture where the browser exposes it).
// 2. Ask GitHub for the latest release and pick the matching installer.
// 3. If there's nothing to download yet for this platform, say so plainly
//    instead of linking somewhere broken.
//
// Installers are published as GitHub Releases of this (public) site repo;
// the app's source repo is private.

const REPO = 'soft-boy/typist-landing'
const RELEASES_URL = `https://github.com/${REPO}/releases`
const CACHE_KEY = 'typist.latestRelease'

const OS_NAMES = { mac: 'macOS', windows: 'Windows', linux: 'Linux' }

const ICONS = {
  mac: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.83-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.5zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z"/></svg>',
  windows: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5.5l7.4-1v7.1H3V5.5zm0 13l7.4 1v-7H3v6zm8.3 1.13L21 21V12.6h-9.7v7.03zM11.3 4.37V11.6H21V3l-9.7 1.37z"/></svg>',
  linux: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c-2.2 0-3.6 1.9-3.6 4.6 0 1.3.3 2.3.1 3.3-.3 1.4-2.6 3.5-3.2 6.1-.3 1.2-.1 2.3.6 2.9.4.4 1.1.5 1.6.8.7.4 1.1 1.4 2.2 1.4.9 0 1.4-.6 2.3-.6.9 0 1.4.6 2.3.6 1.1 0 1.5-1 2.2-1.4.5-.3 1.2-.4 1.6-.8.7-.6.9-1.7.6-2.9-.6-2.6-2.9-4.7-3.2-6.1-.2-1 .1-2 .1-3.3C15.6 3.9 14.2 2 12 2zm-1.5 4.2c.4 0 .7.5.7 1.1 0 .6-.3 1.1-.7 1.1-.4 0-.7-.5-.7-1.1 0-.6.3-1.1.7-1.1zm3 0c.4 0 .7.5.7 1.1 0 .6-.3 1.1-.7 1.1-.4 0-.7-.5-.7-1.1 0-.6.3-1.1.7-1.1zM12 9.2c.9 0 2 .6 2 1 0 .3-1.1 1-2 1s-2-.7-2-1c0-.4 1.1-1 2-1z"/></svg>'
}

// --- Detection -------------------------------------------------------------

async function detectPlatform() {
  const uaData = navigator.userAgentData
  const ua = navigator.userAgent.toLowerCase()
  // Prefer the structured platform (Chromium); fall back to the classic strings elsewhere.
  const platform = uaData?.platform ? uaData.platform.toLowerCase() : `${navigator.platform} ${ua}`.toLowerCase()
  let os = 'unknown'
  let arch = 'unknown'

  if (uaData?.mobile || /android|iphone|ipad|ipod/.test(ua) || platform.includes('android')) os = 'mobile'
  else if (/mac|darwin/.test(platform)) os = 'mac'
  else if (/win/.test(platform)) os = 'windows'
  else if (/linux|x11|cros|chrome os|bsd/.test(platform)) os = 'linux'
  // iPadOS Safari pretends to be a Mac.
  if (os === 'mac' && navigator.maxTouchPoints > 1) os = 'mobile'

  if (uaData?.getHighEntropyValues) {
    try {
      const v = await uaData.getHighEntropyValues(['architecture', 'bitness'])
      if (v.architecture === 'arm') arch = 'arm64'
      else if (v.architecture === 'x86') arch = 'x64'
    } catch {
      /* not available */
    }
  } else if (/arm64|aarch64/.test(ua)) arch = 'arm64'
  // Safari/Firefox on Mac don't reveal the CPU; nearly every Mac sold since 2020 is Apple Silicon.
  if (os === 'mac' && arch === 'unknown') arch = 'arm64?'
  return { os, arch }
}

// --- Releases --------------------------------------------------------------

async function latestRelease() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.release
  } catch {
    /* storage unavailable */
  }
  let release = null
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' }
    })
    if (res.ok) release = await res.json()
  } catch {
    /* offline or rate-limited */
  }
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), release }))
  } catch {
    /* ignore */
  }
  return release
}

const KINDS = {
  mac: [/\.dmg$/i, /mac.*\.zip$/i, /darwin.*\.zip$/i],
  windows: [/\.exe$/i, /\.msi$/i],
  linux: [/\.AppImage$/i, /\.deb$/i, /\.rpm$/i, /\.tar\.gz$/i]
}

// electron-builder names: "Typist-1.0.0-arm64.dmg", "Typist-1.0.0.dmg" (x64), "Typist-1.0.0-universal.dmg".
function assetArch(name) {
  if (/universal/i.test(name)) return 'universal'
  if (/arm64|aarch64/i.test(name)) return 'arm64'
  return 'x64'
}

function installersFor(release, os) {
  const assets = (release?.assets || []).filter((a) => !/\.(blockmap|yml|yaml|sha\d+|sig|asc)$/i.test(a.name))
  const out = []
  ;(KINDS[os] || []).forEach((re, rank) => {
    for (const a of assets) if (re.test(a.name)) out.push({ ...a, rank, arch: assetArch(a.name) })
  })
  return out
}

function pickInstaller(release, os, arch) {
  const list = installersFor(release, os)
  if (!list.length) return null
  const want = arch.replace('?', '')
  const score = (a) => a.rank * 10 + (a.arch === 'universal' ? 0 : a.arch === want ? 1 : want === 'unknown' && a.arch === 'x64' ? 2 : 5)
  return list.sort((a, b) => score(a) - score(b))[0]
}

function archLabel(os, arch) {
  if (os === 'mac') return arch === 'universal' ? 'Universal' : arch === 'arm64' ? 'Apple Silicon' : 'Intel'
  return arch === 'arm64' ? 'ARM64' : arch === 'x64' ? 'x64' : ''
}

function formatSize(bytes) {
  return bytes ? `${Math.round(bytes / 1e6)} MB` : ''
}

function kindLabel(name) {
  const ext = name.split('.').pop()
  return ext === 'AppImage' ? 'AppImage' : ext === 'exe' ? 'Installer' : ext.toUpperCase()
}

// --- Rendering --------------------------------------------------------------

function setButtons({ href, label, icon, scrollTo, disabled }) {
  for (const el of document.querySelectorAll('[data-download]')) {
    el.href = href
    el.classList.toggle('is-disabled', !!disabled)
    if (disabled) el.setAttribute('aria-disabled', 'true')
    else el.removeAttribute('aria-disabled')
    if (scrollTo) el.dataset.scroll = scrollTo
    else delete el.dataset.scroll
    const iconEl = el.querySelector('.os-icon')
    if (iconEl) iconEl.innerHTML = icon || ''
    const labelEl = el.querySelector('[data-download-label]') || el.querySelector('#download-label')
    if (labelEl) labelEl.textContent = label
    else if (el.classList.contains('nav-cta')) el.textContent = 'Download'
  }
}

/** Links to installers for the other platforms that actually have one. */
function otherPlatformsLinks(release, os) {
  const links = []
  for (const other of ['mac', 'windows', 'linux']) {
    if (other === os) continue
    const best = pickInstaller(release, other, other === 'mac' ? 'arm64' : 'x64')
    if (best) links.push(`<a href="${best.browser_download_url}">${OS_NAMES[other]}</a>`)
  }
  return links.join(' · ')
}

/** Show the first-launch tip for the visitor's platform (macOS by default). */
function showFirstRun(os) {
  const which = os === 'windows' || os === 'linux' ? os : 'mac'
  for (const el of document.querySelectorAll('.firstrun')) el.hidden = el.dataset.for !== which
}

const AFTER_DOWNLOAD = {
  mac: 'Open <b>Typist.dmg</b> and drag Typist into Applications. The first time, macOS will ask you to confirm in <b>System Settings → Privacy &amp; Security → Open Anyway</b>.',
  windows: 'Run the installer. If SmartScreen warns you, choose <b>More info → Run anyway</b>.',
  linux: 'Make the AppImage executable (<code>chmod +x</code>) and run it.'
}

async function init() {
  const meta = document.getElementById('download-meta')
  const alt = document.getElementById('download-alt')
  const { os, arch } = await detectPlatform()
  showFirstRun(os)

  if (os === 'mobile' || os === 'unknown') {
    setButtons({ href: '#install', label: 'Get Typist for desktop', scrollTo: '#install' })
    meta.innerHTML = 'Typist is a desktop app for macOS, Windows and Linux. Open this page on your computer to download it.'
    return
  }

  const release = await latestRelease()
  const installer = release ? pickInstaller(release, os, arch) : null

  if (installer) {
    const label = `Download for ${OS_NAMES[os]}`
    setButtons({ href: installer.browser_download_url, label, icon: ICONS[os] })
    const bits = [release.tag_name, archLabel(os, installer.arch), kindLabel(installer.name), formatSize(installer.size)].filter(Boolean)
    const others = otherPlatformsLinks(release, os)
    meta.innerHTML = `${bits.join(' · ')}${others ? ` — also for ${others}` : ''} · <a href="${release.html_url || RELEASES_URL}">all downloads</a>`
    if (os === 'mac' && installer.arch !== 'universal') {
      const intel = installersFor(release, 'mac').find((a) => a.arch === (installer.arch === 'arm64' ? 'x64' : 'arm64'))
      if (intel) {
        alt.hidden = false
        alt.innerHTML = `On ${installer.arch === 'arm64' ? 'an Intel' : 'an Apple Silicon'} Mac? <a href="${intel.browser_download_url}">Get that build instead</a>.`
      }
    }
    for (const el of document.querySelectorAll('[data-download]')) {
      el.addEventListener('click', () => {
        alt.hidden = false
        alt.innerHTML = AFTER_DOWNLOAD[os]
      })
    }
    return
  }

  // Nothing to download for this platform yet.
  const others = release ? otherPlatformsLinks(release, os) : ''
  setButtons({ href: '#install', label: release ? `Typist for ${OS_NAMES[os]} is coming soon` : 'Download coming soon', icon: ICONS[os], disabled: true })
  meta.innerHTML = others
    ? `Available now for ${others}.`
    : 'The first release is on its way — check back soon.'
  const step3 = document.getElementById('step3-text')
  if (step3) step3.textContent = release ? `Typist for ${OS_NAMES[os]} is coming soon.` : 'The first release is on its way — check back soon.'
}

// --- Small niceties ----------------------------------------------------------

document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-scroll]')
  if (link) {
    e.preventDefault()
    document.querySelector(link.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' })
  }
  const copy = e.target.closest('.copy')
  if (copy) {
    navigator.clipboard?.writeText(copy.dataset.copy).then(() => {
      copy.textContent = 'Copied'
      copy.classList.add('done')
      setTimeout(() => {
        copy.textContent = 'Copy'
        copy.classList.remove('done')
      }, 1600)
    })
  }
})

const nav = document.querySelector('.nav')
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8)
window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

init()
