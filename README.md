# typist-landing

The landing page for Typist, the AI code editor that runs on your machine. This repo is public and also hosts Typist's installers in its [Releases](https://github.com/soft-boy/typist-landing/releases); the app's source stays private.

It's a plain static site (HTML, CSS and a little JavaScript) with no framework and no runtime dependencies.

## What's on the page

- **A download button that picks the right installer.** It detects macOS, Windows or Linux, plus Apple Silicon vs Intel and ARM vs x64 where the browser exposes it. It then asks GitHub for the latest release of this repo and links straight to the matching `.dmg`, `.exe` or `.AppImage`, showing the version and size and offering links for the other platforms.
- **Honest fallbacks.** With no release yet, the button reads "Download coming soon". A platform with no installer gets "Typist for Windows is coming soon" plus links to the platforms that do have one. Phones get a "this is a desktop app" message.
- **First-launch help.** Builds aren't notarized yet, so the install step walks Mac users through drag-to-Applications and the one-time **System Settings → Privacy & Security → Open Anyway** (with the matching tips for Windows SmartScreen and Linux AppImages).
- **Share previews.** Open Graph and X/Twitter tags with a 1200×630 preview image (`src/assets/og.png`), structured data for search engines, a canonical URL, favicons and a theme color.

## Develop

```bash
npm run dev
```

This serves `src/` at http://localhost:4321. There's nothing to install unless you want to regenerate the share image (see below).

```bash
npm run preview
```

This builds `dist/` and serves it at http://localhost:4322, which is exactly what gets deployed.

## Deploy

Share previews need absolute URLs, so the build fills in your site's address. It uses, in order:

1. `SITE_URL`, if you set it (for example `SITE_URL=https://typist.dev npm run build`)
2. Vercel's production URL, Netlify's `URL`, or the GitHub Pages address, detected automatically on those hosts

| Host | Setup |
| --- | --- |
| **Vercel** | Import the repo. `vercel.json` sets the build command and the `dist` output. Add `SITE_URL` once you attach a custom domain. |
| **Netlify** | Import the repo. `netlify.toml` covers the build. |
| **GitHub Pages** | Push to `main`, then set **Settings → Pages → Source** to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` deploys it. For a custom domain, add a repository variable `SITE_URL`. |

After deploying, check the preview with [opengraph.xyz](https://www.opengraph.xyz/) or by pasting the link into Slack or X. Platforms cache previews; the build adds a content hash to the image URL so a new `og.png` gets picked up.

## Publishing installers

The download button reads `https://api.github.com/repos/soft-boy/typist-landing/releases/latest` and links to the assets of the newest published (non-draft) release. To ship a new version:

1. Build the installers from the Typist repo: `npm run dist:mac` (or the release workflow there).
2. Create a release here and attach them, for example:

```bash
gh release create v0.1.0 --repo soft-boy/typist-landing --title "Typist 0.1.0" --notes "First release" path/to/Typist-0.1.0-arm64.dmg path/to/Typist-0.1.0.dmg
```

electron-builder's default file names are recognized automatically: `Typist-<ver>-arm64.dmg` (Apple Silicon), `Typist-<ver>.dmg` (Intel), `Typist Setup <ver>.exe`, `Typist-<ver>.AppImage`, `.deb`. To host releases somewhere else, change `REPO` at the top of `src/main.js` and the release links in `src/index.html`.

## Edit the share image

The image is rendered from `og/og.html` using your installed Google Chrome:

```bash
npm install
```

```bash
npm run og
```

This writes `src/assets/og.png`. Set `CHROME_PATH` to use a different Chromium.

## Files

```
src/
  index.html        page + meta tags ({{SITE_URL}} / {{BUILD_ID}} are filled in at build time)
  styles.css        Graphite theme, matching the app
  main.js           platform detection + release lookup
  assets/           logo, favicons, screenshots, share image, fonts (Geist, JetBrains Mono — both OFL)
og/og.html          source for the share image
scripts/            build.mjs, serve.mjs, og.mjs
```
