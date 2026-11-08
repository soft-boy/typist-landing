# typist-landing

The landing page for [Typist](https://github.com/soft-boy/typist), the AI code editor that runs on your machine.

It's a plain static site (HTML, CSS and a little JavaScript) with no framework and no runtime dependencies.

## What's on the page

- **A download button that picks the right installer.** It detects macOS, Windows or Linux, plus Apple Silicon vs Intel and ARM vs x64 where the browser exposes it. It then asks GitHub for the latest release of `soft-boy/typist` and links straight to the matching `.dmg`, `.exe` or `.AppImage`, showing the version and size and offering links for the other platforms.
- **A fallback when there's no installer.** If no release exists yet, or GitHub can't be reached, the button scrolls to the build-from-source steps instead of a broken link. Phones get a "this is a desktop app" message.
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

## Make the download button work

The button reads `https://api.github.com/repos/soft-boy/typist/releases/latest`. For visitors to get installers:

1. **The `soft-boy/typist` repo must be public.** Private releases can't be downloaded anonymously.
2. **Publish a GitHub release with the installers attached.** `npm run dist:mac`, `dist:win` and `dist:linux` in the Typist repo produce them. electron-builder's default file names (`Typist-1.0.0-arm64.dmg`, `Typist Setup 1.0.0.exe`, `Typist-1.0.0.AppImage`, and so on) are recognized automatically.

To point the page at a different repo, change `REPO` at the top of `src/main.js` and the links in `src/index.html`.

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
