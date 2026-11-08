// Render og/og.html to src/assets/og.png (1200×630) with your installed Chrome.
//   npm run og
// Uses playwright-core with the system Chrome; set CHROME_PATH to use another Chromium.
import { chromium } from 'playwright-core'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.goto(pathToFileURL(join(root, 'og', 'og.html')).href)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(200)
await page.screenshot({ path: join(root, 'src', 'assets', 'og.png'), type: 'png' })
await browser.close()
console.log('Wrote src/assets/og.png')
